# Minefield Detector Simulation

A full stack training simulation for an autonomous ground robot. It combines optional drone image classification of visible surface terrain with a separate, seeded ground truth and robot navigation simulation. It is not a real mine detection system.

## Safety and scope

Aerial images do not reveal buried mines. The vision service labels visible terrain as `clear` or `obstacle` only. Simulated mines are generated separately on the backend-independent client and are hidden from the robot knowledge map until its simulated metal detector reaches them. Do not use this software to make real-world route clearance decisions.

## Features

- JPG and PNG upload with content type, size, image integrity, pixel count, grid dimensions, and model response validation.
- FastAPI image analysis endpoint that uses Groq Vision when `GROQ_API_KEY` is configured, with model configurable through `GROQ_MODEL` (default `qwen/qwen3.8-27b`). Without a key, the endpoint returns an explicitly labeled illustrative demo map.
- Editable 20 by 20 terrain map, image preview, dark mode, responsive layout, map zoom, seed configuration with automatic scenario generation, robot start/destination selection, fixed speed of one cell per second, pause, resume, step, reset, and event log.
- A* with Manhattan distance and four-way movement, obstacle avoidance, route replanning, and safe stop when no path exists.
- Navigation follows the operational sequence: generate the terrain grid, set start and destination, initialize robot telemetry, plan with A*, move one cell, read GPS/LiDAR/metal detector, process readings, update robot knowledge on a new hazard, replan, and check destination or stop when unreachable.
- Simulated GPS, a four-cell cross sensor footprint (one adjacent cell in each cardinal direction), LiDAR clearance, and metal detector readings. When the sensor detects a mine, the robot updates its knowledge map, replans around the mine, and automatically follows the new route. Ground truth is isolated from map display and navigation until a sensor encounter.
- JSON scenario import/export and mission summary.
- Optional presentation-only ground-truth overlay for displaying simulated mines and truth obstacles. This overlay never feeds the robot map, sensors, or route planner.
- Manual mine placement and removal for demonstrations. Select `Place / remove mine`, click a grid cell, then run the mission. Manual placements change only ground truth and are saved in exported scenarios.
- When a mine is detected, the robot marks it on its knowledge map, computes a different A* route, and follows that route automatically. Reset restores the pre-run map and robot position while retaining the active seed and ground truth for repeatable reruns. Generating again after changing the seed creates exactly seven mines on a 20 by 20 map, excluding the configured start and destination.

## Architecture

- `frontend/`: React, Vite, JavaScript, Tailwind CSS, simulation engine, A*, and API client.
- `backend/app/`: FastAPI routes, Pydantic response validation, upload validation, and Groq image processing.
- `frontend/src/simulation/`: deterministic scenario creation, sensor calculations, coordinate simulation, grid validation, and A*.

## Requirements

- Node.js 18 or later and npm.
- Python 3.10 or later.
- Optional Groq API key for real visible terrain analysis. No key is required for demo mode.

## Setup

From the project root, install the Python dependencies and start the API:

```sh
cp .env.example .env
# Optionally set GROQ_API_KEY in .env. Keep the value private.
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
set -a && . ./.env && set +a
uvicorn app.main:app --app-dir backend --reload --port 8000
```

In a second terminal, install and start the frontend:

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. The frontend proxies `/api` requests to `http://localhost:8000`.

The `.env` file is ignored by Git. Never add credentials to frontend files. `GROQ_MODEL` and `MAX_UPLOAD_MB` are optional environment variables. The model default can be overridden if a Groq account uses a different available model identifier.

## API

- `GET /api/health`: service status and whether a key is configured.
- `GET /api/demo?rows=20&cols=20`: explicit illustrative map.
- `POST /api/analyze`: multipart fields `file`, `rows`, and `cols` (5 to 40).

## Tests

Run backend tests with `python -m pytest backend/tests` from the project root. Frontend simulation tests use Node's built-in test runner with `npm test` from `frontend`.

## Limitations

This is a 2D educational simulation. It has no physical robot, real GPS, calibrated LiDAR or metal detector, georeferencing, terrain elevation, image stitching, or mine-detection capability. Demo maps are illustrative and are not image-derived. Groq requests require network access and a valid key; service errors are surfaced and do not replace the user's current map.
