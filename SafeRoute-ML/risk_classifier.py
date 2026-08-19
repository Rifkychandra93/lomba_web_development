def calculate_risk(confidence: float) -> str:
    if confidence >= 0.90:
        return "CRITICAL"

    if confidence >= 0.80:
        return "HIGH"

    if confidence >= 0.60:
        return "MEDIUM"

    return "LOW"