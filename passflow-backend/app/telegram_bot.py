import os
import requests

from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import jwt

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes
)
from telegram.error import BadRequest


load_dotenv()


TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"

BACKEND_URL = os.getenv(
    "PASSFLOW_BACKEND_URL",
    "http://127.0.0.1:8000"
)


def create_parent_token(outpass_id):

    return jwt.encode(
        {
            "outpass_id": outpass_id,
            "purpose": "parent_approval",
            "exp": datetime.utcnow() + timedelta(hours=24)
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )


async def start(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE
):

    chat_id = update.effective_chat.id

    print()
    print("====================================")
    print("TELEGRAM PARENT CHAT ID:", chat_id)
    print("====================================")
    print()

    await update.message.reply_text(
        "✅ PassFlow Parent Bot Connected!\n\n"
        "You will receive hostel outpass requests here."
    )


async def handle_button(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE
):

    query = update.callback_query

    try:
        await query.answer()
    except BadRequest:
        pass

    async def edit_message(text):

        try:
            await query.edit_message_text(text)

        except BadRequest as error:

            if "message is not modified" not in str(error).lower():

                print(
                    "Telegram message update error:",
                    str(error)
                )

    # Read button action
    action, outpass_id = query.data.split(":", 1)

    print(
        f"Parent selected {action} "
        f"for outpass {outpass_id}"
    )

    # Validate outpass ID
    try:

        outpass_id = int(outpass_id)

    except ValueError:

        await edit_message(
            "❌ Invalid outpass request."
        )

        return

    # Create a valid parent approval token
    parent_token = create_parent_token(
        outpass_id
    )

    # Select backend endpoint
    if action == "approve":

        endpoint = (
            f"{BACKEND_URL}"
            f"/parent/approve/{parent_token}"
        )

    elif action == "reject":

        endpoint = (
            f"{BACKEND_URL}"
            f"/parent/reject/{parent_token}"
        )

    else:

        await edit_message(
            "❌ Invalid action."
        )

        return

    # Call backend
    try:

        response = requests.post(
            endpoint,
            timeout=60
        )

        if response.status_code == 200:

            data = response.json()

            # --------------------------------
            # PARENT APPROVED
            # --------------------------------

            if action == "approve":

                await edit_message(
                    "✅ PARENT APPROVED\n\n"
                    "The outpass is now waiting for "
                    "warden approval.\n\n"
                    "The QR pass will be generated "
                    "after the warden approves it."
                )

                print(
                    "Parent approved outpass:",
                    data
                )

            # --------------------------------
            # PARENT REJECTED
            # --------------------------------

            else:

                await edit_message(
                    "❌ OUTPASS REJECTED\n\n"
                    "The outpass request has been rejected."
                )

                print(
                    "Parent rejected outpass:",
                    data
                )

        else:

            try:

                error = response.json()

                detail = error.get(
                    "detail",
                    "Unknown error"
                )

            except Exception:

                detail = response.text

            await edit_message(
                f"⚠️ Request failed:\n{detail}"
            )

            print(
                "Backend error:",
                response.status_code,
                detail
            )

    except requests.RequestException as e:

        print(
            "Backend connection error:",
            str(e)
        )

        await edit_message(
            "⚠️ Could not connect to PassFlow server."
        )

    except Exception as e:

        print(
            "Telegram approval error:",
            str(e)
        )

        await edit_message(
            "⚠️ Something went wrong while processing "
            "the request."
        )


# Create Telegram application
app = Application.builder().token(TOKEN).build()


# /start
app.add_handler(
    CommandHandler("start", start)
)


# Approve / Reject buttons
app.add_handler(
    CallbackQueryHandler(handle_button)
)


print(
    "PassFlow Telegram Bot is running..."
)


# Start bot
app.run_polling(
    drop_pending_updates=True
)