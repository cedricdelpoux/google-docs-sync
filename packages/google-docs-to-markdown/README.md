# google-docs-to-markdown

[![Npm][badge-npm]][npm]
[![Build Status][badge-build]][actions]
[![Coverage][badge-coverage]][codecov]
[![Downloads][badge-downloads]][npm]
[![PRs welcome][badge-prs]][contributing]
[![MIT license][badge-licence]][licence]
[![Sponsor][badge-sponsor]][sponsor]

`google-docs-to-markdown` converts [Google Docs](https://docs.google.com/) to Markdown or MDX.

It reads the document returned by the [Google Docs API](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents) and gives back a Markdown string with a frontmatter. It does not call Google: [google-docs-sync](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/google-docs-sync) fetches the documents and writes the files, and it powers [gatsby-source-google-docs](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/gatsby-source-google-docs), [astro-loader-google-docs](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/astro-loader-google-docs) and [next-google-docs](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/next-google-docs). The converter works with any static site generator or script.

Google Drive can export a document as Markdown itself, but that export turns code blocks into one-cell tables without line breaks, escapes MDX components, embeds every image as base64 and drops the colors, underlines and inline code. This library keeps all of them.

## Features

- Headings, bold, italic, underline, strikethrough, superscript, subscript, colors and font sizes
- Bullet and numbered lists, nested ones included
- Tables, images, footnotes and horizontal rules
- Code blocks with a language, inline code and quotes
- A cover, taken from the image of the first page header
- Links between documents rewritten to your own paths
- MDX output, to use `<ReactComponents />` in your documents

## Installation

```shell
npm install google-docs-to-markdown
```

Node 22.12 or later is required. The package is an ES module, which `require()` loads too, and it comes with its TypeScript types.

## Usage

### From a document you fetched yourself

```js
import {toMarkdown} from "google-docs-to-markdown"

const markdown = toMarkdown(document, {
  frontmatter: {title: "Home"},
})
```

`document` is the response of [`documents.get`](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/get).

### From a document id

This package does not fetch anything. [`google-docs-sync`](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/google-docs-sync) fetches the document and authenticates with Google ([token generation](https://github.com/cedricdelpoux/google-docs-sync/tree/main/packages/google-docs-sync#token-generation)):

```js
import {fetchDocument} from "google-docs-sync"
import {toMarkdown} from "google-docs-to-markdown"

const document = await fetchDocument(
  "1ebPyAlYlGDpGhf37WbbjA6APqpCLDxKorMBv_mFojV0"
)
const markdown = toMarkdown(document, {mdx: true})
```

To sync a whole Google Drive folder to Markdown files, use `syncGoogleDocs` from the same package.

### Links between documents

A link to another Google Doc can point to your own page instead:

```js
const markdown = toMarkdown(document, {
  links: {
    "1CgKSrtU6e_a3fSzJNQvwbrIdD7tayUcfVzPZAScwEfo": "/installation",
  },
})
```

The ids of the linked documents are listed in the `related` field of the frontmatter.

### Cover, images and related documents

`GoogleDocument` takes the same options as `toMarkdown` and gives access to what the conversion found:

```js
import {GoogleDocument} from "google-docs-to-markdown"

const googleDocument = new GoogleDocument(document, {links, mdx: true})

googleDocument.cover // {image, title, alt} or null
googleDocument.images // [{id, url, title, alt}], the cover included, in the order of the markdown
googleDocument.related // ["1CgKSrtU6e_a3fSzJNQvwbrIdD7tayUcfVzPZAScwEfo"]
googleDocument.toMarkdown()
```

Google gives the images new URLs every time a document is fetched, and they expire within hours. The `id` of an image does not change, so it can name a downloaded file.

## Options

| Option             | Default | Description                                                                                                          |
| ------------------ | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `frontmatter`      | `{}`    | Fields written in the frontmatter, next to `cover` and `related`                                                     |
| `links`            | `{}`    | Paths to rewrite the links to other Google Docs with, by document id                                                 |
| `mdx`              | `false` | Write MDX: colors and font sizes become JSX styles, and the text is escaped for MDX                                  |
| `escapeMdxSyntax`  | `true`  | Escape the `<` and `{` of the text, on which MDX fails. Set it to `false` to write live components as text in a doc. |
| `demoteHeadings`   | `false` | Turn h1 into h2, h2 into h3, ...                                                                                     |
| `keepDefaultStyle` | `false` | Keep the bold, italic, underline, ... of the Google Docs default style                                               |
| `skipCodes`        | `false` | Leave out the code blocks                                                                                            |
| `skipFootnotes`    | `false` | Leave out the footnotes                                                                                              |
| `skipHeadings`     | `false` | Leave out the headings                                                                                               |
| `skipImages`       | `false` | Leave out the images                                                                                                 |
| `skipLists`        | `false` | Leave out the lists                                                                                                  |
| `skipQuotes`       | `false` | Leave out the quotes                                                                                                 |
| `skipTables`       | `false` | Leave out the tables                                                                                                 |

## Writing in Google Docs

- **Inline code**: use the `Consolas` font.
- **Code blocks**: write the code in a table with a single cell, in the `Consolas` font. The [Code Blocks](https://workspace.google.com/marketplace/app/code_blocks/100740430168) add-on does it for you. Add `lang:javascript` on the first line to set the language.
- **Quotes**: write the quote in a table with a single cell, between smart quotes: `“quote”`.
- **Cover**: add an image in the header of the first page, with **Different first page** checked.

## Support

<p align="center">
  <a href="https://github.com/cedricdelpoux"><img src="https://images.weserv.nl/?url=github.com/cedricdelpoux.png&w=128&h=128&fit=cover&mask=circle" width="64" height="64" alt="Cédric Delpoux"></a>
</p>

<p align="center">
  Hi, I'm <a href="https://github.com/cedricdelpoux">Cédric</a>. I build and maintain this project in my free time.<br>
  If it is useful to you, a star or a small sponsorship helps a lot. Thank you!
</p>

<p align="center">
  <a href="https://thanks.dev/u/gh/cedricdelpoux"><img src="https://img.shields.io/badge/thanks.dev-000000?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyMCI%2BPHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIuNiIgZD0iTTkgMkM2IDIgNS41IDMgNS41IDUuNVY4QzUuNSA5LjMgNC41IDEwIDIgMTBDNC41IDEwIDUuNSAxMC43IDUuNSAxMlYxNC41QzUuNSAxNyA2IDE4IDkgMThNMTUgMkMxOCAyIDE4LjUgMyAxOC41IDUuNVY4QzE4LjUgOS4zIDE5LjUgMTAgMjIgMTBDMTkuNSAxMCAxOC41IDEwLjcgMTguNSAxMlYxNC41QzE4LjUgMTcgMTggMTggMTUgMTgiLz48L3N2Zz4%3D" alt="thanks.dev"></a>
  <a href="https://github.com/sponsors/cedricdelpoux"><img src="https://img.shields.io/badge/GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="GitHub Sponsors"></a>
  <a href="https://ko-fi.com/cedricdelpoux"><img src="https://img.shields.io/badge/Ko--fi-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white" alt="Ko-fi"></a>
  <a href="https://paypal.me/cedricdelpoux"><img src="https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal"></a>
</p>

[badge-npm]: https://img.shields.io/npm/v/google-docs-to-markdown.svg?style=flat-square
[badge-downloads]: https://img.shields.io/npm/dt/google-docs-to-markdown.svg?style=flat-square
[badge-build]: https://img.shields.io/github/actions/workflow/status/cedricdelpoux/google-docs-sync/ci.yml?branch=main&style=flat-square
[badge-coverage]: https://img.shields.io/codecov/c/github/cedricdelpoux/google-docs-sync/main.svg?flag=google-docs-to-markdown&style=flat-square
[badge-prs]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[badge-sponsor]: https://img.shields.io/badge/sponsor-%E2%99%A5-ea4aaa.svg?style=flat-square
[npm]: https://www.npmjs.com/package/google-docs-to-markdown
[actions]: https://github.com/cedricdelpoux/google-docs-sync/actions/workflows/ci.yml
[codecov]: https://app.codecov.io/gh/cedricdelpoux/google-docs-sync/tree/main/packages/google-docs-to-markdown
[contributing]: https://github.com/cedricdelpoux/google-docs-sync/blob/main/CONTRIBUTING.md
[licence]: https://github.com/cedricdelpoux/google-docs-sync/blob/main/LICENCE.md
[sponsor]: #support
