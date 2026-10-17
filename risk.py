
def calculate_risk(evidence: dict) -> dict:
    """
    Prototype risk score from 0 to 100.
    This is a transparent demo heuristic, not a validated
    cybersecurity risk assessment.
    """
    score = 0
    reasons = []

    severity = str(evidence.get("severity", "")).lower()

    severity_scores = {
        "critical": 40,
        "high": 30,
        "medium": 15,
        "low": 5,
    }

    points = severity_scores.get(severity, 0)
    score += points

    if points:
        reasons.append(
            f"Alert severity '{severity}' contributes {points} points."
        )

    if evidence.get("privileged") is True:
        score += 20
        reasons.append("The account is privileged (+20).")

    if evidence.get("critical_system_found") is True:
        score += 25
        reasons.append("A high-impact or critical system is connected (+25).")

    related_alerts = int(evidence.get("related_alert_count", 0))
    related_points = min(related_alerts * 5, 15)
    score += related_points

    if related_points:
        reasons.append(
            f"Related alerts contribute {related_points} points."
        )

    score = min(score, 100)

    if score >= 70:
        level = "HIGH"
    elif score >= 40:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "score": score,
        "level": level,
        "reasons": reasons,
        "model": "prototype_rule_based_v1",
    }
