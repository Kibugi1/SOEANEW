from flask import abort

from app.extensions import db
from app.schemas.common import MAX_PER_PAGE

LATEST_ON_DETAIL = 5  # how many recent stories a detail page embeds


def paginate(statement, args: dict):
    """Run a SELECT with page/per_page from already-validated query args."""
    return db.paginate(
        statement,
        page=args["page"],
        per_page=args["per_page"],
        max_per_page=MAX_PER_PAGE,
        error_out=False,  # a page past the end returns an empty list, not an error
        count=True,
    )


def first_or_404(statement):
    """The first row of a public SELECT, or a 404 (unknown and unpublished look identical)."""
    row = db.session.scalars(statement).first()
    if row is None:
        abort(404)
    return row


def like_pattern(text: str) -> str:
    """Escape LIKE wildcards so a search for '%' or '_' is literal."""
    escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def collection_response(data: list, pagination) -> dict:
    return {
        "data": data,
        "meta": {
            "pagination": {
                "page": pagination.page,
                "per_page": pagination.per_page,
                "total": pagination.total,
                "pages": pagination.pages,
            }
        },
    }


def item_response(data) -> dict:
    return {"data": data}
