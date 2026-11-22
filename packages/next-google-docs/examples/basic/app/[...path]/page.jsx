import Link from "next/link"
import {notFound} from "next/navigation"
import {getDocument, getDocuments} from "next-google-docs/documents"
import {MDXRemote} from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"

export const dynamicParams = false

export const generateStaticParams = async () =>
  (await getDocuments())
    .filter(({slug}) => slug !== "/")
    .map(({slug}) => ({path: slug.split("/").filter(Boolean)}))

export default async function Page({params}) {
  const document = await getDocument((await params).path)

  if (!document) {
    notFound()
  }

  return (
    <>
      <Link href="/">Back to the documents</Link>
      <h1>{document.metadata.name}</h1>
      <MDXRemote
        source={document.markdown}
        options={{mdxOptions: {format: "md", remarkPlugins: [remarkGfm]}}}
        components={{
          img: (props) => <img {...props} style={{maxWidth: "100%"}} />,
        }}
      />
    </>
  )
}
