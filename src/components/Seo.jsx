import React from "react"
import { useStaticQuery, graphql } from "gatsby"

const SEO = ({ description, lang = "es", keywords = [], title }) => {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          description
          author
          customDomain
          logo
        }
      }
    }
  `)

  const {
    description: siteDescription,
    author,
    customDomain,
    logo,
  } = site.siteMetadata
  const metaDescription = description || siteDescription
  const ogImage = `${customDomain}img/${logo}`

  return (
    <>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={customDomain} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={author} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
    </>
  )
}

export default SEO
