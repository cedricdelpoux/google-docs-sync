<div align="center">
  <h1>google-oauth2-env-vars</h1>

[![Npm][badge-npm]][npm]
[![Build Status][badge-build]][actions]
[![Coverage][badge-coverage]][codecov]
[![Downloads][badge-downloads]][npm]
[![PRs welcome][badge-prs]][contributing]
[![MIT license][badge-licence]][licence]
[![Sponsor][badge-sponsor]][sponsor]

</div>

---

Helper class to generate and cache `Google OAuth 2.0` tokens in `.env` files. It generates the token of [google-docs-sync](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/google-docs-sync#token-generation) and of the packages built on it.

```dotenv
GOOGLE_OAUTH_CLIENT_ID=23...8o1jm.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=QL...naxL
GOOGLE_DOCS_TOKEN={"access_token":"ya..54c","refresh_token":"1..qq0","scope":"https://www.googleapis.com/auth/documents.readonly","token_type":"Bearer","expiry_date":1598277881619}
```

## Usage

It requires Node.js 22 or later. Download the package from the npm registry:

```shell
npm install google-oauth2-env-vars
```

### Generate .env vars

```js
const GoogleOAuth2 = require("google-oauth2-env-vars")

const googleOAuth2 = new GoogleOAuth2({
  // .env token var name
  token: "GOOGLE_DOCS_TOKEN",
  // Authorization scope
  scope: ["https://www.googleapis.com/auth/documents.readonly"],
  // APIs to enable in Google console
  apis: ["docs.googleapis.com"],
  //
  // Optional
  //
  // Fixed port of the local server receiving the authorization code,
  // for a "Web application" client. Any free port by default.
  port: 5000,
})

const envVars = await googleOAuth2.generateEnvVars()
```

When the variables are missing from the environment, `generateEnvVars()` walks you through the setup in the terminal:

1. It asks you to enable each API in `apis` in the Google Cloud console.
2. It asks for the `Client ID` and `Client secret` of an OAuth 2.0 client of type "Desktop app". With a fixed `port`, it can also be a "Web application" client whose authorized redirect URI is `http://localhost:<port>/callback`.
3. It asks you to authorize the application, and receives the authorization code on a local server, which listens on any free port unless `port` is set. The authorization uses PKCE.
4. It writes `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` and the token to the `.env` and `.env.*` files of the current directory, or to a new `.env` file when there is none. It leaves out `.envrc` and the templates `.env.example`, `.env.sample` and `.env.template`, which are often committed. A variable that is already there is replaced.

Each URL is printed in the terminal and opened in your browser when possible.

### Get Auth

`getAuth()` returns an `OAuth2Client` from [google-auth-library](https://www.npmjs.com/package/google-auth-library), which refreshes the access token when it expires:

```js
const GoogleOAuth2 = require("google-oauth2-env-vars")
const {docs} = require("@googleapis/docs")

const googleOAuth2 = new GoogleOAuth2({
  // .env token var name
  token: "GOOGLE_DOCS_TOKEN",
})
const auth = await googleOAuth2.getAuth()
const googleDocs = docs({version: "v1", auth})
```

`getEnvVars()` returns the same variables without creating a client, and throws when one of them is missing or invalid.

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

[badge-npm]: https://img.shields.io/npm/v/google-oauth2-env-vars.svg?style=flat-square
[badge-downloads]: https://img.shields.io/npm/dt/google-oauth2-env-vars.svg?style=flat-square
[badge-build]: https://img.shields.io/github/actions/workflow/status/cedricdelpoux/google-docs-sync/ci.yml?branch=main&style=flat-square
[badge-coverage]: https://img.shields.io/codecov/c/github/cedricdelpoux/google-docs-sync/main.svg?flag=google-oauth2-env-vars&style=flat-square
[badge-prs]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[badge-sponsor]: https://img.shields.io/badge/sponsor-%E2%99%A5-ea4aaa.svg?style=flat-square
[npm]: https://www.npmjs.com/package/google-oauth2-env-vars
[actions]: https://github.com/cedricdelpoux/google-docs-sync/actions/workflows/ci.yml
[codecov]: https://app.codecov.io/gh/cedricdelpoux/google-docs-sync/tree/main/packages/google-oauth2-env-vars
[contributing]: https://github.com/cedricdelpoux/google-docs-sync/blob/main/CONTRIBUTING.md
[licence]: https://github.com/cedricdelpoux/google-docs-sync/blob/main/LICENCE.md
[sponsor]: #support-this-project
