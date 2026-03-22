# Agentic ABM Engine - Frontend

A sleek, modern Next.js frontend built to interface with the Agentic ABM (Account-Based Marketing) Engine. This interface allows you to orchestrate autonomous marketing workflows run by CrewAI, visualize generated content in real-time, and live-edit Agent configurations.

## Features

- **Real-Time CRM Dashboard**: View active and completed AI agent campaigns. Groups steps logically and derives statuses dynamically from the CrewAI output.
- **Smart Markdown Rendering**: Generates clean, readable AI outputs (like `**bolded targets**`) directly into beautifully formatted HTML cards for rapid review.
- **Agent Kickoff**: Start the underlying Python CrewAI process (`uv run kickoff`) directly from the browser with a single click.
- **Live ICP Configurator**: A built-in code editor view to dynamically adjust your Ideal Customer Profile (`icp.yaml`). The Agentic backend immediately utilizes these configurations without needing to restart.
- **Premium Glassmorphism Design**: Developed purely with Vanilla CSS targeting high-end, animated aesthetics involving glassmorphism, glowing accents, and smooth transitions.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Vanilla CSS (No Tailwind)
- **Database Connection**: Reads directly from local SQLite (`better-sqlite3` equivalent via `sqlite3`) accessing `~/Library/Application Support/abm_engine/flow_states.db`.
- **System Integration**: Uses Node.js `child_process.exec` to execute Python Agent workflows.

## Prerequisites

To run this application, it assumes you have the `abm_engine` configured locally on a Mac architecture, specifically looking for databases in:
`~/Library/Application Support/abm_engine/flow_states.db`

And the python project residing in:
`~/Crew AI Builds/Marketing/Antigravity/abm_engine`

## Getting Started

1. Navigate to the project directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture & API Routes

- `GET /api/flow-states`: Fetches the top 100 most recent execution states from the SQLite database and parses them as JSON.
- `POST /api/kickoff`: Triggers the `/abm_engine/` directory environment to execute `uv run kickoff` locally.
- `GET/POST /api/icp`: Reads and writes directly to the `icp.yaml` configuration file allowing quick updates to agent logic. Let's make sure things run properly.

## Contributing

Designed specifically for the Agentic ABM architecture by the Antigravity system.
