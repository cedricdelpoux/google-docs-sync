# google-docs-sync

## 0.2.2

### Patch Changes

- 4e280b5: Show the logo on a neutral tile.
- Updated dependencies [4e280b5]
  - google-docs-to-markdown@2.0.5
  - google-oauth2-env-vars@2.0.5

## 0.2.1

### Patch Changes

- c7a2847: Give every package a logo in the same family, shown in its README header.
- Updated dependencies [c7a2847]
  - google-docs-to-markdown@2.0.4
  - google-oauth2-env-vars@2.0.4

## 0.2.0

### Minor Changes

- 8d4ac47: Add a `comments` option that puts the comments of every Google Doc, with their replies and the passage they are attached to, in the `comments` field of its metadata. It is off by default because it costs one more Drive request per document on every sync. The Gatsby schema, the Astro schema and the Next.js types know the field.

## 0.1.3

### Patch Changes

- e95f1ab: Keep each README to the essentials: shared documentation lives in google-docs-sync and google-docs-to-markdown, and every package shows the same badges and support links.
- 9373095: Show the test coverage of each package with a Codecov badge in its README.
- Updated dependencies [e95f1ab]
- Updated dependencies [9373095]
  - google-docs-to-markdown@2.0.3
  - google-oauth2-env-vars@2.0.3

## 0.1.2

### Patch Changes

- 00c016e: List the GitHub Sponsors, Ko-fi, thanks.dev and PayPal links in `npm fund`, and point the README links to the `main` branch.
- Updated dependencies [00c016e]
  - google-docs-to-markdown@2.0.2
  - google-oauth2-env-vars@2.0.2

## 0.1.1

### Patch Changes

- b5643d0: Link the npm page to the package folder and the issues of the google-docs-sync repository.
- Updated dependencies [b5643d0]
  - google-docs-to-markdown@2.0.1
  - google-oauth2-env-vars@2.0.1

## 0.1.0

### Minor Changes

- cc60ae0: Release the framework-agnostic sync of the Gatsby plugin as a package of its own. `syncGoogleDocs` syncs a Google Drive folder to a directory of Markdown or MDX files with their images, and the `google-docs-sync` command does the same from the command line. `google-docs-sync-token` generates the Google token.

### Patch Changes

- Updated dependencies [cc60ae0]
  - google-docs-to-markdown@2.0.0
