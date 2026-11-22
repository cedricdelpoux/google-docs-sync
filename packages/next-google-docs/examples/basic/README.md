# next-google-docs basic example

A minimal Next.js App Router site on the demo Google Drive folder: an index page that lists the documents, and `app/[...path]/page.jsx` that renders each one with its images.

The server runs on http://localhost:8106 (`next dev -p 8106` and `next start -p 8106`): Next.js fails when the port is taken instead of using another one.

```shell
cd packages/next-google-docs/examples/basic
npm install
npx google-docs-sync-token   # or copy a .env with the 3 Google variables
npm run dev                  # http://localhost:8106
npm run build && npm start   # static build, served on http://localhost:8106
```

`next.config.mjs` sets `turbopack.root` because the adapter is linked from the monorepo. A site that installs `next-google-docs` from npm does not need it.
