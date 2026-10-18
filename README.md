# TraceOps AI --- Graph-Powered Security Investigation Agent

TraceOps AI is an AI-assisted security investigation prototype that uses
**FalkorDB** to connect security alerts with users, devices, systems,
and related activity. It traverses connected evidence, calculates a
prototype risk score, and uses a Groq-powered language model to generate
an evidence-based explanation.

The application includes an interactive graph explorer, a human-reviewed
response proposal workflow, and an audit trail for recorded decisions.
Built with React, FastAPI, Python, FalkorDB, and Groq, TraceOps AI
demonstrates how connected data can help an investigation agent produce
more explainable and traceable decisions.

> **Current scope:** This is a prototype using synthetic security data.
> Risk scoring is heuristic-based, and response actions are simulated
> rather than executed against real systems. It is not a production
> security monitoring or incident-response system.

## Contents

-   [Problem](#problem)
-   [Solution](#solution)
-   [Features](#features)
-   [Architecture](#architecture)
-   [Technology stack](#technology-stack)
-   [Graph data model](#graph-data-model)
-   [Risk scoring](#risk-scoring)
-   [API endpoints](#api-endpoints)
-   [Project structure](#project-structure)
-   [Setup and run locally](#setup-and-run-locally)
-   [Demo workflow](#demo-workflow)
-   [Security notes](#security-notes)
-   [Limitations and future
    improvements](#limitations-and-future-improvements)
-   [Demo video](#demo-video)
-   [Track alignment](#track-alignment)
-   [AI assistance disclosure](#ai-assistance-disclosure)
-   [License](#license)

## Problem

Security alerts often need investigation across multiple entities,
including user accounts, devices, systems, and related events. Reviewing
alerts in isolation can make it difficult to see how evidence is
connected or explain why an alert deserves attention.

## Solution

TraceOps AI models these relationships in a graph. Given an alert ID,
the backend queries FalkorDB to retrieve connected entities and related
alerts, applies a transparent prototype risk-scoring heuristic, and can
use a language model to explain the result based on the returned
evidence. A proposed response is presented for human review and recorded
as a simulated decision.

**FalkorDB powers a core application function:** retrieving connected
evidence and relationships for an investigation, rather than simply
displaying a graph.

## Features

-   **Graph-powered investigation:** retrieves connected alert, user,
    device, system, and related-alert information from FalkorDB.
-   **Prototype risk scoring:** combines alert severity, account
    privilege, system criticality, and related-alert evidence.
-   **AI-assisted explanation:** uses Groq to generate a readable
    explanation based on the investigation report.
-   **Interactive graph explorer:** visualizes entities and
    relationships returned by the investigation.
-   **Human-reviewed response proposal:** records approval or rejection;
    no real security action is executed.
-   **Audit trail:** displays recorded simulated response decisions.
-   **Web dashboard:** React frontend backed by a FastAPI API.

## Architecture

``` text
React dashboard
      | HTTP (/api/...)
      v
FastAPI backend
      |
      +----> FalkorDB graph
      |        +-- Alerts
      |        +-- Users
      |        +-- Devices
      |        +-- Systems and relationships
      |
      +----> Heuristic risk scoring
      |
      +----> Groq API ----> Evidence-based explanation
      |
      +----> Simulated response proposal
                 +-- Human approval/rejection
                 +-- JSONL audit event
```

### Request flow

1.  The user enters an alert ID such as `ALT-1001`.
2.  FastAPI queries FalkorDB for the alert and connected evidence.
3.  The backend calculates a prototype risk score and returns an
    investigation report.
4.  The frontend displays risk factors and the evidence chain.
5.  On request, Groq generates an explanation based on the report.
6.  The user requests a response proposal and approves or rejects the
    simulation.
7.  The decision is recorded in the audit log.

## Technology stack

  -----------------------------------------------------------------------
  Component               Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React, Vite             Dashboard and
                                                  interactions

  Graph visualization     `@xyflow/react`         Interactive graph
                                                  explorer

  Icons                   `lucide-react`          UI icons

  Backend                 Python, FastAPI         API and investigation
                                                  workflow

  Graph database          FalkorDB                Connected entities and
                                                  relationship queries

  Language model API      Groq                    AI-generated
                                                  investigation
                                                  explanation

  Local graph runtime     Docker                  Runs FalkorDB locally
  -----------------------------------------------------------------------

The current prototype is configured to use `openai/gpt-oss-120b` through
the Groq API. Model availability depends on provider availability and
account access.

## Graph data model

The prototype models these relationships:

``` text
(Alert)-[:INVOLVES]->(User)
(User)-[:USES]->(Device)
(Device)-[:CONNECTS_TO]->(System)
```

Related alerts can be discovered through shared user context in the
current investigation logic.

### Synthetic demo entities

  Entity   Example ID   Example details
  -------- ------------ ------------------------------------------
  Alert    `ALT-1001`   Suspicious login; high severity
  User     `USR-001`    Alex Morgan; privileged account
  Device   `DEV-001`    `workstation-01`
  System   `SYS-001`    Payment Service; high criticality
  Alert    `ALT-1002`   Unusual device activity; medium severity

These are synthetic records, not real security telemetry.

### Illustrative Cypher query

``` cypher
MATCH (a:Alert {id: $alert_id})-[:INVOLVES]->(u:User)
OPTIONAL MATCH (u)-[:USES]->(d:Device)
OPTIONAL MATCH (d)-[:CONNECTS_TO]->(s:System)
RETURN a, u, d, s
```

This is an illustrative query pattern. For the exact implementation and
property names, refer to the graph seed script and investigator module
in the repository.

## Risk scoring

The current score is a heuristic, not a trained or validated
threat-detection model.

  Factor                            Example contribution
  ----------------------------- ------------------------
  Critical severity                                  +40
  High severity                                      +30
  Medium severity                                    +15
  Low severity                                        +5
  Privileged account                                 +20
  High/critical system impact                        +25
  Related alerts                  +5 each, capped at +15

The total is capped at 100. Scores of **70 or higher are HIGH**,
**40--69 are MEDIUM**, and lower scores are LOW. The synthetic
`ALT-1001` example can produce a score of 80 in the current
implementation.

These values demonstrate explainable decision logic; they are not
calibrated against real incidents and must not be used for production
security decisions without validation.

## API endpoints

  -------------------------------------------------------------------------------
  Method                  Endpoint                        Purpose
  ----------------------- ------------------------------- -----------------------
  `GET`                   `/`                             Backend root/status
                                                          response

  `GET`                   `/api/investigate/{alert_id}`   Retrieve investigation
                                                          report and connected
                                                          evidence

  `GET`                   `/api/explain/{alert_id}`       Generate an AI
                                                          explanation

  `GET`                   `/api/proposal/{alert_id}`      Prepare a simulated
                                                          response proposal

  `POST`                  `/api/decision/{alert_id}`      Record
                                                          approval/rejection

  `GET`                   `/api/audit`                    Retrieve audit events
  -------------------------------------------------------------------------------

When the backend is running, interactive API documentation is available
at `http://127.0.0.1:8000/docs`.

Example decision request body:

``` json
{
  "approved": true
}
```

This records a simulated decision and does not execute a real response
action.

## Project structure

``` text
TraceOps-AI/
├── app.py                    # FastAPI application and API routes
├── investigator.py           # Graph investigation and evidence retrieval
├── risk.py                   # Heuristic risk scoring
├── explainer.py              # Groq-powered explanation
├── response.py               # Simulated proposal and audit recording
├── test_falkordb.py          # Synthetic graph seed/test script
├── .env.example              # Example environment configuration
├── requirements.txt          # Python dependencies, if included
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main dashboard and workflow
│   │   ├── App.css            # Dashboard styles
│   │   ├── NetworkBackground.jsx # Decorative network background
│   │   ├── GraphExplorer.jsx  # Interactive graph visualization
│   │   ├── index.css          # Global styles
│   │   └── main.jsx           # React entry point
│   ├── package.json
│   └── vite.config.js         # Development API proxy
└── README.md
```

Keep `.env`, virtual environments, `node_modules`, and generated local
audit logs out of version control.

## Setup and run locally

### Prerequisites

-   Python 3.13 recommended for the tested local setup
-   Node.js and npm
-   Docker Desktop
-   A Groq API key for the explanation feature
-   Git, if cloning the repository

### 1. Clone the repository

``` bash
git clone https://github.com/AayushCodes5962/TraceOps-AI.git
cd TraceOps-AI
```

### 2. Configure environment variables

Create a root `.env` file using `.env.example` as a guide. Use the exact
variable names expected by the backend. For example:

``` dotenv
GROQ_API_KEY=replace_with_your_own_key
```

Never commit `.env` or expose API keys in screenshots, logs, or demo
videos.

### 3. Create a Python environment (Windows PowerShell)

``` powershell
py -3.13 -m venv .venv313
.\.venv313\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If `requirements.txt` is not present in the repository, use the
dependency file maintained for the backend.

### 4. Start FalkorDB

If the existing local Docker container has already been created:

``` powershell
docker start traceops-falkordb
docker ps
```

The current local configuration expects FalkorDB on port `6379`. The
browser UI may use port `3000`, depending on the container
configuration. If the container does not exist, follow FalkorDB's
official installation instructions or the repository's Docker
configuration.

### 5. Seed the synthetic graph

With FalkorDB running and the Python environment active:

``` powershell
python test_falkordb.py
```

Check the output for errors before continuing.

### 6. Start the backend

From the project root:

``` powershell
python -m uvicorn app:app --reload
```

-   API: `http://127.0.0.1:8000`
-   API documentation: `http://127.0.0.1:8000/docs`

Leave this terminal running.

### 7. Start the frontend

Open a second terminal:

``` powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`. Keep the
backend running in the first terminal. The Vite configuration proxies
`/api` requests to FastAPI.

### 8. Verify the demo

-   Investigate `ALT-1001`.
-   Confirm the report and risk score appear.
-   Open Graph Investigation and inspect the connected entities.
-   Generate an AI explanation.
-   Prepare a response proposal and record a simulated approval or
    rejection.
-   Refresh Audit Trail and confirm the decision appears.

If a step fails, check the backend terminal, browser console, Docker
status, environment variables, and API docs.

## Demo workflow

The synthetic demo scenario includes: - `ALT-1001`: suspicious login,
high severity. - `USR-001`: synthetic privileged user. - `DEV-001`:
associated workstation. - `SYS-001`: high-criticality Payment Service. -
`ALT-1002`: related unusual-device-activity alert.

The investigator follows graph relationships to collect context. The
scoring heuristic combines severity, privilege, system impact, and
related-alert context. The AI explanation summarizes the returned
evidence. A response proposal is then reviewed by a human and recorded
as a simulation.

A different IP address or device context alone is not proof of an
attack. A production implementation would need reliable telemetry,
baselines, identity context, and validated detection logic.

## Security notes

-   The current dataset is synthetic.
-   Response actions are simulation-only.
-   Never commit `.env`, API keys, tokens, or credentials.
-   If a secret is exposed, revoke or rotate it immediately; deleting it
    in a later commit does not remove it from Git history.
-   Do not connect this prototype to production security systems without
    authorization, testing, access controls, and review.
-   AI-generated explanations can be wrong. Check them against the
    returned evidence.

## Limitations and future improvements

### Current limitations

-   Synthetic data rather than live security-event ingestion.
-   Heuristic scoring not validated against a labeled incident dataset.
-   Related-alert discovery depends on the relationships and context
    present in the graph.
-   AI explanation quality depends on the evidence, prompt design, and
    provider/model availability.
-   Response actions are simulated; no external system is modified.

### Potential improvements

-   Ingest authorized security alerts with schema validation.
-   Add timestamped IP, device, identity, and authentication context.
-   Investigate temporal event sequences and enrich graph relationships.
-   Evaluate scoring against labeled cases and measure false
    positives/negatives.
-   Add authentication, authorization, rate limiting, and audit-log
    integrity controls.
-   Expand automated tests, observability, error handling, and
    deployment documentation.
-   Integrate real response actions only after designing and testing
    permissions and safeguards.

## Demo video

**Demo video:**
`https://drive.google.com/file/d/1bCSajolE1x52Ca3CsE2TOowyf5gNW89R/view?usp=sharing`

Show the running application and end-to-end workflow. Do not show API
keys, private credentials, or real user/security data.

## Track alignment

TraceOps AI is intended for the **Agents That Act on Connected Data**
track. FalkorDB retrieves connected evidence and relationships; the
application uses that context to support risk assessment, explanation,
and a human-reviewed simulated response.

Confirm the exact track name and required deliverables on the official
hackathon submission page before submitting.

## AI assistance disclosure

AI tools were used to assist with development and documentation. The
project author should review, test, and understand submitted code and
disclose AI assistance according to the hackathon's current rules. The
application also uses a Groq-hosted language model for its AI
explanation feature.

## License

No license has been specified. Add a `LICENSE` file before representing
the repository as open source. Choose a license that fits your goals and
verify that included dependencies and assets permit the intended use.
