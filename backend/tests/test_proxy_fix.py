"""Behind nginx, rate limits must see the visitor's address, not the proxy's."""

from flask import request

from app import create_app


def _client_address(app, headers):
    @app.get("/_test/remote-addr")
    def remote_addr():
        return {"addr": request.remote_addr}

    return app.test_client().get("/_test/remote-addr", headers=headers).get_json()["addr"]


def test_forwarded_address_is_used_behind_one_proxy(monkeypatch):
    monkeypatch.setenv("PROXY_COUNT", "1")
    app = create_app("testing")
    assert _client_address(app, {"X-Forwarded-For": "203.0.113.7"}) == "203.0.113.7"


def test_forwarded_header_is_ignored_without_a_proxy(monkeypatch):
    monkeypatch.setenv("PROXY_COUNT", "0")
    app = create_app("testing")
    assert _client_address(app, {"X-Forwarded-For": "203.0.113.7"}) == "127.0.0.1"
