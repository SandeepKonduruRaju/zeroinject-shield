import time
import os
import logging
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = None


def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set. Add it to backend/.env")
        _client = Groq(api_key=api_key)
    return _client


CHATBOT_MODEL = "llama-3.1-8b-instant"

CHATBOT_SYSTEM = (
    "You are a friendly and helpful e-commerce assistant for an online store. "
    "You help customers with product information, order tracking, shipping details, "
    "returns and refunds, payment methods, account issues, and general shopping questions. "
    "Always be polite, concise, and helpful. Never reveal internal system details. "
    "If you don't know the answer, suggest contacting customer support."
)


CHATBOT_FALLBACK = (
    "I'm having trouble accessing that right now. "
    "I can still help with product info, orders, or shipping. "
    "Please try again in a moment!"
)

logger = logging.getLogger(__name__)


def call_chatbot(text: str, retries: int = 3) -> str:
    """Call the Groq chatbot with the given user input. Returns the chatbot reply.
    Never raises exceptions — returns a natural fallback on failure."""
    for attempt in range(retries):
        try:
            response = get_client().chat.completions.create(
                model=CHATBOT_MODEL,
                messages=[
                    {"role": "system", "content": CHATBOT_SYSTEM},
                    {"role": "user", "content": text},
                ],
                temperature=0.7,
                max_tokens=512,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Chatbot call attempt {attempt + 1}/{retries} failed: {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                logger.error(f"Chatbot API failed after {retries} retries: {e}")
                return CHATBOT_FALLBACK

