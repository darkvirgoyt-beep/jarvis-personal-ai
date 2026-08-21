# Review: Supplied Vercel Routes Guide

## Extracted recommendation

The user-provided Notion page, **“Vercel’s Routes Problem,”** recommends two changes for a static single-page application (SPA): a browser-side URL restoration script in `index.html` for legacy `?/<path>` deep links, and a catch-all Vercel rewrite to the application entry point.

## Applicability to Jarvis

Jarvis is not static-only. Its production runtime contains authenticated `/api/*` endpoints for tRPC, streamed responses, and voice transcription. A global rewrite directly to `/` would send those API paths to the static client and break server routing, authentication, and streaming.

Jarvis already preserves the important SPA behavior safely with this ordered rewrite contract:

```json
[
  { "source": "/api/(.*)", "destination": "/api/[...path]" },
  { "source": "/(.*)", "destination": "/index.html" }
]
```

The client-side URL restoration script from the supplied guide is now included as a narrowly scoped compatibility guard. It runs only when the query begins with `?/`, restores the legacy encoded pathname through `history.replaceState`, and leaves ordinary query strings unchanged.

## Decision

Keep API handling before the SPA fallback, retain the client fallback to `/index.html`, and preserve the private authenticated server runtime. The safe legacy URL restoration step has been adopted; the guide’s static-only global destination of `/` has not replaced the API-safe Jarvis configuration.

## Source

- User-provided guide: [Vercel’s Routes Problem](https://magical-waitress-c79.notion.site/Vercel-s-Routes-Problem-1db4a5ce7e03803f877fe945b60bc0a8)
