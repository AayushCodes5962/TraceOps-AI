
from falkordb import FalkorDB
from risk import calculate_risk


def investigate_alert(alert_id: str) -> dict:
    db = FalkorDB(host="localhost", port=6379)
    graph = db.select_graph("traceops")

    query = """
    MATCH (a:Alert {id: $alert_id})-[:INVOLVES]->(u:User)
    OPTIONAL MATCH (u)-[:USES]->(d:Device)
    OPTIONAL MATCH (d)-[:CONNECTS_TO]->(s:System)
    RETURN
        a.id AS alert_id,
        a.type AS alert_type,
        a.severity AS severity,
        u.id AS user_id,
        u.name AS user_name,
        u.privileged AS privileged,
        collect(DISTINCT d.hostname) AS devices,
        collect(DISTINCT s.name) AS systems,
        collect(DISTINCT s.criticality) AS criticalities
    """

    result = graph.query(query, {"alert_id": alert_id})

    if not result.result_set:
        return {
            "found": False,
            "message": f"No investigation path found for {alert_id}.",
        }

    row = result.result_set[0]

    alert, alert_type, severity = row[0], row[1], row[2]
    user_id, user_name, privileged = row[3], row[4], row[5]
    devices, systems, criticalities = row[6], row[7], row[8]
    
    related_query = """
    MATCH (a:Alert)-[:INVOLVES]->(u:User {id: $user_id})
    WHERE a.id <> $alert_id
    RETURN a.id AS alert_id,
       a.type AS alert_type,
       a.severity AS severity
    """

    related_result = graph.query(
        related_query,
        {
        "user_id": user_id,
        "alert_id": alert,
        },
    )

    related_alerts = [
       {
        "id": item[0],
        "type": item[1],
        "severity": item[2],
       }
       for item in related_result.result_set
    ]
    
    
    evidence = {
        "severity": severity,
        "privileged": privileged is True,
        "critical_system_found": (
            any(
                str(value).lower() in {"high", "critical"}
                for value in criticalities
                if value is not None
            )
        ),
        "related_alert_count": len(related_alerts),
    }

    risk = calculate_risk(evidence)

    return {
        "found": True,
        "alert": {
            "id": alert,
            "type": alert_type,
            "severity": severity,
        },
        "user": {
            "id": user_id,
            "name": user_name,
            "privileged": privileged,
        },
        "devices": devices,
        "systems": systems,
        "related_alerts": related_alerts,
        "evidence": evidence,
        "risk": risk,
    }


if __name__ == "__main__":
    import json

    report = investigate_alert("ALT-1001")
    print(json.dumps(report, indent=2, default=str))
