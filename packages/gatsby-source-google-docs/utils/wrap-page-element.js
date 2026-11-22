import {createElement} from "react"

import {GoogleDocsContext} from "./google-docs-context.js"

export const wrapPageElement = ({element, props}) =>
  createElement(
    GoogleDocsContext.Provider,
    {value: {...props.pageContext}},
    element
  )
