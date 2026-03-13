# Turna Agent Guide

## Purpose
This agent helps maintain and improve the Turna SMS API Simulator frontend and backend proxy codebase safely and consistently.

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend proxy: Vercel serverless function in `api/proxy.ts`
- Shared types/config: `types.ts`, `constants.ts`

## Repository Map
- `App.tsx`: main application shell
- `components/`: UI panels and visualization
- `services/simulator.ts`: request orchestration and client-side status mapping
- `api/proxy.ts`: live upstream forwarding and response normalization
- `constants.ts`: endpoint definitions and initial stats
- `types.ts`: enums and shared interfaces

## Working Rules
1. Keep changes minimal and scoped to the user request.
2. Preserve TypeScript strictness and existing public interfaces unless explicitly asked.
3. Do not remove endpoint definitions unless requested.
4. Prefer fixing classification/timeout/retry logic over adding new complexity.
5. Do not introduce secrets or hardcoded sensitive values.
6. Keep logs concise and action-oriented.
7. Update related types when adding new statuses or response fields.

## Coding Conventions
- Use existing enum values from `RequestStatus`.
- Keep network timing measured with `performance.now()` in the simulator.
- In proxy responses, always return JSON with stable fields:
  - `ok`
  - `upstreamStatus` (when available)
  - `error` (when applicable)
  - optional debug preview fields
- Handle parse failures defensively (`response.json().catch(...)`).

## Reliability Checklist
When touching request flow, validate:
1. Serial mode behavior remains deterministic.
2. Parallel mode does not flood or freeze UI.
3. Timeout and abort paths produce clear `FAILED` messages.
4. Upstream non-2xx responses are not mislabeled as hard transport failures.
5. Circuit breaker behavior stays per-service and recoverable.

## UI/UX Checklist
- Keep dashboard counters consistent with log status mapping.
- Ensure status colors/labels remain aligned with enums.
- Do not block rendering while requests are in flight.

## Testing and Verification
After edits, run:
1. Type check/build (`npm run build`)
2. Manual smoke test in both modes:
   - Safe Simulation
   - Live Backend
3. Verify at least one success, one sent/opaque, and one failure path is represented correctly in logs.

## Non-Goals
- Do not add offensive or abusive output handling.
- Do not implement any feature intended for abuse of third-party systems.
- Do not bypass anti-bot protections.

## Suggested Response Style
- Explain what changed, why, and expected impact.
- Reference affected files explicitly.
- Call out any uncertainty (network variance, upstream behavior changes).
