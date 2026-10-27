from . import api_v1


@api_v1.get("/health")
def health():
    # Deliberately outside the {"data": ...} envelope: it is a smoke-test endpoint.
    return {"status": "ok"}, 200
