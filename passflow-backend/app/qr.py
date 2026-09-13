import uuid
import qrcode


def generate_qr_token():
    return str(uuid.uuid4())


def generate_qr_image(token):

    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4
    )

    qr.add_data(token)
    qr.make(fit=True)

    image = qr.make_image()

    return image