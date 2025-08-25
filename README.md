# Todo Semanal – React + FastAPI + Postgres + Docker Compose

## Dev
1) `cp .env.example .env`
2) `docker compose up -d --build`
3) Web: http://localhost:5173 | API: http://localhost:8000/api/healthz

## Prod
1) `docker compose -f docker-compose.prod.yml up -d --build`
2) Web: http://localhost  (API detrás de /api/*)
