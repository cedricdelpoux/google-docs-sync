import {existsSync as exists} from "node:fs"
import {resolve} from "node:path"

import _merge from "lodash/merge.js"

import {DEFAULT_OPTIONS, DEFAULT_TEMPLATE} from "./constants.js"
import {getTransformer, TRANSFORMERS} from "./get-transformer.js"

const getComponentPath = (template) =>
  template.includes(".")
    ? resolve(`src/templates/${template}`)
    : resolve(`src/templates/${template}.js`)

export const createPages = async (
  {graphql, actions: {createPage}, store, reporter},
  pluginOptions
) => {
  if (!pluginOptions.createPages) return

  const options = _merge({}, DEFAULT_OPTIONS, pluginOptions)
  const transformer = getTransformer({store})

  if (!transformer) return

  const {allField} = TRANSFORMERS[transformer]
  const isMdx = transformer === "mdx"
  const fields = options.pageContext || []

  const filePathField = isMdx
    ? "internal { contentFilePath }"
    : "fileAbsolutePath"

  const result = await graphql(`
    {
      ${allField} {
        nodes {
          ${filePathField}
          frontmatter {
            slug
            template
            page
            ${fields.join(" ")}
          }
        }
      }
    }
  `)

  if (result.errors) {
    reporter.panic(result.errors)
  }

  try {
    const outputDir = resolve(options.outputDir)
    const defaultComponent = exists(getComponentPath(DEFAULT_TEMPLATE))
      ? getComponentPath(DEFAULT_TEMPLATE)
      : null
    const nodes = (result.data[allField] && result.data[allField].nodes) || []

    nodes.forEach((node) => {
      const contentFilePath = isMdx
        ? node.internal.contentFilePath
        : node.fileAbsolutePath

      // The other markdown of the site shares these types
      if (!contentFilePath || !resolve(contentFilePath).startsWith(outputDir)) {
        return
      }

      const {slug, template, page, ...context} = node.frontmatter

      if (page === false) return

      let component = defaultComponent

      if (template && exists(getComponentPath(template))) {
        component = getComponentPath(template)
      }

      if (!component) {
        const defaultTemplateError = `Default template "${DEFAULT_TEMPLATE}" not found.`

        if (template) {
          throw new Error(
            `template "${template}" not found. ${defaultTemplateError}`
          )
        }

        throw new Error(
          `missing template for "${slug}". ${defaultTemplateError}`
        )
      }

      createPage({
        path: slug,
        // `gatsby-plugin-mdx` only renders the body from this file query
        component: isMdx
          ? `${component}?__contentFilePath=${contentFilePath}`
          : component,
        context: {
          // Gatsby's own `path` variable follows `trailingSlash`
          slug,
          ...context,
        },
      })
    })
  } catch (e) {
    reporter.panic(`source-google-docs: ` + e.message)
  }
}
