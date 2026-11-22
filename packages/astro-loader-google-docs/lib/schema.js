import {z} from "astro/zod"

/**
 * The data of a document: the metadata of the Drive file, completed by what
 * the Drive tree and the `description` of the document define. Custom
 * metadata are kept as they are.
 *
 * Pass the `image` helper of the content config schema function to make the
 * cover an optimised image: `schema: ({image}) => createGoogleDocsSchema({image})`.
 *
 * @param {{image?: () => import("astro/zod").ZodType}} [options]
 */
export const createGoogleDocsSchema = ({image} = {}) =>
  z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      path: z.string(),
      date: z.coerce.date(),
      createdTime: z.coerce.date(),
      modifiedTime: z.coerce.date(),
      description: z
        .union([z.string(), z.record(z.string(), z.any())])
        .optional(),
      cover: z
        .object({
          image: image ? image() : z.string(),
          title: z.string().optional(),
          alt: z.string().optional(),
        })
        .optional(),
      breadcrumb: z.array(z.object({name: z.string(), slug: z.string()})),
      related: z.array(z.string()).optional(),
      page: z.boolean().optional(),
      exclude: z.boolean().optional(),
      index: z.boolean().optional(),
    })
    .passthrough()
