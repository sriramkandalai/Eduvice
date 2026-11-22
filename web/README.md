# EduVice

EduVice (eduvice.org) helps immigrant parents understand the US school system. Parents ask a question in their own words, for example about enrolling a child, English-learner services, special education or school meals. A retrieval-augmented chatbot finds the most relevant passage in a curated school-system guide (stored in MongoDB Atlas Vector Search) and streams back a plain-language answer, with the source passage shown alongside it. The site is built with Next.js 14 (App Router), TypeScript, Tailwind CSS and next-intl. It starts in English and Spanish, and the layout uses logical CSS properties so right-to-left languages can be added later.

## Local setup

**Prerequisites:** Node.js 20.6+, a MongoDB Atlas cluster (the free M0 tier works), and an OpenAI API key.

```bash
cd web
npm install
cp .env.example .env.local      # then fill in MONGODB_URI and OPENAI_API_KEY
npm run seed                    # embeds data/seed-faqs.json, creates the vector index
npm run dev                     # http://localhost:3000 → redirects to /en
```

In Atlas, allow your IP under **Network Access** (on Vercel, allow `0.0.0.0/0`, because Vercel's IPs aren't fixed).

### Seeding the vector collection

`npm run seed` does the whole job:

1. Reads the FAQ chunks in `data/seed-faqs.json`.
2. Embeds each chunk with `text-embedding-3-small` (1536 dimensions).
3. Upserts the chunks by `slug` into `MONGODB_DB.MONGODB_COLLECTION`, and removes chunks no longer in the file.
4. Creates the Atlas Vector Search index if it doesn't exist yet, then waits until the index is queryable.

To change the corpus, edit the JSON file and run the command again. If you'd rather create the index by hand (Atlas → **Search & Vector Search** → **Create Search Index** → **Vector Search** → JSON editor), name it `faq_vector_index` and use:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" }
  ]
}
```

### Scripts

| Command             | What it does                    |
|---------------------|---------------------------------|
| `npm run dev`       | Dev server                      |
| `npm run build`     | Production build                |
| `npm run typecheck` | `tsc --noEmit` (strict mode)    |
| `npm run lint`      | ESLint                          |
| `npm run seed`      | Seed FAQs and the vector index  |

### Deploying to Vercel

Import the repo into Vercel, set **Root Directory** to `web`, and add the variables from `.env.example`. The root `index.html` (the coming-soon page) is not part of this app.

### Project notes

- UI strings live in `messages/{en,es}.json`. Add a locale by adding a messages file and listing the locale in `src/i18n/routing.ts`; for a right-to-left language, also add it to `RTL_LOCALES`.
- The colors are defined only in `src/app/globals.css` (`@theme`) and come from the brand palette. Tailwind's default colors are switched off.
- `/api/chat` streams `text/plain`. The cited source is returned in the `X-Source` response header as URI-encoded JSON.
