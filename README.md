# CRELICS — Adaptive Search & Discovery

CRELICS is an early, mobile-first prototype for source discovery and adaptive research. The interface adapts to user-selected goals, interests, preferred explanation depth, and activity stored locally in the browser.

## Current prototype

- Responsive home, search, explore, saved sources, and personalization views.
- Multi-source metadata search using public endpoints from Open Library, Google Books, Internet Archive, and Crossref.
- Basic relevance sorting, source filtering, search history, and local saved sources.
- Local preferences for goals, interests, theme, layout density, and explanation depth.
- Controls to inspect the purpose of personalization, clear history and saved sources, or reset the local profile.
- Search remains available without an account or personalization.

## Run

This prototype is a static website. Open `index.html` in a modern browser or publish the repository with GitHub Pages. Search requests are made directly from the browser to the public provider APIs, so results depend on browser connectivity, provider availability, CORS policies, and provider limits.

## Privacy and limitations

- CRELICS stores preferences, recent searches, and saved source records in this browser's localStorage. They are not synchronized to a server in this prototype.
- Search queries are sent to the public search/catalog providers used to retrieve results. Those providers operate under their own privacy policies.
- This prototype does not read third-party cookies, inspect other sites' browsing history, or use browser fingerprinting.
- It is not a comprehensive web crawler or a general web search index. Results are drawn from the providers listed above.
- Personalization is a simple preference-driven prototype, not a trained user model. Recommendations are suggestions, not claims about a user's identity.
- Do not enter confidential or sensitive information into searches.
- A production version should add automated tests, accessibility review, robust API/provider handling, security review, privacy notices and controls appropriate to the deployment, and a backend if secrets, rate limiting, or account synchronization are introduced.

## Roadmap

1. Validate core flows and accessibility on mobile and desktop.
2. Improve provider adapters, deduplication, relevance ranking, and failure handling.
3. Add source-grounded synthesis only when a suitable service is configured securely.
4. Expand user-controlled discovery and research projects.
5. Evaluate privacy, security, quality, latency, and cost before a public launch.
