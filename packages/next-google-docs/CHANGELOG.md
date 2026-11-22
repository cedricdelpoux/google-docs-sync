# next-google-docs

## 0.2.0

### Minor Changes

- 8d4ac47: Add a `comments` option that puts the comments of every Google Doc, with their replies and the passage they are attached to, in the `comments` field of its metadata. It is off by default because it costs one more Drive request per document on every sync. The Gatsby schema, the Astro schema and the Next.js types know the field.

### Patch Changes

- Updated dependencies [8d4ac47]
  - google-docs-sync@0.2.0

## 0.1.3

### Patch Changes

- e95f1ab: Keep each README to the essentials: shared documentation lives in google-docs-sync and google-docs-to-markdown, and every package shows the same badges and support links.
- 9373095: Show the test coverage of each package with a Codecov badge in its README.
- Updated dependencies [e95f1ab]
- Updated dependencies [9373095]
  - google-docs-sync@0.1.3

## 0.1.2

### Patch Changes

- 00c016e: List the GitHub Sponsors, Ko-fi, thanks.dev and PayPal links in `npm fund`, and point the README links to the `main` branch.
- Updated dependencies [00c016e]
  - google-docs-sync@0.1.2

## 0.1.1

### Patch Changes

- b5643d0: Link the npm page to the package folder and the issues of the google-docs-sync repository.
- Updated dependencies [b5643d0]
  - google-docs-sync@0.1.1

## 0.1.0

### Minor Changes

- 802ee03: Add `next-google-docs`, a Next.js integration that syncs a Google Drive folder of Google Docs when `next dev` or `next build` starts, and reads the documents from App Router pages.
