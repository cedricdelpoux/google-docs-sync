import {resolve} from "node:path"

import {withGoogleDocs} from "next-google-docs"

const nextConfig = {
  // The adapter is linked from the monorepo, outside of this folder
  turbopack: {root: resolve(import.meta.dirname, "../../../..")},
}

export default withGoogleDocs(nextConfig, {
  // https://drive.google.com/drive/folders/1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag
  folder: "1YJWX_FRoVusp-51ztedm6HSZqpbJA3ag",
})
