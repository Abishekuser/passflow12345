import os
import asyncio

from dotenv import load_dotenv
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup

load_dotenv()

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_PARENT_CHAT_ID = os.environ["TELEGRAM_PARENT_CHAT_ID"]


def send_outpass_request(student, outpass):

    bot = Bot(token=TELEGRAM_BOT_TOKEN)

    message = f"""
🚨 PassFlow Outpass Request

👤 Student: {student.name}
🆔 Roll Number: {student.roll_number}
🏫 Department: {student.department}
🚪 Room: {student.room_number}

📅 Date: {outpass.date}
📍 Destination: {outpass.destination}
🕐 Departure: {outpass.departure_time}
🔙 Expected Return: {outpass.expected_return_time}

Please approve or reject this request.
"""

    keyboard = [
        [
            InlineKeyboardButton(
                "✅ Approve",
                callback_data=f"approve:{outpass.id}"
            ),
            InlineKeyboardButton(
                "❌ Reject",
                callback_data=f"reject:{outpass.id}"
            )
        ]
    ]

    reply_markup = InlineKeyboardMarkup(keyboard)

    async def send_message():

        async with bot:

            return await bot.send_message(
                chat_id=TELEGRAM_PARENT_CHAT_ID,
                text=message,
                reply_markup=reply_markup
            )

    result = asyncio.run(send_message())

    return result.message_id