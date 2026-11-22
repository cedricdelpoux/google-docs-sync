export const metadata = {title: "next-google-docs"}

export default function Layout({children}) {
  return (
    <html lang="en">
      <body
        style={{maxWidth: 760, margin: "2rem auto", fontFamily: "sans-serif"}}
      >
        {children}
      </body>
    </html>
  )
}
