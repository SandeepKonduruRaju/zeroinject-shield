"""
Tests for pipeline/chatbot.py

All tests mock the Groq client. The function must never raise — failures
return a fallback string instead.
"""

from unittest.mock import MagicMock, patch

from pipeline.chatbot import CHATBOT_FALLBACK, call_chatbot


def _make_groq_response(content: str) -> MagicMock:
    msg = MagicMock()
    msg.content = content
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    return resp


# ── call_chatbot ────────────────────────────────────────────────────────────


def test_chatbot_returns_model_reply():
    reply = "Sure! Our return policy allows returns within 30 days."
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = _make_groq_response(reply)

    with patch("pipeline.chatbot.get_client", return_value=mock_client):
        result = call_chatbot("what is your return policy?")

    assert result == reply


def test_chatbot_strips_whitespace():
    """WHY: The model sometimes returns leading/trailing newlines which we strip."""
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = _make_groq_response(
        "\n  Hello!  \n"
    )

    with patch("pipeline.chatbot.get_client", return_value=mock_client):
        result = call_chatbot("hi")

    assert result == "Hello!"


def test_chatbot_returns_fallback_on_api_error():
    """WHY: call_chatbot must NEVER raise. Returning the fallback string keeps
    the middleware running even when Groq is unreachable."""
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = RuntimeError("timeout")

    with patch("pipeline.chatbot.get_client", return_value=mock_client), \
         patch("pipeline.chatbot.time.sleep"):
        result = call_chatbot("hello")

    assert result == CHATBOT_FALLBACK


def test_chatbot_retries_before_fallback():
    """WHY: The retry loop should attempt 3 times before giving up."""
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = RuntimeError("transient error")

    with patch("pipeline.chatbot.get_client", return_value=mock_client), \
         patch("pipeline.chatbot.time.sleep"):
        result = call_chatbot("test", retries=3)

    assert mock_client.chat.completions.create.call_count == 3
    assert result == CHATBOT_FALLBACK


def test_chatbot_succeeds_on_second_attempt():
    """WHY: If the first call fails but the retry succeeds, we should return
    the real reply, not the fallback."""
    success_reply = "We accept Visa, Mastercard, and PayPal."
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = [
        RuntimeError("temporary failure"),
        _make_groq_response(success_reply),
    ]

    with patch("pipeline.chatbot.get_client", return_value=mock_client), \
         patch("pipeline.chatbot.time.sleep"):
        result = call_chatbot("what payment methods do you accept?")

    assert result == success_reply
