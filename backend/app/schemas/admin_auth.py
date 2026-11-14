from marshmallow import Schema, fields, validate


class AdminLoginSchema(Schema):
    email = fields.Email(
        required=True,
        validate=validate.Length(max=254),
    )
    password = fields.String(
        required=True,
        validate=validate.Length(min=1, max=256),
    )
