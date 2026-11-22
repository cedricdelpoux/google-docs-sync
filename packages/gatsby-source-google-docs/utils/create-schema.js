import {getTransformer, TRANSFORMERS} from "./get-transformer.js"

/**
 * Declare the frontmatter, so that Gatsby neither infers it from the first
 * document read nor leaves `cover.image` a string instead of a `File`. The
 * type is shared with the other markdown of the site, hence nullable fields.
 */
export const createSchema = ({actions, store, reporter}) => {
  const {createTypes} = actions
  const transformer = getTransformer({store})

  if (!transformer) {
    reporter.warn(
      `source-google-docs: neither "gatsby-transformer-remark" nor "gatsby-plugin-mdx" is installed, the documents will not be transformed`
    )
    return
  }

  const {frontmatterType} = TRANSFORMERS[transformer]

  createTypes(`
    type GoogleDocsBreadcrumbItem {
      name: String!
      slug: String!
    }

    type GoogleDocsCover {
      title: String
      alt: String
      image: File @fileByRelativePath
    }

    type GoogleDocsCommentAuthor {
      displayName: String
    }

    type GoogleDocsCommentReply {
      id: String
      content: String
      author: GoogleDocsCommentAuthor
      createdTime: Date @dateformat
      action: String
    }

    type GoogleDocsComment {
      id: String
      content: String
      author: GoogleDocsCommentAuthor
      createdTime: Date @dateformat
      modifiedTime: Date @dateformat
      resolved: Boolean
      quote: String
      replies: [GoogleDocsCommentReply!]
    }

    type ${frontmatterType} {
      name: String
      slug: String
      path: String
      template: String
      date: Date @dateformat
      page: Boolean
      exclude: Boolean
      index: Boolean
      breadcrumb: [GoogleDocsBreadcrumbItem!]
      cover: GoogleDocsCover
      related: [String!]
      comments: [GoogleDocsComment!]
    }
  `)
}
