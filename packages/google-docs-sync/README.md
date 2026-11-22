# google-docs-sync

[![Npm][badge-npm]][npm]
[![Build Status][badge-build]][actions]
[![Coverage][badge-coverage]][codecov]
[![Downloads][badge-downloads]][npm]
[![PRs welcome][badge-prs]][contributing]
[![MIT license][badge-licence]][licence]
[![Sponsor][badge-sponsor]][sponsor]

`google-docs-sync` syncs a [Google Drive](https://drive.google.com/) folder of [Google Docs](https://docs.google.com/) to a local directory of Markdown or MDX files, with their images. It is the framework-agnostic core of [gatsby-source-google-docs](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/gatsby-source-google-docs), [astro-loader-google-docs](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/astro-loader-google-docs) and [next-google-docs](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/next-google-docs), and it works with any static site generator or script: use it from a build script, a content loader or the command line.

The Markdown conversion is done by [google-docs-to-markdown](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/google-docs-to-markdown).

## Features

- The documents of a folder and of its subfolders, written as one file per document
- Slugs, breadcrumbs and custom metadata taken from the Google Drive tree
- Images downloaded next to the documents, with their paths rewritten
- Incremental syncs: only the documents and images that changed are fetched
- Files that are not part of the sync anymore are deleted
- A Node API and a command line

## Installation

```shell
npm install google-docs-sync
```

Node 22.12 or later is required. The package is an ES module and comes with its TypeScript types.

## Token generation

The sync needs 3 variables, in the environment or in a `.env` file.

<p><details><summary>Preview variables</summary>

```dotenv
GOOGLE_OAUTH_CLIENT_ID=2...m.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=Q...axL
GOOGLE_DOCS_TOKEN={"access_token":"ya...J0","refresh_token":"1..mE","scope":"https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/drive.readonly","token_type":"Bearer","expiry_date":1598284554759}
```

</details></p>

Run the following command at the root of your project to generate them:

```shell
npx google-docs-sync-token
```

The command walks you through the setup in the terminal:

1. Enable the Google Docs API and the Google Drive API in the [Google Cloud console](https://console.cloud.google.com/apis/library).
2. Create an OAuth 2.0 client of type "Desktop app", and paste its `Client ID` and `Client secret` when asked.
3. Authorize the application in your browser.

The variables are written to your `.env` file, which you should add to your `.gitignore`. The token can read Google Docs and Google Drive. The generation is done by [google-oauth2-env-vars](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/google-oauth2-env-vars), which tells more about what the command does.

## Usage

### Node API

```js
import {syncGoogleDocs} from "google-docs-sync"

const {documents, files} = await syncGoogleDocs({
  // https://drive.google.com/drive/folders/FOLDER_ID
  folder: "FOLDER_ID",
  outputDir: "src/content/docs",
})

for (const {filePath, markdown, metadata} of documents) {
  console.log(metadata.slug, filePath)
}
```

`syncGoogleDocs(options)` returns a promise of:

| Field                   | Description                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `documents`             | `{filePath, markdown, metadata}` for every document: where it is written, what is written, and its frontmatter (`id`, `name`, `slug`, `path`, `breadcrumb`, `date`, `cover`, and your own metadata) |
| `files`                 | Every file of `outputDir` after the sync: the documents and their images                                                                                                                            |
| `fetchedCount`          | The number of documents fetched from Google Docs, the others came from the cache                                                                                                                    |
| `imagesCount`           | The number of images in `outputDir`                                                                                                                                                                 |
| `downloadedImagesCount` | The number of images downloaded from Google, the others came from the cache                                                                                                                         |

It throws when the folder is missing or when Google refuses a request.

The package also exports:

- `getAuth()`: the Google client built from the environment variables
- `generateToken()`: what `google-docs-sync-token` runs
- `fetchDocument(id, {auth})`: the Google Docs API document of one document id

```js
import {fetchDocument} from "google-docs-sync"
import {toMarkdown} from "google-docs-to-markdown"

const markdown = toMarkdown(await fetchDocument(id), {
  frontmatter: {title: "Home"},
})
```

### Command line

```shell
npx google-docs-sync --folder FOLDER_ID --output-dir src/content/docs
```

| Flag                 | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `--folder <id>`      | Google Drive folder id, `GOOGLE_DOCS_FOLDER` by default |
| `--output-dir <dir>` | `outputDir`                                             |
| `--cache-dir <dir>`  | `cacheDir`                                              |
| `--extension <ext>`  | `extension`: `md` or `mdx`                              |
| `--skip-images`      | `skipImages`                                            |
| `--debug`            | `debug`                                                 |

The variables of the [token generation](#token-generation) are read from the environment or from `.env`.

### Options

| Option        | Required | Type    | Default                 | Example                        |
| ------------- | -------- | ------- | ----------------------- | ------------------------------ |
| folder        | `true`   | String  | `null`                  | `"1Tn1dCbIc"`                  |
| outputDir     | `false`  | String  | `"content/google-docs"` | `"src/content/docs"`           |
| cacheDir      | `false`  | String  | `".google-docs"`        | `".cache-docs"`                |
| extension     | `false`  | String  | `"md"`                  | `"mdx"`                        |
| imagesOptions | `false`  | Object  | `null`                  | `{width: 512}`                 |
| debug         | `false`  | Boolean | `false`                 | `true`                         |
| auth          | `false`  | Object  | from the environment    | a `google-auth-library` client |
| logger        | `false`  | Object  | `console`               | `{info, warn, error}`          |

- `outputDir` is managed by the sync: any other file it contains is deleted, so point it at a directory of its own and add it to your `.gitignore`.
- `imagesOptions` is the size the images are downloaded at, between 1 and 16383 (`width`, `height`, `crop`). Changing it downloads them again.
- `logger` receives the messages of the sync: `warn` for what is skipped (a description that is not valid YAML, an image that could not be downloaded), `info` for the progress in `debug` mode.

The conversion options of [google-docs-to-markdown](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/google-docs-to-markdown#options) are accepted too: `escapeMdxSyntax`, `demoteHeadings` (`true` by default here), `keepDefaultStyle` and the `skip*` ones. `mdx` follows `extension`, and `frontmatter` and `links` are filled by the sync.

## Output

Every document is written under `outputDir` at the path of its slug, and its images in an `images` directory next to it:

```
content/google-docs
├── index.md                    # the document whose slug is "/"
├── installation.md
├── images.md
└── images
    └── images                  # one directory per document
        ├── alt-text.png
        └── images-2.png
```

Each file holds the document metadata as `YAML` frontmatter and its content as Markdown. The images are referenced by paths relative to the document.

## Organize your documents

Go to your [Google Drive](https://drive.google.com/drive/), create a folder and put some documents inside it.

```js
↳ 🗂 Root folder `template: page`
    ↳ 🗂 en `locale: en` `skip: true`
        ↳ 📝 Home `template: home`
        ↳ 📝 About
        ↳ 🗂 Posts `template: post`
            ↳ 🗂 Drafts `exclude: true`
                ↳ 📝 Draft 1
            ↳ 📝 My year 2020 `date: 2021-01-01`
            ↳ 📝 Post 2 `slug: /custom/slug` `template: special-post`
    ↳ 🗂 fr `locale: fr`
        ↳ 📝 Accueil `template: home`
```

<p><details><summary>How to enhance documents with metadata?</summary>

- Fill the document (or folder) `description` field in Google Drive with a `YAML` object

```yaml
locale: fr
template: post
category: Category Name
tags: [tag1, tag2]
slug: /custom-slug
date: 2019-01-01
```

> There are special metadata
>
> - For folders:
>   - `exclude: true`: Exclude the folder and its documents
>   - `skip: true`: Remove the folder from slug but keep its documents
> - For documents:
>   - `index:true`: Use document as the folder index
>   - `page: false`: Prevent page creation by the plugins that create pages, such as `gatsby-source-google-docs` with its `createPages` option

- Spread metadata into the tree using folders metadata.

> ⬆️ For the tree example above:
>
> - Every node will have `template: page` defined as default excepts if you redefine it later.
> - `template` is plain metadata: what uses it (a Gatsby template, an Astro layout, ...) is up to the framework.
> - "en" folder will be removed from slug because of `skip: true`

- Exclude folders and documents using `exclude: true`. Perfect to keep drafts documents. One you want to publish a page, juste move the document one level up.

> ⬆️ For the tree example above:
>
> - Documents under `Drafts` will be exclude because of `exclude: true`.

- Every metadata is written in the frontmatter of the document, and returned in the `metadata` field of the documents of `syncGoogleDocs`

</details></p>

<p><details><summary>How to add cover?</summary>

Add an image in your [Google Document first page header](https://support.google.com/docs/answer/86629)

</details></p>

<p><details><summary>How to add slug and breadcrumb?</summary>

`slug` and `breadcrumb` fields add automatically generated using the folders tree structure and transformed using `kebab-case`.

> ⬆️ For the tree example above:
> The frontmatter of the document `My year 2020`
>
> ```js
> {
>     path: "/en/posts/my-year-2020" // Original Google Drive path
>     slug: "/posts/my-year-2020" // `en` is out because of `skip: true`
>     breadcrumb: [
>         {name: "Posts", slug: "/posts"},
>         {name: "My year 2020", slug: "/posts/my-year-2020"},
>     ],
>     template: "post" ,// src/templates/post.js
>     locale: "fr",
>     date: "2021-01-01" // Fixed date !
> }
> ```
>
> The frontmatter of the document `Post 2` will have a custom slug
>
> ```js
> {
>     path: "/en/posts/post-2"
>     slug: "/custom/slug"
>     breadcrumb: [
>         {name: "Posts", slug: "/posts"},
>         {name: "Post 2", slug: "/custom/slug"},
>     ],
>     template: "special-post",  // src/templates/special-post.js
>     locale: "en",
>     date: "2020-09-12" // Google Drive document creation date
> }
> ```

You also can add metadata (`locale`, `date`, `template`, ...) to your documents.

</details></p>

## Only what changed is fetched

Fetching a document is one request, and every image it holds is a download of
its own: a folder of long documents full of images takes minutes to fetch. `google-docs-sync` keeps them in the `cacheDir` directory
(`.google-docs` by default), and a sync only fetches what changed since the
previous one.

```
.google-docs
├── documents
│   └── 1Tn1dCbIc.json       # one file per document, as Google gave it
├── images
│   └── 1Tn1dCbIc            # the images it references, downloaded once
│       └── kix.4dmdp8b4.png
└── state.json
```

Google Drive gives the time a document was last modified while listing the
folder, which the sync already does: a document that has not been touched
since it was stored is never fetched again, and neither are its images. Editing
a document on Google Docs, renaming it, changing its description or moving it
to another folder is picked up on the next sync — its metadata always comes
from the listing, fetched or not.

The documents are stored as Google gave them, not as markdown: changing
`demoteHeadings`, `extension` or any other option takes effect on the next
sync without fetching anything again. Changing `imagesOptions` downloads the
images again, since their size is part of the URL they are downloaded from.

> Add `.google-docs` to your `.gitignore`, or commit it to give your continuous
> integration a folder it does not have to fetch. Delete it to fetch everything
> again.

This directory is **not** the cache of a framework, on purpose: frameworks
empty their own whenever their configuration or a dependency changes, and a
continuous integration job never has one, so adding a dependency to your site
would cost a complete refetch.

## Support this project

<p align="center">
  <a href="https://github.com/cedricdelpoux"><img src="https://images.weserv.nl/?url=github.com/cedricdelpoux.png&w=128&h=128&fit=cover&mask=circle" width="64" height="64" alt="Cédric Delpoux"></a>
</p>

<p align="center">
  Hi, I'm <a href="https://cedricdelpoux.fr/en">Cédric</a>.<br>
  Between my three kids, I maintain <a href="https://github.com/cedricdelpoux?tab=repositories">open source projects</a> during my free time.<br>
  If my work is useful to you, a star, a one-time tip or a monthly sponsorship all help a lot.<br>
  Thank you very much!
</p>

<p align="center">
  <a href="https://thanks.dev/u/gh/cedricdelpoux"><img src="https://img.shields.io/badge/thanks.dev-000000?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyMCI%2BPHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIuNiIgZD0iTTkgMkM2IDIgNS41IDMgNS41IDUuNVY4QzUuNSA5LjMgNC41IDEwIDIgMTBDNC41IDEwIDUuNSAxMC43IDUuNSAxMlYxNC41QzUuNSAxNyA2IDE4IDkgMThNMTUgMkMxOCAyIDE4LjUgMyAxOC41IDUuNVY4QzE4LjUgOS4zIDE5LjUgMTAgMjIgMTBDMTkuNSAxMCAxOC41IDEwLjcgMTguNSAxMlYxNC41QzE4LjUgMTcgMTggMTggMTUgMTgiLz48L3N2Zz4%3D" alt="thanks.dev"></a>
  <a href="https://github.com/sponsors/cedricdelpoux"><img src="https://img.shields.io/badge/GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="GitHub Sponsors"></a>
  <a href="https://ko-fi.com/cedricdelpoux"><img src="https://img.shields.io/badge/Ko--fi-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white" alt="Ko-fi"></a>
  <a href="https://paypal.me/cedricdelpoux"><img src="https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal"></a>
</p>

[badge-npm]: https://img.shields.io/npm/v/google-docs-sync.svg?style=flat-square
[badge-downloads]: https://img.shields.io/npm/dt/google-docs-sync.svg?style=flat-square
[badge-build]: https://img.shields.io/github/actions/workflow/status/cedricdelpoux/google-docs-sync/ci.yml?branch=main&style=flat-square
[badge-coverage]: https://img.shields.io/codecov/c/github/cedricdelpoux/google-docs-sync/main.svg?flag=google-docs-sync&style=flat-square
[badge-prs]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[badge-sponsor]: https://img.shields.io/badge/sponsor-%E2%99%A5-ea4aaa.svg?style=flat-square
[npm]: https://www.npmjs.com/package/google-docs-sync
[actions]: https://github.com/cedricdelpoux/google-docs-sync/actions/workflows/ci.yml
[codecov]: https://app.codecov.io/gh/cedricdelpoux/google-docs-sync/tree/main/packages/google-docs-sync
[contributing]: https://github.com/cedricdelpoux/google-docs-sync/blob/main/CONTRIBUTING.md
[licence]: https://github.com/cedricdelpoux/google-docs-sync/blob/main/LICENCE.md
[sponsor]: #support-this-project
