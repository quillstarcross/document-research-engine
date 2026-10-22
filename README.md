# CRELICS — Adaptive Search & Discovery

CRELICS is a mobile-first search and discovery prototype intended to help people move between web pages, images, videos, news, research, books, and public archives. It is a multi-provider discovery layer, not yet a complete independent search engine with its own web crawler and index.

## Current prototype

- Responsive home, search, explore, saved sources, and personalization views.
- Category tabs for All, Web, Images, Videos, News, Research, and Books.
- Open-web results from the Purili independent search index, where the public endpoint is available.
- Image metadata and previews from Wikimedia Commons.
- News article discovery through GDELT.
- Archived moving-image records from Internet Archive.
- Specialist book and research metadata from Open Library, Google Books, and Crossref.
- YouTube search hand-off. Direct YouTube Data API results are not enabled because YouTube requires a configured API credential.
- Source deduplication, relevance sorting, source filtering, local saved sources, and local search history.
- Local preferences for goals, interests, theme, layout density, and explanation depth.
- Controls to clear history and saved sources or reset the local profile.

## Run

Open `index.html` in a modern browser or publish the repository with GitHub Pages. Search requests are made directly from the browser to independent provider APIs. Results depend on internet connectivity, browser CORS rules, provider availability, provider policies, and rate limits. Not every provider returns results for every query.

## Important limitations

- **Not the whole internet yet:** CRELICS does not run its own web crawler, maintain a comprehensive index, or guarantee coverage of every site. Web search uses an external index; images, news, video archives, books, and scholarly works come from separate providers.
- **No fake video results:** the YouTube entry opens YouTube's own search page; it is not presented as an internally fetched list of YouTube videos. Direct API integration requires a credential managed securely outside client-side source code.
- **Provider quality varies:** metadata, ranking, snippets, images, freshness, and regional coverage depend on the underlying providers. The prototype does not claim to independently verify every source.
- Preferences, recent searches, and saved source records stay in this browser's localStorage. They are not synchronized to a server.
- Search queries are sent to the public providers used to retrieve results. Those providers operate under their own privacy policies.
- CRELICS does not read third-party cookies, inspect other sites' browsing history, or use browser fingerprinting.
- Personalization is preference-driven and local; it is not a trained user model. Personalization can be turned off, and data can be cleared.
- Do not enter confidential or sensitive information into searches.

## Product principles

- Search categories should follow the user's intent, while the All view keeps the experience broad.
- Results should retain source labels and direct links so users can inspect original material.
- Discovery should encourage useful exploration without manipulative dark patterns or compulsive engagement loops.
- Personalization should be explainable, optional, reversible, and based on permitted signals.

## Roadmap

1. Test provider response schemas, browser CORS, rate limits, error states, and mobile accessibility.
2. Add automated unit and browser tests for search, category filtering, saving, personalization, and data clearing.
3. Build a small backend/provider gateway for protected credentials, caching, rate limiting, and consistent error handling.
4. Add properly credentialed video, product, and place search integrations.
5. Improve ranking, deduplication, source-quality signals, freshness, and user-controlled discovery trails.
6. Evaluate privacy, security, reliability, latency, and cost before public launch.
