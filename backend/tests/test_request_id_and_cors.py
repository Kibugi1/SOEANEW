def test_request_id_is_generated(client):
    resp = client.get("/api/v1/health")
    assert len(resp.headers["X-Request-ID"]) == 32


def test_safe_request_id_is_echoed(client):
    resp = client.get("/api/v1/health", headers={"X-Request-ID": "frontend-abc_123"})
    assert resp.headers["X-Request-ID"] == "frontend-abc_123"


def test_unsafe_request_id_is_replaced(client):
    resp = client.get("/api/v1/health", headers={"X-Request-ID": "bad id with spaces!"})
    assert resp.headers["X-Request-ID"] != "bad id with spaces!"


def test_cors_allows_the_local_frontend_only(client):
    allowed = client.get("/api/v1/health", headers={"Origin": "http://localhost:3000"})
    assert allowed.headers["Access-Control-Allow-Origin"] == "http://localhost:3000"

    blocked = client.get("/api/v1/health", headers={"Origin": "http://evil.example"})
    assert "Access-Control-Allow-Origin" not in blocked.headers
