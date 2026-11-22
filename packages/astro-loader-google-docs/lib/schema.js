import {z} from "astro/zod"

const commentAuthor = z.object({displayName: z.string()})

const comment = z.object({
  id: z.string(),
  content: z.string(),
  author: commentAuthor,
  createdTime: z.coerce.date(),
  modifiedTime: z.coerce.date(),
  resolved: z.boolean(),
  quote: z.string().optional(),
  replies: z.array(
    z.object({
      id: z.string(),
      content: z.string().optional(),
      author: commentAuthor,
      createdTime: z.coerce.date(),
      action: z.enum(["resolve", "reopen"]).optional(),
    })
  ),
})

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
      comments: z.array(comment).optional(),
      page: z.boolean().optional(),
      exclude: z.boolean().optional(),
      index: z.boolean().optional(),
    })
    .passthrough()
