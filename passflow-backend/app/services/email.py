import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")
BACKEND_URL = os.getenv("PASSFLOW_BACKEND_URL")


def send_outpass_request(parent_email, student, outpass, approval_token):

    approve_url = f"{BACKEND_URL}/parent/email/approve/{approval_token}"
    reject_url = f"{BACKEND_URL}/parent/email/reject/{approval_token}"

    message = EmailMessage()

    message["Subject"] = "PassFlow - Outpass Approval Required"
    message["From"] = EMAIL_ADDRESS
    message["To"] = parent_email

    # Plain-text fallback
    text_body = f"""
Dear Parent,

Your child has requested an outpass through PassFlow.

Student Details
-------------------------
Name: {student.name}
Roll Number: {student.roll_number}
Department: {student.department}
Room Number: {student.room_number}

Outpass Details
-------------------------
Date: {outpass.date}
Destination: {outpass.destination}
Departure Time: {outpass.departure_time}
Expected Return: {outpass.expected_return_time}

Approve:
{approve_url}

Reject:
{reject_url}

Regards,
PassFlow
"""

    message.set_content(text_body)

    # HTML email
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PassFlow Outpass Approval</title>
</head>

<body style="
    margin:0;
    padding:0;
    background-color:#f4f7fb;
    font-family:Arial, sans-serif;
">

<div style="
    max-width:600px;
    margin:30px auto;
    background:white;
    border-radius:12px;
    padding:30px;
    box-shadow:0 4px 15px rgba(0,0,0,0.08);
">

    <h2 style="
        color:#1e40af;
        text-align:center;
        margin-bottom:10px;
    ">
        PassFlow
    </h2>

    <h3 style="text-align:center;">
        Outpass Approval Required
    </h3>

    <p>
        Dear Parent,
    </p>

    <p>
        Your child has requested an outpass through PassFlow.
        Please review the details below.
    </p>

    <div style="
        background:#f8fafc;
        padding:20px;
        border-radius:8px;
        margin-top:20px;
    ">

        <h3>Student Details</h3>

        <p><b>Name:</b> {student.name}</p>
        <p><b>Roll Number:</b> {student.roll_number}</p>
        <p><b>Department:</b> {student.department}</p>
        <p><b>Room Number:</b> {student.room_number}</p>

        <h3>Outpass Details</h3>

        <p><b>Date:</b> {outpass.date}</p>
        <p><b>Destination:</b> {outpass.destination}</p>
        <p><b>Departure:</b> {outpass.departure_time}</p>
        <p><b>Expected Return:</b> {outpass.expected_return_time}</p>

    </div>

    <p style="
        text-align:center;
        margin-top:30px;
        font-size:16px;
    ">
        Please choose an option:
    </p>

    <div style="text-align:center; margin-top:20px;">

        <a href="{approve_url}"
           style="
               display:inline-block;
               padding:14px 28px;
               background:#16a34a;
               color:white;
               text-decoration:none;
               border-radius:8px;
               font-weight:bold;
               margin-right:10px;
           ">
            ✓ Approve
        </a>

        <a href="{reject_url}"
           style="
               display:inline-block;
               padding:14px 28px;
               background:#dc2626;
               color:white;
               text-decoration:none;
               border-radius:8px;
               font-weight:bold;
           ">
            ✕ Reject
        </a>

    </div>

    <p style="
        margin-top:30px;
        font-size:13px;
        color:#64748b;
        text-align:center;
    ">
        This approval link is valid for 24 hours.
    </p>

    <p style="
        font-size:13px;
        color:#64748b;
        text-align:center;
    ">
        Regards,<br>
        PassFlow
    </p>

</div>

</body>
</html>
"""

    message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
            server.send_message(message)

        print("Parent approval email sent successfully.")

    except Exception as e:
        raise Exception(f"Email sending failed: {str(e)}")