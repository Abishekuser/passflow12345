import asyncio
import logging
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

logger = logging.getLogger(__name__)

TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"

BACKEND_URL = os.getenv("PASSFLOW_BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")


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

    logger.info("Telegram parent bot connected for chat_id=%s", chat_id)

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

                logger.warning(
                    "Could not update Telegram approval message: %s",
                    error,
                )

    # Read button action
    action, outpass_id = query.data.split(":", 1)

    logger.info(
        "Parent selected %s for outpass_id=%s",
        action,
        outpass_id,
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

        response = await asyncio.to_thread(
            requests.post,
            endpoint,
            timeout=60,
        )

        if response.status_code == 200:

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

                logger.info(
                    "Parent approved outpass_id=%s",
                    outpass_id,
                )

            # --------------------------------
            # PARENT REJECTED
            # --------------------------------

            else:

                await edit_message(
                    "❌ OUTPASS REJECTED\n\n"
                    "The outpass request has been rejected."
                )

                logger.info(
                    "Parent rejected outpass_id=%s",
                    outpass_id,
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

            logger.error(
                "Parent approval request failed for outpass_id=%s "
                "status_code=%s detail=%s",
                outpass_id,
                response.status_code,
                detail,
            )

    except requests.RequestException as error:
        logger.error(
            "PassFlow backend connection failed for outpass_id=%s error_type=%s",
            outpass_id,
            type(error).__name__,
        )

        await edit_message(
            "⚠️ Could not connect to PassFlow server."
        )

    except Exception as error:
        logger.error(
            "Telegram approval callback failed for outpass_id=%s error_type=%s",
            outpass_id,
            type(error).__name__,
        )

        await edit_message(
            "⚠️ Something went wrong while processing "
            "the request."
        )


def create_bot_application():
    application = Application.builder().token(TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(handle_button))
    return application


async def start_bot():
    application = create_bot_application()
    initialized = False
    started = False
    try:
        await application.initialize()
        initialized = True
        await application.start()
        started = True
        if application.updater is None:
            raise RuntimeError("Telegram polling updater is not configured")
        await application.updater.start_polling(drop_pending_updates=True)
    except Exception:
        if application.updater and application.updater.running:
            await application.updater.stop()
        if started and application.running:
            await application.stop()
        if initialized:
            await application.shutdown()
        raise

    logger.info("PassFlow Telegram bot polling started")
    return application


async def stop_bot(application):
    if application.updater and application.updater.running:
        await application.updater.stop()
    if application.running:
        await application.stop()
    await application.shutdown()
