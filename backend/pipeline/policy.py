"""
Policy engine for ZeroInject Shield middleware.

Maps injection scores to middleware actions:
  score >= 0.7  → BLOCK   (verdict: BLOCKED)
  score >= 0.4  → SANITIZE (verdict: FLAGGED)
  score <  0.4  → ALLOW   (verdict: SAFE)
"""

THRESHOLD_BLOCK = 0.7
THRESHOLD_SANITIZE = 0.4

# Natural-sounding responses for blocked requests.
# Keyed by detected intent keywords so the user never sees a security warning.
_BLOCK_RESPONSES = {
    "discount": "We offer seasonal discounts and promotions! Please check our website or subscribe to our newsletter for the latest deals.",
    "price": "I'd be happy to help with pricing. Could you tell me which product you're interested in?",
    "hack": "I can help with product information, order tracking, or account support. What would you like to know?",
    "password": "For account security, please use the 'Forgot Password' link on our login page, or contact our support team directly.",
    "data": "I can help with product info, orders, or customer support. What would you like to know?",
    "system": "I can help with product information, order tracking, shipping, or account questions. How can I assist you?",
    "prompt": "I'm here to help with your shopping needs! Do you have a question about a product, an order, or our services?",
    "ignore": "I'm here to help with your shopping experience. What can I assist you with today?",
    "override": "I can assist you with products, orders, shipping, and returns. What do you need help with?",
    "secret": "I can help with product details, order status, and general store questions. What are you looking for?",
    "confidential": "I can help with product information, order tracking, or customer support. How can I assist?",
    "jailbreak": "I'm your shopping assistant! I can help with products, orders, returns, and more. What do you need?",
    "restrict": "I'd love to help you with your shopping! What product or service are you interested in?",
    "reveal": "I can help with product questions, shipping, or account support. What would you like to know?",
}

_DEFAULT_BLOCK_RESPONSE = (
    "I can help with product questions, order tracking, shipping, returns, "
    "and account support. What would you like to know?"
)


def decide_action(score: float, sanitized_text: str, original_text: str) -> dict:
    """
    Decide the middleware action based on the injection score.

    Returns:
        dict with keys:
            - action: "BLOCK" | "SANITIZE" | "ALLOW"
            - final_text: the text to send to the chatbot (None if BLOCK)
            - verdict: "BLOCKED" | "FLAGGED" | "SAFE"
    """
    text_lower = original_text.lower()
    
    # 1. Intent Detection
    business_keywords = ["discount", "offer", "coupon"]
    has_business_intent = any(k in text_lower for k in business_keywords)
    
    strong_injection_patterns = ["ignore", "bypass", "reveal", "admin", "override"]
    has_strong_injection = any(p in text_lower for p in strong_injection_patterns)
    
    # 2. Heuristic Adjustment
    if has_business_intent and not has_strong_injection:
        # Override score to ALLOW for legitimate business queries
        score = min(score, 0.39)

    if score >= THRESHOLD_BLOCK:
        return {
            "action": "BLOCK",
            "final_text": None,
            "verdict": "BLOCKED",
        }
    elif score >= THRESHOLD_SANITIZE:
        return {
            "action": "SANITIZE",
            "final_text": sanitized_text,
            "verdict": "FLAGGED",
        }
    else:
        return {
            "action": "ALLOW",
            "final_text": original_text,
            "verdict": "SAFE",
        }


def get_block_response(original_text: str) -> str:
    """
    Return a natural-sounding response for a blocked request.
    Inspects the original text for intent keywords to generate a contextual reply.
    The user must NEVER see a security warning.
    """
    text_lower = original_text.lower()
    for keyword, response in _BLOCK_RESPONSES.items():
        if keyword in text_lower:
            return response
    return _DEFAULT_BLOCK_RESPONSE
