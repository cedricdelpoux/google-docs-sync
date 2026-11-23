# google-docs-sync monorepo

npm workspaces monorepo. Everything is ESM or plain JavaScript checked with tsc (JSDoc types), Node >= 22.12.

## Layout

- `packages/gatsby-source-google-docs`: the Gatsby plugin, a thin adapter over `google-docs-sync` (source nodes, pages, schema, Gatsby options). Its `examples/` are Gatsby sites with their own tooling, they are not workspaces.
- `packages/astro-loader-google-docs`: the Astro content loader over `google-docs-sync` (Markdown only, images optimised by Astro). Its `examples/basic` site runs on port 8105 and installs the loader as a copy (`install-links=true`), because Astro fails on a symlinked one.
- `packages/next-google-docs`: the Next.js adapter over `google-docs-sync`. `withGoogleDocs()` syncs once when `next dev` or `next build` starts and copies the images to `public/`, `next-google-docs/documents` reads the synced files. Its `examples/basic` site runs on port 8106.
- The examples are not workspaces, their lockfiles are git-ignored, and they read the Google credentials from their own git-ignored `.env`.
- `packages/google-docs-sync`: the framework-agnostic sync (depends on `google-docs-to-markdown` and `google-oauth2-env-vars`). It owns everything that touches the Google APIs and the filesystem: auth and token, Drive folder walk, document fetching, the `.google-docs` store, writing the Markdown and images. Frameworks inject a logger (`{info, warn, error}`) and read the returned documents. Its CLI bins are `google-docs-sync` and `google-docs-sync-token`.
- `packages/google-docs-to-markdown`: the pure converter, Google Docs API document JSON in, Markdown or MDX out. It knows nothing about Google APIs or the filesystem.
- `packages/google-oauth2-env-vars`: token generation, CommonJS.
- Shared at the root: `eslint.config.js` (one flat config with per-package overrides), `.prettierrc`, `.prettierignore`, `.editorconfig`, `.npmrc`, `.github/`, `.changeset/`, and the single `package-lock.json`.
- The dev dependencies shared by the packages (eslint, prettier, typescript, vitest, coverage, `@types/node`, globals) live in the root `package.json`. A package declares only its own.
- Each package keeps its own `LICENCE.md` copy because npm packs it from the package folder.
- The repository is `cedricdelpoux/google-docs-sync` on GitHub (formerly `gatsby-source-google-docs`), the `repository.url` of every package points to it.
- Internal dependency ranges (`google-docs-to-markdown: ^1.0.1`) stay as they are: npm links the workspace packages while the versions satisfy the ranges.

## Logos

Each package has a `logo.svg` (the README header) and a table icon in `.github/assets/icons/<package>.svg` (the root README table). The root `logo.svg` is the `google-docs-sync` one.

- The base mark is a neutral tile: a 224 px square (`rx` 56, the strava-sync tile) filled with `#9AA0A6` at 25% opacity, so it reads on light and dark backgrounds. The 2026 Google Docs blue doc sits inside it at 0.75 scale (109 px wide, 150 px high), centred on the tile: its bounding box is (0, 0, 800, 1100) in the doc's own units, scaled by 0.75 × 200/1100 and translated by (57.45, 37).
- The bottom-right badge says what the package does. The bottom-left badge is the framework it plugs into, and only framework packages have one. Both are discs of radius 51 centred on the tile corners, (224, 224) and (0, 224), each with a transparent gap of radius 65 cut into the tile. The gaps stay 10 px away from the doc, which is why it is scaled down: at full size its corners would be cut. There are no borders or strokes around any shape.
- Every logo uses the same `viewBox="-53 -2 330 279"`, so the tile renders at the same size and place in every README header. It is the same box as in the strava-sync monorepo.
- Badge colours, with a white glyph (Astro keeps its flame gradient, Next its fading N): sync `#0969DA`, key (OAuth token) `#B45309`, Gatsby `#639`, and a neutral translucent grey `#3D444D` at 90% opacity for markdown, Astro and Next (the official Astro and Next marks are black, which vanishes on dark backgrounds). A new feature or framework gets its own colour, distinct from these and from the doc blue. The sync, Gatsby and neutral grey colours are shared with strava-sync.
- Features: `google-docs-sync` is sync, `google-docs-to-markdown` is markdown, `google-oauth2-env-vars` is key. The three adapters get their framework bottom-left and sync bottom-right.
- The table icon is the feature disc alone, or for a framework package, the framework disc on the left, partly hidden behind the feature disc on the right, both the same size, with a gap cut between them. A one-disc icon uses `viewBox="-2 -2 106 106"` with one disc of radius 51. A two-disc icon uses `viewBox="-2 -2 198 106"` with both discs at that same full size: the framework disc at `translate(0 0)`, the feature disc at `translate(92 0)`, so the discs barely overlap, and a mask cutting a circle of radius 59 centred on the feature disc (`cx` 143) (radius 51 plus an 8 px gap) out of the framework disc. The README table shows every icon 24 px tall (`24x24` for one disc, `45x24` for two), so the discs have the same diameter in every row.
- Every package README starts with the same centred header: `<div align="center">`, the `<h1>`, the logo at `height="100px"`, then the badge row in the same block.

## Commands

Run from the root.

- `npm install`: install everything and link the packages. With npm 10, a fresh resolution without a lock fails on the gatsby peer dependencies (npm bug): use npm 11 (`npx npm@11 install`) when the lock needs to be regenerated.
- `npm run lint`: builds the types first (gatsby and google-docs-sync type-check against the built types of the packages they depend on), then runs `eslint` and `tsc --noEmit` in each package, then `prettier --check .` at the root.
- `npm test`: runs each package test script.
- `npm run build`: `tsc` in each package, it writes the git-ignored `types/` folders.
- `npm run format`: `prettier --write .`.
- `npm pack --dry-run -w <package>`: check the published files.

## Commits and releases

Commits, versioning and publishing follow the `open-source` skill: the package name as scope, one release commit per bumped package, versioned locally and pushed to `main`.

- Independent versions with changesets (`.changeset/config.json`, base branch `main`). A change to a package comes with a changeset: `npm run changeset`.
- `.github/workflows/release.yml` only publishes: it runs `npm run release` (`changeset publish`) through npm trusted publishing (OIDC, no token) for the versions npm does not have yet. A guard step fails the run when a changeset is pending, so the action never versions, commits or opens a pull request.
- Tags are `<package>@<version>`. The ones imported before the merge are `google-docs-to-markdown@v1.0.1` and `google-oauth2-env-vars@v2.0.0`, the gatsby plugin keeps its old `vX.Y.Z` tags.
- `.github/workflows/ci.yml` runs lint and tests on Node 22 and 24 (Gatsby 5 does not support Node 26).
