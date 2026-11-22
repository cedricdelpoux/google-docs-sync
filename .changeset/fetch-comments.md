---
"google-docs-sync": minor
"gatsby-source-google-docs": minor
"astro-loader-google-docs": minor
"next-google-docs": minor
---

Add a `comments` option that puts the comments of every Google Doc, with their replies and the passage they are attached to, in the `comments` field of its metadata. It is off by default because it costs one more Drive request per document on every sync. The Gatsby schema, the Astro schema and the Next.js types know the field.
