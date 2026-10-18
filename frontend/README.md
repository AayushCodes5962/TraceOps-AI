# TraceOps AI — Frontend

The React dashboard for **TraceOps AI**, a graph-powered security incident investigation prototype.

## Overview

This frontend allows users to investigate synthetic security alerts, visualize connected entities, review risk scores, read AI-generated explanations, and approve or reject proposed response actions.

## Features

- Security incident investigation dashboard
- Interactive graph visualization of alerts, users, devices, and systems
- Risk score and contributing factors
- AI-generated investigation explanations
- Human approval and rejection workflow
- Audit trail for simulated response decisions

## Tech Stack

- React
- Vite
- JavaScript
- React Flow (`@xyflow/react`)
- Lucide React
- CSS

## Prerequisites

- Node.js and npm
- TraceOps AI FastAPI backend running locally
- FalkorDB running and populated with the synthetic demo data

## Getting Started

### 1. Install dependencies

From this directory, run:

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Open the local URL printed in the terminal, usually `http://localhost:5173`.

## Backend Connection

The Vite development server forwards requests beginning with `/api` to the FastAPI backend at `http://127.0.0.1:8000`.

Start the backend separately from the project root:

```bash
python -m uvicorn app:app --reload
```

Ensure FalkorDB is running and the synthetic graph data has been seeded before investigating alerts.

## Important Notes

- This is a demonstration frontend using synthetic security data.
- Response actions are simulated; the application does not execute real security operations.
- The backend and frontend run as separate services during local development.
- Do not commit API keys, `.env` files, or other secrets to GitHub.

## Related Documentation

See the root [`README.md`](../README.md) for the complete project overview and setup instructions.