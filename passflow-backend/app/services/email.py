import os
import resend
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM")
BACKEND_URL = os.getenv("PASSFLOW_BACKEND_URL")

resend.api_key = RESEND_API_KEY


def send_outpass_request(parent_email, student, outpass, approval_token):

    approve_url = (
        f"{BACKEND_URL}/parent/email/approve/{approval_token}"
    )

    reject_url = (
        f"{BACKEND_URL}/parent/email/reject/{approval_token}"
    )

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

            <p><strong>Student:</strong> {student.name}</p>
            <p><strong>Roll Number:</strong> {student.roll_number}</p>
            <p><strong>Destination:</strong> {outpass.destination}</p>
            <p><strong>Date:</strong> {outpass.date}</p>
            <p><strong>Departure:</strong> {outpass.departure_time}</p>
            <p><strong>Expected Return:</strong> {outpass.expected_return_time}</p>

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

    try:

        response = resend.Emails.send({
            "from": EMAIL_FROM,
            "to": [parent_email],
            "subject": "PassFlow - Outpass Approval Required",
            "html": html_body,
        })

        print("Email sent successfully:", response)

    except Exception as e:
        raise Exception(f"Email sending failed: {str(e)}")