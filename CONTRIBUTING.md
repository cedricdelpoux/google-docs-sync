# Contributing

Pull requests are welcome. For bugs and feature requests, please [create an issue](https://github.com/cedricdelpoux/google-docs-sync/issues).

The repository uses npm workspaces and Node.js 22.12 or later:

```shell
npm install
npm test       # or npm test -w <package>
npm run lint
npm run changeset # describe your change, it drives the release
```

The examples are sites that use the packages of the repository: run `npm install` in one of them, then `npm run dev` or `npm run build`. The Google Docs fixtures of the `google-docs-to-markdown` tests are saved with `npm run fixture -w google-docs-sync -- <document id>`.
