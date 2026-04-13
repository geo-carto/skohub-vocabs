
import React, { useEffect, useState } from "react"
import { Link, withPrefix } from "gatsby"
import { i18n, getFilePath, getLanguageFromUrl } from "../common"
import { useSkoHubContext } from "../context/Context"
import { getUserLang } from "../hooks/getUserLanguage"
import { getConfigAndConceptSchemes } from "../hooks/configAndConceptSchemes.js"

import Layout from "../components/layout"
import SEO from "../components/seo"

// Configuración de categorías
// Para añadir nuevas categorías, simplemente añade una entrada aquí
const CATEGORIES = {
  GE: {
    label: { es: "Geología", en: "Geology" },
    description: {
      es: "Vocabularios controlados de geología, geomorfología, estratigrafía, litología y más.",
      en: "Controlled vocabularies for geology, geomorphology, stratigraphy, lithology and more.",
    },
    image: "categoria-geologia.png",
  },
  TE: {
    label: { es: "Técnicos", en: "Technical" },
    description: {
      es: "Vocabularios técnicos y administrativos: estados, roles, tipos de archivo y más.",
      en: "Technical and administrative vocabularies: status, roles, file types and more.",
    },
    image: "categoria-tecnicos.png",
  },
}

const IndexPage = ({ location }) => {
  const [conceptSchemes, setConceptSchemes] = useState([])
  const [language, setLanguage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const { data, updateState } = useSkoHubContext()
  const { config } = getConfigAndConceptSchemes()
  const customDomain = config.customDomain

  useEffect(() => {
    async function fetchConceptData() {
      const res = await fetch("index.json")
      const csData = await res.json()
      setConceptSchemes(csData)
      const languages = Array.from(
        new Set([...csData.flatMap((cs) => cs.languages)])
      )
      updateState({ ...data, languages: languages, indexPage: true })
    }
    fetchConceptData()
  }, [])

  // set language stuff
  useEffect(() => {
    const languageFromUrl = getLanguageFromUrl(location)
    if (languageFromUrl && !data.selectedLanguage) {
      const userLang = getUserLang({
        availableLanguages: data.languages,
        selectedLanguage: languageFromUrl,
      })

      setLanguage(userLang)
      updateState({
        ...data,
        selectedLanguage: userLang,
        indexPage: true,
        currentScheme: {},
      })
    } else {
      const userLang = getUserLang({
        availableLanguages: data.languages,
        selectedLanguage: data?.selectedLanguage || null,
      })
      setLanguage(userLang)
      updateState({
        ...data,
        selectedLanguage: userLang,
        indexPage: true,
        currentScheme: {},
      })
    }
  }, [data?.languages, data?.selectedLanguage])

  const getTitle = (conceptScheme) => {
    const title =
      i18n(language)(
        conceptScheme?.title ||
          conceptScheme?.prefLabel ||
          conceptScheme?.dc_title
      ) || conceptScheme.id
    if (title) {
      return title
    }
    return conceptScheme.id
  }

  const getCategoryLabel = (code) => {
    const cat = CATEGORIES[code]
    if (!cat) return code
    return cat.label[language] || cat.label["es"] || code
  }

  const getCategoryDescription = (code) => {
    const cat = CATEGORIES[code]
    if (!cat || !cat.description) return ""
    return cat.description[language] || cat.description["es"] || ""
  }

  // Obtener categorías presentes en los datos
  const availableCategories = Object.keys(CATEGORIES).filter((code) =>
    conceptSchemes.some((cs) => cs.theme === code)
  )

  // Filtrar vocabularios por categoría seleccionada
  const filteredSchemes = selectedCategory
    ? conceptSchemes.filter((cs) => cs.theme === selectedCategory)
    : conceptSchemes

  return (
    <Layout language={language}>
      <SEO title="Concept Schemes" keywords={["conceptSchemes"]} />

      <div className="centerPage block">
        {/* Vista de categorías */}
        {!selectedCategory && availableCategories.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "24px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: "40px",
              marginBottom: "30px",
            }}
          >
            {availableCategories.map((code) => {
              const cat = CATEGORIES[code]
              const count = conceptSchemes.filter(
                (cs) => cs.theme === code
              ).length
              return (
                <button
                  key={code}
                  onClick={() => setSelectedCategory(code)}
                  style={{
                    background: "none",
                    border: "2px solid #ddd",
                    borderRadius: "12px",
                    padding: "0",
                    cursor: "pointer",
                    overflow: "hidden",
                    width: "300px",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor =
                      config.colors.skoHubAction
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(0,0,0,0.15)"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#ddd"
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.08)"
                  }}
                >
                  <img
                    src={withPrefix(`/img/${cat.image}`)}
                    alt={getCategoryLabel(code)}
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div style={{ padding: "12px 16px", textAlign: "left" }}>
                    <h3 style={{ margin: "0 0 6px 0" }}>
                      {getCategoryLabel(code)}
                    </h3>
                    <p
                      style={{
                        margin: "0 0 6px 0",
                        color: "#555",
                        fontSize: "13px",
                        lineHeight: "1.4",
                      }}
                    >
                      {getCategoryDescription(code)}
                    </p>
                    <p
                      style={{ margin: 0, color: "#888", fontSize: "13px" }}
                    >
                      {count}{" "}
                      {language === "en" ? "vocabularies" : "vocabularios"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Título de categoría + Buscador + Botón volver */}
        {selectedCategory && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "15px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <h2 style={{ margin: 0 }}>
                {getCategoryLabel(selectedCategory)}
              </h2>
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setSearchTerm("")
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: config.colors.skoHubLightGrey,
                  border: `1px solid ${config.colors.skoHubMiddleGrey}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: config.colors.skoHubDarkColor,
                  padding: "8px 16px",
                  fontWeight: "600",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = config.colors.skoHubMiddleColor
                  e.currentTarget.style.color = config.colors.skoHubWhite
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = config.colors.skoHubLightGrey
                  e.currentTarget.style.color = config.colors.skoHubDarkColor
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                {language === "en" ? "Back to categories" : "Volver a categorías"}
              </button>
            </div>

            {/* Buscador dentro de la categoría */}
            {filteredSchemes.length > 4 && (
              <div style={{ marginBottom: "20px" }}>
                <input
                  type="text"
                  placeholder={
                    language === "en"
                      ? "Search vocabularies..."
                      : "Buscar vocabularios..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Buscador sin categorías */}
        {!selectedCategory && availableCategories.length === 0 &&
          filteredSchemes.length > 4 && (
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder={
                  language === "en"
                    ? "Search vocabularies..."
                    : "Buscar vocabularios..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "16px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>
          )}

        {/* Lista de vocabularios */}
        {(selectedCategory || availableCategories.length === 0) && (
          <ul>
            {filteredSchemes
              .filter((conceptScheme) => {
                const title = getTitle(conceptScheme)
                return title.toLowerCase().includes(searchTerm.toLowerCase())
              })
              .sort((a, b) => {
                const titleA =
                  i18n(language)(a.prefLabel || a.title || a.dc_title) || a.id
                const titleB =
                  i18n(language)(b.prefLabel || b.title || b.dc_title) || b.id
                return titleA.localeCompare(titleB)
              })
              .map((conceptScheme) => (
                <li key={conceptScheme.id}>
                  <Link
                    onClick={() =>
                      updateState({
                        ...data,
                        conceptSchemeLanguages: [...conceptScheme.languages],
                        currentScheme: conceptScheme,
                        selectedLanguage: conceptScheme.languages.includes(
                          language
                        )
                          ? language
                          : conceptScheme.languages[0],
                      })
                    }
                    to={getFilePath(conceptScheme.id, `html`, customDomain)}
                  >
                    {getTitle(conceptScheme)}
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}

export default IndexPage
