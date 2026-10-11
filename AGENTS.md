# AGENTS.md

## Project Context

This is the LiveNexus application repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup and development workflow.

## Key Files

- `dashboard/`: frontend application source, UI components, connection ramais, and admin panel.
- `dashboard/configuracao/Config_liveNexusClient.js`: frontend client.
- `vite.config.js`: Vite configuration and integrated API route plugins.
- `.env`: local environment configuration; never commit secrets.

## Working Notes

- Use `npm run dev` as the local development command (runs Vite dev server on port 3000 with integrated API middleware).
- Run the relevant checks from `package.json` (`npm run lint`, `npm run build`) before finishing code changes.
