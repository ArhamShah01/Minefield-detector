# Minefield Detector Simulation

A full stack training simulation for an autonomous ground robot, with a seeded ground truth and robot navigation simulation. It is not a real mine detection system.

## Safety and scope

Simulated mines are generated on the client and are hidden from the robot knowledge map until its simulated metal detector reaches them. Do not use this software to make real-world route clearance decisions.

## Features

- Freeform obstacle drawing, dark mode, responsive layout, map zoom, seed configuration with automatic scenario generation, robot start/destination selection, fixed speed of one cell per second, pause, resume, step, reset, and event log.
- A* with Manhattan distance and four-way movement, obstacle avoidance, route replanning, and safe stop when no path exists.
- Navigation follows the operational sequence: generate the terrain grid, set start and destination, initialize robot telemetry, plan with A*, move one cell, read GPS/LiDAR/metal detector, process readings, update robot knowledge on a new hazard, replan, and check destination or stop when unreachable.
- Simulated GPS, a four-cell cross sensor footprint (one adjacent cell in each cardinal direction), LiDAR clearance, and metal detector readings. When the sensor detects a mine, the robot updates its knowledge map, replans around the mine, and automatically follows the new route. Ground truth is isolated from map display and navigation until a sensor encounter.
- Mission summary.
- Optional presentation-only ground-truth overlay for displaying simulated mines and truth obstacles. This overlay never feeds the robot map, sensors, or route planner.
- Manual mine placement and removal for demonstrations. Select `Place / remove mine`, click a grid cell, then run the mission. Manual placements change only ground truth.
- When a mine is detected, the robot marks it on its knowledge map, computes a different A* route, and follows that route automatically. Reset restores the pre-run map and robot position while retaining the active seed and ground truth for repeatable reruns. Generating again after changing the seed creates exactly seven mines on a 20 by 20 map, excluding the configured start and destination.

## Architecture

- `frontend/`: React, Vite, JavaScript, Tailwind CSS, and simulation engine with A* pathfinding.
- `backend/app/`: FastAPI health route.
- `frontend/src/simulation/`: deterministic scenario creation, sensor calculations, coordinate simulation, grid validation, and A*.

## Requirements

- Node.js 18 or later and npm.
- Python 3.10 or later.
- No API key required.

## Setup

From the project root, install the Python dependencies and start the API:

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

In a second terminal, install and start the frontend:

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. The frontend proxies `/api` requests to `http://localhost:8000`.

## API

- `GET /api/health`: service status.

## Tests

Run backend tests with `python -m pytest backend/tests` from the project root. Frontend simulation tests use Node's built-in test runner with `npm test` from `frontend`.

## Limitations

This is a 2D educational simulation. It has no physical robot, real GPS, calibrated LiDAR or metal detector, georeferencing, terrain elevation, or mine-detection capability.
