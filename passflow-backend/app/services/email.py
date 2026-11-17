import html
import logging
import os
import re
from urllib.parse import quote, urlsplit

import resend
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM")
BACKEND_URL = os.getenv("PASSFLOW_BACKEND_URL")


def _validate_email_config():
    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not configured")

    sender_match = re.fullmatch(
        r"(?:[^<>]*<([^<>\s]+)>|([^<>\s]+))",
        EMAIL_FROM.strip() if EMAIL_FROM else "",
    )
    sender_address = (
        sender_match.group(1) or sender_match.group(2)
        if sender_match
        else ""
    )
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", sender_address):
        raise RuntimeError("EMAIL_FROM must be a valid sender email address")

    if not BACKEND_URL or any(character.isspace() for character in BACKEND_URL):
        raise RuntimeError("PASSFLOW_BACKEND_URL must be a valid HTTPS base URL")

    parsed_url = urlsplit(BACKEND_URL)
    if (
        parsed_url.scheme != "https"
        or not parsed_url.hostname
        or parsed_url.username
        or parsed_url.password
        or parsed_url.query
        or parsed_url.fragment
    ):
        raise RuntimeError("PASSFLOW_BACKEND_URL must be a valid HTTPS base URL")

    return BACKEND_URL.rstrip("/")


def _mask_email(email):
    local_part, separator, domain = email.partition("@")
    if not separator:
        return "invalid-email"
    return f"{local_part[:1]}***@{domain}"


def send_outpass_request(parent_email, student, outpass, approval_token):
    recipient = parent_email.strip() if parent_email else ""
    masked_recipient = _mask_email(recipient)
    logger.info(
        "Starting parent approval email for outpass_id=%s recipient=%s",
        outpass.id,
        masked_recipient,
    )

    try:
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", recipient):
            raise RuntimeError("Parent email address is missing or invalid")

        backend_url = _validate_email_config()
        resend.api_key = RESEND_API_KEY

        encoded_token = quote(approval_token, safe="._-")
        approve_url = html.escape(
            f"{backend_url}/parent/email/approve/{encoded_token}",
            quote=True,
        )
        reject_url = html.escape(
            f"{backend_url}/parent/email/reject/{encoded_token}",
            quote=True,
        )
        student_name = html.escape(str(student.name))
        roll_number = html.escape(str(student.roll_number))
        destination = html.escape(str(outpass.destination))
        outpass_date = html.escape(str(outpass.date))
        departure_time = html.escape(str(outpass.departure_time))
        expected_return_time = html.escape(str(outpass.expected_return_time))

        html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background:#f4f7fb; padding:30px;">

        <div style="
            max-width:600px;
            margin:auto;
            background:white;
            padding:30px;
            border-radius:12px;
        ">

            <h2 style="color:#1e40af;">PassFlow</h2>

            <h3>Outpass Approval Required</h3>

            <p>Hello Parent,</p>

            <p>
                Your student has submitted an outpass request.
                Please review the details below.
            </p>

            <hr>

            <p><strong>Student:</strong> {student_name}</p>
            <p><strong>Roll Number:</strong> {roll_number}</p>
            <p><strong>Destination:</strong> {destination}</p>
            <p><strong>Date:</strong> {outpass_date}</p>
            <p><strong>Departure:</strong> {departure_time}</p>
            <p><strong>Expected Return:</strong> {expected_return_time}</p>

            <br>

            <a href="{approve_url}"
               style="
               display:inline-block;
               background:#16a34a;
               color:white;
               padding:14px 25px;
               text-decoration:none;
               border-radius:7px;
               margin-right:10px;
               ">
               ✓ Approve
            </a>

            <a href="{reject_url}"
               style="
               display:inline-block;
               background:#dc2626;
               color:white;
               padding:14px 25px;
               text-decoration:none;
               border-radius:7px;
               ">
               ✕ Reject
            </a>

            <br><br>

            <p style="color:#666;font-size:13px;">
                This approval link is valid for 24 hours.
            </p>

        </div>

    </body>
    </html>
    """

        response = resend.Emails.send({
            "from": EMAIL_FROM,
            "to": [recipient],
            "subject": "PassFlow - Outpass Approval Required",
            "html": html_body,
        })

        response_id = getattr(response, "id", None)
        if isinstance(response, dict):
            response_id = response.get("id", response_id)
        if not response_id:
            raise RuntimeError("Resend response did not include an email ID")
        logger.info(
            "Resend accepted parent approval email for outpass_id=%s resend_email_id=%s",
            outpass.id,
            response_id,
        )
        return response
    except Exception as error:
        error_message = str(error)
        for secret in (RESEND_API_KEY, approval_token, recipient):
            if secret:
                error_message = error_message.replace(secret, "[redacted]")
        logger.error(
            "Parent approval email failed for outpass_id=%s recipient=%s error=%s",
            outpass.id,
            masked_recipient,
            error_message,
        )
        raise RuntimeError(f"Parent approval email failed: {error_message}") from error
