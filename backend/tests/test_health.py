def test_health_returns_ok(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}


def test_root_returns_json(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.is_json
    assert resp.get_json()["health"] == "/api/v1/health"
