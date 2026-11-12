from flask import request
from sqlalchemy.orm import selectinload

from app.api.helpers import collection_response, paginate
from app.models import Partner, public_partners
from app.schemas.partner import PartnerListQuerySchema, PartnerListSchema

from . import api_v1


@api_v1.get("/partners")
def list_partners():
    args = PartnerListQuerySchema().load(request.args.to_dict())

    statement = public_partners().options(selectinload(Partner.areas))

    if args.get("type"):
        statement = statement.where(Partner.partner_type == args["type"])

    page = paginate(statement, args)
    data = PartnerListSchema(many=True).dump(page.items)

    return collection_response(data, page)