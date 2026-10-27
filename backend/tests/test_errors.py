def test_unknown_route_uses_error_envelope(client):
    resp = client.get("/api/v1/does-not-exist")
    assert resp.status_code == 404
    error = resp.get_json()["error"]
    assert error["code"] == "NOT_FOUND"
    assert error["message"]
    assert error["request_id"] == resp.headers["X-Request-ID"]


def test_wrong_method_uses_error_envelope(client):
    resp = client.post("/api/v1/health")
    assert resp.status_code == 405
    assert resp.get_json()["error"]["code"] == "METHOD_NOT_ALLOWED"


def test_unhandled_exception_returns_generic_500(app):
    app.config["PROPAGATE_EXCEPTIONS"] = False

    @app.get("/boom")
    def boom():
        raise RuntimeError("secret internal detail")

    resp = app.test_client().get("/boom")
    assert resp.status_code == 500
    assert resp.get_json()["error"]["code"] == "INTERNAL_SERVER_ERROR"
    assert "secret internal detail" not in resp.get_data(as_text=True)
