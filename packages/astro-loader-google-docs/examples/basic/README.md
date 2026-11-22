# astro-loader-google-docs basic example

A minimal Astro site that lists the documents of a Google Drive folder and renders each of them with its images. The folder is the [demo one](https://drive.google.com/drive/folders/1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag).

The dev server and the preview run on http://localhost:8105 (`strictPort`: they fail instead of picking another port).

## Run it

Put the Google variables in a `.env` file next to `package.json` (see [token generation](../../../google-docs-sync#token-generation)), then:

```shell
npm install
npm run dev
```

`npm run build` writes the site to `dist/`, and `npm run preview -- --port 8105` serves it.

The example installs the loader as a copy (`install-links=true` in `.npmrc`) rather than as a symbolic link: Astro loads the content config through Vite, which would otherwise compile the loader and its CommonJS dependencies instead of loading them as a published package.

## Files

- `src/content.config.ts`: the collection and its loader
- `src/pages/index.astro`: the list of documents
- `src/pages/[...path].astro`: one page per document
