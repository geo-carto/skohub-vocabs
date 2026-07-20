import { useStaticQuery, graphql } from "gatsby"

/**
 * @returns {{
 *   config: {
 *     colors: {
 *       skoHubWhite: string,
 *       skoHubDarkColor: string,
 *       skoHubMiddleColor: string,
 *       skoHubLightColor: string,
 *       skoHubThinColor: string,
 *       skoHubBlackColor: string,
 *       skoHubAction: string,
 *       skoHubNotice: string,
 *       skoHubDarkGrey: string,
 *       skoHubMiddleGrey: string,
 *       skoHubLightGrey: string
 *     },
 *     logo: string,
 *     title: string,
 *     fonts: {
 *       bold: {
 *         font_family: string,
 *         font_style: string,
 *         font_weight: string,
 *         name: string
 *       },
 *       regular: {
 *         font_family: string,
 *         font_style: string,
 *         font_weight: string,
 *         name: string
 *       }
 *     },
 *     searchableAttributes: string[],
 *     customDomain: string,
 *     failOnValidation: boolean
 *   },
 *   conceptSchemes: Object<string, { languages: string[] }>
 * }} An object containing `config` and `conceptSchemes`
 *
 */
export const getConfigAndConceptSchemes = () => {
  const { site, allConceptScheme } = useStaticQuery(graphql`
    query Colors {
      site {
        siteMetadata {
          colors {
            skoHubWhite
            skoHubDarkColor
            skoHubMiddleColor
            skoHubLightColor
            skoHubThinColor
            skoHubBlackColor
            skoHubAction
            skoHubNotice
            skoHubDarkGrey
            skoHubMiddleGrey
            skoHubLightGrey
          }
          logo
          title
          fonts {
            bold {
              font_family
              font_style
              font_weight
              name
            }
            regular {
              font_family
              font_style
              font_weight
              name
            }
          }
          footer {
            links {
              title
              url
              target
              rel
            }
          }
          searchableAttributes
          customDomain
          failOnValidation
          home {
            subtitle
            subtitle_en
            description
            description_en
            categories_intro {
              eyebrow
              eyebrow_en
              title
              title_en
              subtitle
              subtitle_en
            }
            updates_intro {
              eyebrow
              eyebrow_en
              title
              title_en
              subtitle
              subtitle_en
            }
            suggestions_intro {
              eyebrow
              eyebrow_en
              title
              title_en
              subtitle
              subtitle_en
              contact_title
              contact_title_en
            }
            resources_intro {
              eyebrow
              eyebrow_en
              title
              title_en
              subtitle
              subtitle_en
            }
            listing_explore {
              title
              title_en
              description
              description_en
              graph_title
              graph_title_en
              graph_description
              graph_description_en
              graph_button
              graph_button_en
            }
            categories {
              id
              label
              label_en
              description
              description_en
              long_description
              long_description_en
              image
            }
            novedades {
              titulo
              titulo_en
              fecha
              descripcion
              descripcion_en
              imagen
              nuevo
            }
            enlaces {
              titulo
              url
            }
          }
        }
      }
      allConceptScheme {
        edges {
          node {
            id
            fields {
              languages
            }
          }
        }
      }
    }
  `)
  const conceptSchemes = allConceptScheme.edges
    .map(({ node }) => ({
      [node.id]: { languages: node.fields.languages },
    }))
    .reduce((prev, curr) => ({ ...prev, ...curr }), {})
  return { config: site.siteMetadata, conceptSchemes }
}
