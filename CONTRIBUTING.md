# Contributing

Pull requests are welcome. For bugs and feature requests, please [create an issue](https://github.com/cedricdelpoux/google-docs-sync/issues).

The repository uses npm workspaces and Node.js 22.12 or later:

```shell
npm install
npm test       # or npm test -w <package>
npm run lint
npm run changeset # describe your change, it drives the release
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org): `type: subject`, for example `fix:`, `feat:`, `chore:` or `docs:`. The subject starts with a verb in the imperative mood, such as `fix: refresh the token before it expires`.

When a commit touches a single package, the package name goes in the scope, for example `fix(google-docs-to-markdown): keep the table alignment`. A commit that spans several packages or only root files has no scope, for example `ci: run the tests on Node 24`. When a change touches several packages, prefer one scoped commit per package. A release is committed as `chore: bump packages versions`.

The examples are sites that use the packages of the repository: run `npm install` in one of them, then `npm run dev` or `npm run build`. The Google Docs fixtures of the `google-docs-to-markdown` tests are saved with `npm run fixture -w google-docs-sync -- <document id>`.
