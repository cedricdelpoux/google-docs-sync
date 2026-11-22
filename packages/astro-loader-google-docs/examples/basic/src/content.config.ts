import {defineCollection} from "astro:content"
import {
  createGoogleDocsSchema,
  googleDocsLoader,
} from "astro-loader-google-docs"

const docs = defineCollection({
  loader: googleDocsLoader({
    // https://drive.google.com/drive/folders/1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag
    folder: "1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag",
  }),
  schema: ({image}) => createGoogleDocsSchema({image}),
})

export const collections = {docs}
