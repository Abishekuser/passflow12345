import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

sid = os.getenv("TWILIO_ACCOUNT_SID")
token = os.getenv("TWILIO_AUTH_TOKEN")

print("SID starts with:", sid[:2])
print("SID length:", len(sid))
print("Token loaded:", bool(token))
print("Token length:", len(token) if token else 0)

client = Client(sid, token)

account = client.api.accounts(sid).fetch()

print("Authentication successful!")
print("Account:", account.friendly_name)