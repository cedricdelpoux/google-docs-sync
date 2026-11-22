import Link from "next/link"
import {getDocuments} from "next-google-docs/documents"

export default async function Page() {
  const documents = (await getDocuments()).filter(({slug}) => slug !== "/")

  return (
    <>
      <h1>Documents</h1>
      <ul>
        {documents.map(({id, name, slug}) => (
          <li key={id}>
            <Link href={slug}>{name}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
