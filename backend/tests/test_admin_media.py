import io

import pytest
from PIL import Image

from app.extensions import db
from app.models import MediaAsset, Partner, UserRole

from admin_helpers import auth, make_user, token_for


@pytest.fixture()
def media_client(app, tmp_path):
    app.config["UPLOAD_DIR"] = str(tmp_path)
    with app.app_context():
        db.create_all()
        make_user("rozalia@example.org", UserRole.ADMIN)
        make_user("editor@example.org", UserRole.EDITOR)
        make_user("author@example.org", UserRole.AUTHOR)
        make_user("other-author@example.org", UserRole.AUTHOR)
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def image_bytes(fmt="JPEG", size=(64, 48), exif_gps=False):
    image = Image.new("RGB", size, (30, 120, 60))
    buffer = io.BytesIO()
    kwargs = {}
    if exif_gps:
        exif = Image.Exif()
        exif[0x010F] = "PhoneMaker"          # Make
        exif[0x8825] = {1: "S", 2: (1.0, 17.0, 0.0)}  # GPSInfo
        kwargs["exif"] = exif
    image.save(buffer, fmt, **kwargs)
    return buffer.getvalue()


def upload(client, token, data, filename="photo.jpg", alt_text=None):
    form = {"file": (io.BytesIO(data), filename)}
    if alt_text is not None:
        form["alt_text"] = alt_text
    return client.post(
        "/api/v1/admin/media", data=form, headers=auth(token), content_type="multipart/form-data",
    )


# --- Uploading -----------------------------------------------------------------------------

@pytest.mark.parametrize("fmt, mime", [("JPEG", "image/jpeg"), ("PNG", "image/png"), ("WEBP", "image/webp")])
def test_upload_image(media_client, app, tmp_path, fmt, mime):
    token = token_for(media_client, "author@example.org")
    response = upload(media_client, token, image_bytes(fmt), alt_text="Waste pickers at Dandora")

    assert response.status_code == 201, response.get_json()
    data = response.get_json()["data"]
    assert data["kind"] == "image"
    assert data["mime_type"] == mime
    assert (data["width"], data["height"]) == (64, 48)
    assert data["alt_text"] == "Waste pickers at Dandora"
    assert data["url"].startswith("http://testserver/media/")
    assert data["uploaded_by"]["full_name"] == "Author"

    asset = db.session.query(MediaAsset).one()
    assert (tmp_path / asset.storage_key).is_file()
    assert asset.storage_key.endswith((".jpg", ".png", ".webp"))
    assert "photo" not in asset.storage_key  # stored under a random name


def test_upload_strips_location_metadata(media_client, tmp_path):
    token = token_for(media_client, "author@example.org")
    original = image_bytes(exif_gps=True)
    assert Image.open(io.BytesIO(original)).getexif()  # the fixture really has EXIF

    upload(media_client, token, original)
    asset = db.session.query(MediaAsset).one()
    stored = Image.open(tmp_path / asset.storage_key)
    assert not stored.getexif()


def test_large_images_are_scaled_down(media_client, app):
    app.config["MAX_IMAGE_DIMENSION"] = 100
    token = token_for(media_client, "editor@example.org")
    data = upload(media_client, token, image_bytes(size=(400, 200))).get_json()["data"]
    assert (data["width"], data["height"]) == (100, 50)


def test_upload_pdf_document(media_client):
    token = token_for(media_client, "editor@example.org")
    pdf = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"
    data = upload(media_client, token, pdf, filename="baseline-summary.pdf").get_json()["data"]
    assert data["kind"] == "document"
    assert data["mime_type"] == "application/pdf"
    assert data["original_filename"] == "baseline-summary.pdf"


@pytest.mark.parametrize("payload, filename", [
    (b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "logo.svg"),
    (b"just some text pretending to be a photo", "photo.jpg"),
    (b"GIF89a" + b"\x00" * 20, "anim.gif"),
    (b"", "empty.jpg"),
])
def test_rejects_unsafe_or_unreadable_files(media_client, payload, filename):
    token = token_for(media_client, "editor@example.org")
    response = upload(media_client, token, payload, filename=filename)
    assert response.status_code == 400
    assert "file" in response.get_json()["error"]["details"]
    assert db.session.query(MediaAsset).count() == 0


def test_rejects_oversized_image(media_client, app):
    app.config["MAX_IMAGE_BYTES"] = 100
    token = token_for(media_client, "editor@example.org")
    response = upload(media_client, token, image_bytes())
    assert response.status_code == 400


def test_missing_file_and_login_required(media_client):
    token = token_for(media_client, "editor@example.org")
    response = media_client.post("/api/v1/admin/media", data={}, headers=auth(token))
    assert response.status_code == 400
    assert media_client.post("/api/v1/admin/media").status_code == 401


@pytest.mark.parametrize("filename", ["../../etc/photo.jpg", "..\\..\\etc\\photo.jpg"])
def test_original_filename_cannot_carry_a_path(media_client, filename):
    """The original name is display-only and keeps no directory parts."""
    token = token_for(media_client, "editor@example.org")
    data = upload(media_client, token, image_bytes(), filename=filename).get_json()["data"]
    assert "/" not in data["original_filename"] and "\\" not in data["original_filename"]
    assert data["original_filename"].endswith("photo.jpg")


# --- Serving ----------------------------------------------------------------------------------

def test_uploaded_file_is_served_with_safe_headers(media_client):
    token = token_for(media_client, "editor@example.org")
    data = upload(media_client, token, image_bytes()).get_json()["data"]
    path = data["url"].replace("http://testserver", "")

    response = media_client.get(path)
    assert response.status_code == 200
    assert response.mimetype == "image/jpeg"
    assert response.headers["X-Content-Type-Options"] == "nosniff"


def test_pdf_is_served_sandboxed(media_client):
    token = token_for(media_client, "editor@example.org")
    data = upload(media_client, token, b"%PDF-1.4\n%%EOF", filename="r.pdf").get_json()["data"]
    response = media_client.get(data["url"].replace("http://testserver", ""))
    assert response.headers["Content-Security-Policy"] == "sandbox"


def test_media_route_refuses_path_traversal(media_client):
    assert media_client.get("/media/../app/config.py").status_code == 404
    assert media_client.get("/media/%2e%2e/run.py").status_code == 404


# --- Managing ------------------------------------------------------------------------------------

def test_authors_see_and_manage_only_their_own_files(media_client):
    mine = token_for(media_client, "author@example.org")
    theirs = token_for(media_client, "other-author@example.org")
    editor = token_for(media_client, "editor@example.org")

    asset_id = upload(media_client, mine, image_bytes()).get_json()["data"]["id"]
    upload(media_client, theirs, image_bytes())

    assert media_client.get("/api/v1/admin/media", headers=auth(mine)).get_json()["meta"]["pagination"]["total"] == 1
    assert media_client.get("/api/v1/admin/media", headers=auth(editor)).get_json()["meta"]["pagination"]["total"] == 2
    assert media_client.get(f"/api/v1/admin/media/{asset_id}", headers=auth(theirs)).status_code == 404
    assert media_client.delete(f"/api/v1/admin/media/{asset_id}", headers=auth(theirs)).status_code == 404

    patched = media_client.patch(
        f"/api/v1/admin/media/{asset_id}", json={"alt_text": "Community clean-up"}, headers=auth(mine),
    )
    assert patched.get_json()["data"]["alt_text"] == "Community clean-up"


def test_list_filters_by_kind(media_client):
    token = token_for(media_client, "editor@example.org")
    upload(media_client, token, image_bytes())
    upload(media_client, token, b"%PDF-1.4\n%%EOF", filename="r.pdf")
    response = media_client.get("/api/v1/admin/media?kind=document", headers=auth(token))
    assert response.get_json()["meta"]["pagination"]["total"] == 1


def test_file_in_use_cannot_be_deleted(media_client, tmp_path):
    token = token_for(media_client, "editor@example.org")
    data = upload(media_client, token, image_bytes(fmt="PNG"), filename="logo.png").get_json()["data"]
    asset = db.session.get(MediaAsset, __import__("uuid").UUID(data["id"]))
    db.session.add(Partner(slug="mr-green", name="Mr. Green", partner_type="business", logo_id=asset.id))
    db.session.commit()

    detail = media_client.get(f"/api/v1/admin/media/{data['id']}", headers=auth(token)).get_json()["data"]
    assert detail["in_use"] == 1
    assert media_client.delete(f"/api/v1/admin/media/{data['id']}", headers=auth(token)).status_code == 409

    db.session.query(Partner).delete()
    db.session.commit()
    key = asset.storage_key
    assert media_client.delete(f"/api/v1/admin/media/{data['id']}", headers=auth(token)).status_code == 204
    assert not (tmp_path / key).exists()
