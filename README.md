<div align="center">
  <h1>google-docs-sync</h1>
  <br/>
  <p>
    <img src="./logo.svg" alt="google-docs-sync" height="100px">
  </p>
  <br/>

[![Build Status][badge-build]][actions]
[![Coverage][badge-coverage]][codecov]
[![MIT license][badge-licence]](./LICENCE.md)
[![PRs welcome][badge-prs]](./CONTRIBUTING.md)
[![Sponsor][badge-sponsor]](#support-this-project)

</div>

---

Use Google Docs as a content source. This monorepo holds the packages that read a Google Doc, convert it to Markdown or MDX, and handle the Google authentication they need.

|                                       &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;                                       | Package                                                             | Version                      | Description                                                              |
| :--------------------------------------------------------------------------------------------------------------------------------------------------: | ------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| <a href="./packages/gatsby-source-google-docs"><img src=".github/assets/icons/gatsby-source-google-docs.svg" width="46" height="24" align="top"></a> | [`gatsby-source-google-docs`](./packages/gatsby-source-google-docs) | [![npm][v-gatsby]][n-gatsby] | Gatsby plugin that uses Google Docs as a data source                     |
|  <a href="./packages/astro-loader-google-docs"><img src=".github/assets/icons/astro-loader-google-docs.svg" width="46" height="24" align="top"></a>  | [`astro-loader-google-docs`](./packages/astro-loader-google-docs)   | [![npm][v-astro]][n-astro]   | Astro content loader that uses Google Docs as a collection               |
|          <a href="./packages/next-google-docs"><img src=".github/assets/icons/next-google-docs.svg" width="46" height="24" align="top"></a>          | [`next-google-docs`](./packages/next-google-docs)                   | [![npm][v-next]][n-next]     | Next.js adapter that syncs Google Docs at build time                     |
|          <a href="./packages/google-docs-sync"><img src=".github/assets/icons/google-docs-sync.svg" width="24" height="24" align="top"></a>          | [`google-docs-sync`](./packages/google-docs-sync)                   | [![npm][v-sync]][n-sync]     | Sync a Google Drive folder of Google Docs to local Markdown or MDX files |
|   <a href="./packages/google-docs-to-markdown"><img src=".github/assets/icons/google-docs-to-markdown.svg" width="24" height="24" align="top"></a>   | [`google-docs-to-markdown`](./packages/google-docs-to-markdown)     | [![npm][v-md]][n-md]         | Convert a Google Docs API document to Markdown or MDX                    |
|    <a href="./packages/google-oauth2-env-vars"><img src=".github/assets/icons/google-oauth2-env-vars.svg" width="24" height="24" align="top"></a>    | [`google-oauth2-env-vars`](./packages/google-oauth2-env-vars)       | [![npm][v-oauth]][n-oauth]   | Generate and cache Google OAuth 2.0 tokens in `.env` files               |

## Which package do I need?

- **A Gatsby site**: [`gatsby-source-google-docs`](./packages/gatsby-source-google-docs).
- **An Astro site**: [`astro-loader-google-docs`](./packages/astro-loader-google-docs).
- **A Next.js site**: [`next-google-docs`](./packages/next-google-docs).
- **Another framework, a build script or the command line**: [`google-docs-sync`](./packages/google-docs-sync).

  ```shell
  npx google-docs-sync --folder <id>
  ```

  ```js
  import {syncGoogleDocs} from "google-docs-sync"

  const {documents} = await syncGoogleDocs({
    folder: "FOLDER_ID",
    outputDir: "src/content/docs",
  })
  ```

- **Only the conversion of a Google Docs API document**: [`google-docs-to-markdown`](./packages/google-docs-to-markdown).
- **Only Google OAuth tokens in `.env` files**: [`google-oauth2-env-vars`](./packages/google-oauth2-env-vars).

## How it works

The framework packages are thin adapters over `google-docs-sync`, which owns the Google APIs and the filesystem. Each package has its own README and CHANGELOG.

```text
gatsby-source-google-docs, astro-loader-google-docs, next-google-docs
  └─ google-docs-sync
       ├─ google-docs-to-markdown
       └─ google-oauth2-env-vars
```

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

[badge-build]: https://img.shields.io/github/actions/workflow/status/cedricdelpoux/google-docs-sync/ci.yml?branch=main&style=flat-square
[badge-coverage]: https://img.shields.io/codecov/c/github/cedricdelpoux/google-docs-sync/main.svg?style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[badge-prs]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[badge-sponsor]: https://img.shields.io/badge/sponsor-%E2%99%A5-ea4aaa.svg?style=flat-square
[actions]: https://github.com/cedricdelpoux/google-docs-sync/actions/workflows/ci.yml
[codecov]: https://app.codecov.io/gh/cedricdelpoux/google-docs-sync
[v-gatsby]: https://img.shields.io/npm/v/gatsby-source-google-docs.svg?style=flat-square
[n-gatsby]: https://www.npmjs.com/package/gatsby-source-google-docs
[v-astro]: https://img.shields.io/npm/v/astro-loader-google-docs.svg?style=flat-square
[n-astro]: https://www.npmjs.com/package/astro-loader-google-docs
[v-next]: https://img.shields.io/npm/v/next-google-docs.svg?style=flat-square
[n-next]: https://www.npmjs.com/package/next-google-docs
[v-sync]: https://img.shields.io/npm/v/google-docs-sync.svg?style=flat-square
[n-sync]: https://www.npmjs.com/package/google-docs-sync
[v-md]: https://img.shields.io/npm/v/google-docs-to-markdown.svg?style=flat-square
[n-md]: https://www.npmjs.com/package/google-docs-to-markdown
[v-oauth]: https://img.shields.io/npm/v/google-oauth2-env-vars.svg?style=flat-square
[n-oauth]: https://www.npmjs.com/package/google-oauth2-env-vars
