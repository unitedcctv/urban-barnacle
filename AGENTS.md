# Urban Barnacle — Project Notes

## Verification commands

- Backend tests: `cd backend && uv run pytest app/tests` (requires the local Postgres via `docker compose up -d db`)
- Frontend typecheck: `cd frontend && npx tsc -p tsconfig.build.json`
- Frontend build: `cd frontend && npm run build`
- Lint: `npx biome check` (note: some committed files are not biome-clean; `npm run lint` applies unsafe fixes — review its diff before committing)

## Database migrations

- Schema is managed by alembic; `backend/scripts/prestart.sh` runs `alembic upgrade head` on every deploy.
- Developers with existing local databases must run `cd backend && uv run alembic upgrade head` (or rebuild the DB) after pulling changes that add migrations.
- The `drop_producer_and_review` migration (2026-08) removed the producer/producerimage/review tables and `item.producer_id` — producers and reviews no longer exist in the domain model; do not reintroduce them.

## Frontend API client drift (important)

- The committed client in `frontend/src/client/` is in the legacy `openapi-typescript-codegen` style (`CancelablePromise`, `__request(OpenAPI, ...)`).
- `package.json` depends on `@hey-api/openapi-ts` 0.99, which generates an incompatible new style. **Do NOT run `npm run generate-client` / `scripts/generate-client.sh`** — it rewrites the entire client and breaks every existing call site.
- When adding endpoints, hand-add functions to `sdk.gen.ts` / `types.gen.ts` in the existing legacy style (see the `nfc*` functions as examples).
- A full client migration is planned as a separate, dedicated change.
