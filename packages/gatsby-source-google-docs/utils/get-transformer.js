const MDX_PLUGIN = "gatsby-plugin-mdx"
const REMARK_PLUGIN = "gatsby-transformer-remark"

/** Which of the two transformers picks up the written files, if any. */
const getTransformer = ({store}) => {
  const plugins = store.getState().flattenedPlugins || []
  const names = plugins.map((plugin) => plugin.name)

  if (names.includes(MDX_PLUGIN)) return "mdx"
  if (names.includes(REMARK_PLUGIN)) return "remark"

  return null
}

const TRANSFORMERS = {
  mdx: {
    allField: "allMdx",
    frontmatterType: "MdxFrontmatter",
  },
  remark: {
    allField: "allMarkdownRemark",
    frontmatterType: "MarkdownRemarkFrontmatter",
  },
}

export {getTransformer, TRANSFORMERS}
