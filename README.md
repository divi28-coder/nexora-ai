# NEXORA AI

NEXORA AI is an existing Next.js 14 / React / TypeScript / Tailwind / Prisma / PostgreSQL career-intelligence application. It includes authentication, resume workflows, rule-based resume analysis, job-description matching, question practice, text interview sessions, roadmap tasks, activity history, and Career Twin-style guidance. Demo-mode results are estimates and are not presented as verified job-market data.

> Read `IMPLEMENTATION_STATUS.md` before treating this as production-ready. Some requested modules remain partial, and this archive could not be compiled in the current offline execution environment.

## Windows PowerShell setup

Requirements: Node.js 20+, Docker Desktop, PowerShell.

```powershell
Expand-Archive .\nexora-ai-complete.zip -DestinationPath .
Set-Location .\nexora-ai-complete
Copy-Item .env.example .env
# Edit .env and set SESSION_SECRET to a unique random 32+ character value.
docker compose up -d db
npm install
npm run db:generate
# For a new local database only, create an initial migration:
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

**Existing database warning:** Do not run `prisma migrate reset`, `prisma db push --force-reset`, `docker compose down -v`, or any destructive database command against a database containing your records. If you are connecting to an existing database, take a verified backup and inspect its schema/migration state before applying schema changes. The supplied repository has no checked-in migration history; the `migrate dev --name init` instruction is for a new local database and is not a safe generic upgrade command for an existing database.

## Environment configuration

Copy `.env.example` to `.env` and set secrets locally. Never commit `.env`.

- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET`: unique random secret used to sign the HTTP-only session cookie.
- `AI_PROVIDER=demo`: deterministic fallback mode; no AI provider calls are made.
- `AI_PROVIDER=auto`: uses configured providers in Gemini → OpenAI → Anthropic order.
- `AI_PROVIDER=gemini`, `openai`, or `anthropic`: pins the app to that provider and does not silently select another provider.
- `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`: optional server-side provider credentials.
- `*_MODEL`: provider-specific model identifier. Defaults are supplied in `.env.example`; verify availability for your account before use.
- `AI_TIMEOUT_MS`: bounded request timeout (1,000–120,000 ms).
- `AI_MAX_RETRIES`: bounded retry count (0–3).

The `*_API_KEYS` variables are accepted as environment configuration for compatibility, but this version uses the primary key for each provider; it does **not** rotate keys to evade rate limits or quotas. Retryable failures may move to another provider only when `AI_PROVIDER=auto` and that provider is explicitly configured. No credentials are returned by the authenticated `/api/ai/status` endpoint. Live providers may incur charges. Keep keys on the server and within provider terms and billing limits.

The app can still run in demo mode without AI credentials. Resume analysis, roadmaps, interview prompts, and job matching can fall back to deterministic/rule-based results; these should not be mistaken for generative AI or live market data.

## Available checks

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

These scripts are defined in `package.json`. The source archive includes Vitest unit tests. The checks were **not successfully run in the authoring sandbox** because dependency installation timed out in the network-restricted environment. Run the commands locally after `npm install`; fix any environment-specific errors before deployment.

## Privacy and safety notes

- Camera preview is local-only in the current implementation; video is not uploaded or recorded.
- Browser speech capabilities depend on browser support and permissions.
- Interview transcript persistence is controlled by the user's consent setting.
- User-facing protected API routes should authenticate and scope queries to the current user.
- Do not use untrusted user code in the Next.js process. Server-side sandboxed code execution is not implemented.
- Live job discovery and real-time AI video/avatar integrations are not implemented. External search links/recommendations must not be represented as verified job listings.
- Complete translations of every module and AI response are not yet available. The language preference and core navigation labels support English, Tamil, Hindi, Telugu, Kannada, and Malayalam, with English fallback.

## Troubleshooting

- `SESSION_SECRET is not set`: set it in `.env` and restart the server.
- Prisma cannot connect: confirm `docker compose ps` shows `db` healthy/running and check `DATABASE_URL`.
- Prisma client errors: run `npm run db:generate` after installing dependencies.
- AI falls back to demo: check `/api/ai/status` while signed in, verify the selected provider, model identifier, and server-side key.
- If checks fail, use the first compiler/test error as the starting point and do not disable TypeScript or lint checks to force a green build.
