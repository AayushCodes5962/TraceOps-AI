
import json
from datetime import datetime, timezone
from pathlib import Path

from investigator import investigate_alert

AUDIT_FILE = Path(__file__).parent / "audit_log.jsonl"


def propose_response(alert_id: str) -> dict:
    """Create a response proposal using graph investigation evidence."""

    report = investigate_alert(alert_id)

    if not report.get("found"):
        return {
            "success": False,
            "message": report.get("message", "Alert not found."),
        }

    risk = report["risk"]

    if risk["score"] >= 70:
        action = "REVIEW_PRIVILEGED_ACCOUNT"
        reason = "High risk score requires analyst review."
    elif risk["score"] >= 40:
        action = "INVESTIGATE_ACCOUNT_ACTIVITY"
        reason = "Medium risk score warrants further investigation."
    else:
        action = "CONTINUE_MONITORING"
        reason = "Low risk score; continue monitoring."

    return {
        "success": True,
        "alert_id": report["alert"]["id"],
        "risk_score": risk["score"],
        "risk_level": risk["level"],
        "proposed_action": action,
        "reason": reason,
        "status": "AWAITING_HUMAN_APPROVAL",
    }


def record_decision(proposal: dict, approved: bool) -> dict:
    """Record an analyst's decision; never execute a real security action."""

    if not proposal.get("success"):
        return proposal

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "alert_id": proposal["alert_id"],
        "risk_score": proposal["risk_score"],
        "proposed_action": proposal["proposed_action"],
        "approved": approved,
        "execution_mode": "SIMULATION_ONLY",
        "status": "SIMULATED_APPROVED" if approved else "REJECTED",
    }

    with AUDIT_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(event) + "\n")

    return event


if __name__ == "__main__":
    alert_id = input("Enter alert ID: ").strip()
    proposal = propose_response(alert_id)

    print("\n--- Proposed Response ---")
    print(json.dumps(proposal, indent=2))

    if proposal.get("success"):
        choice = input(
            "\nApprove this simulated response? (yes/no): "
        ).strip().lower()

        if choice not in {"yes", "no"}:
            print("Invalid choice. No decision recorded.")
        else:
            result = record_decision(
                proposal,
                approved=(choice == "yes"),
            )
            print("\n--- Audit Event ---")
            print(json.dumps(result, indent=2))
            print(f"\nAudit log: {AUDIT_FILE}")
