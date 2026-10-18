
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from investigator import investigate_alert
from explainer import explain_alert
from response import propose_response, record_decision

app = FastAPI(
    title="TraceOps AI",
    description="Graph-powered security incident investigation demo",
    version="1.0.0",
)

AUDIT_FILE = Path(__file__).parent / "audit_log.jsonl"
FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"


class DecisionRequest(BaseModel):
    approved: bool


@app.get("/api/investigate/{alert_id}")
def investigate(alert_id: str):
    report = investigate_alert(alert_id)

    if not report.get("found"):
        raise HTTPException(status_code=404, detail="Alert not found")

    return report


@app.get("/api/explain/{alert_id}")
def explain(alert_id: str):
    report = investigate_alert(alert_id)

    if not report.get("found"):
        raise HTTPException(status_code=404, detail="Alert not found")

    try:
        return {
            "alert_id": alert_id,
            "explanation": explain_alert(alert_id),
        }
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"AI explanation failed: {error}",
        ) from error


@app.get("/api/proposal/{alert_id}")
def proposal(alert_id: str):
    result = propose_response(alert_id)

    if not result.get("success"):
        raise HTTPException(status_code=404, detail="Alert not found")

    return result


@app.post("/api/decision/{alert_id}")
def decision(alert_id: str, request: DecisionRequest):
    proposal_result = propose_response(alert_id)

    if not proposal_result.get("success"):
        raise HTTPException(status_code=404, detail="Alert not found")

    return record_decision(
        proposal_result,
        approved=request.approved,
    )


@app.get("/api/audit")
def audit_history():
    if not AUDIT_FILE.exists():
        return {"events": []}

    events = []

    with AUDIT_FILE.open("r", encoding="utf-8") as file:
        for line in file:
            if line.strip():
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    return {"events": events}


@app.get("/", include_in_schema=False)
def home():
    index_file = FRONTEND_DIST / "index.html"

    if index_file.exists():
        from fastapi.responses import FileResponse
        return FileResponse(index_file)

    return {
        "name": "TraceOps AI",
        "status": "running",
        "mode": "synthetic data and simulated responses",
        "docs": "/docs",
        "message": "Build the frontend to serve the dashboard.",
    }


# Mount static assets after defining the API routes.
if FRONTEND_DIST.exists():
    app.mount(
        "/",
        StaticFiles(directory=FRONTEND_DIST),
        name="frontend",
    )
