import React, { useEffect, useState } from "react"
import { Link, withPrefix } from "gatsby"
import { i18n, getFilePath, getLanguageFromUrl } from "../common"
import { useSkoHubContext } from "../context/Context"
import { getUserLang } from "../hooks/getUserLanguage"
import { getConfigAndConceptSchemes } from "../hooks/configAndConceptSchemes.js"

import Layout from "../components/layout"
import SEO from "../components/seo"

// ─── Configuración de categorías ──────────────────────────────────────
// Para añadir nuevas categorías, simplemente añade una entrada aquí
const CATEGORIES = {
  GE: {
    label: { es: "Geología", en: "Geology" },
    description: {
      es: "Vocabularios controlados de atributos geológicos y geomorfológicos del modelo de datos estandarizados de cartografía geológica.",
      en: "Controlled vocabularies of geological and geomorphological properties of the geological mapping standardized data model.",
    },
    image: "categoria-geologia.png",
  },
  TE: {
    label: { es: "Técnicos", en: "Technical" },
    description: {
      es: "Vocabularios controlados de propiedades técnicas y administrativas del modelo de datos estandarizados de cartografía geológica.",
      en: "Controlled vocabularies of technical and administrative propierties of the geological mapping standardized data model. ",
    },
    image: "categoria-tecnicos.png",
  },
}

// ─── Iconos PNG por vocabulario ───────────────────────────────────────
const VOCAB_ICONS = {
  // --- GE: Geología ---
  "afloramiento-caracter": "/img/vocab-afloramiento-caracter.png",
  "alteracion-grado": "/img/vocab-alteracion-grado.png",
  "alteracion-producto": "/img/vocab-alteracion-producto.png",
  "alteracion-tipo": "/img/vocab-alteracion-tipo.png",
  "coleccion-tipo": "/img/vocab-coleccion-tipo.png",
  "contacto-tipo": "/img/vocab-contacto-tipo.png",
  "edad-geologica": "/img/vocab-edad-geologica.png",
  "estratificacion-grosor": "/img/vocab-estratificacion-grosor.png",
  "estratificacion-patron": "/img/vocab-estratificacion-patron.png",
  "estratificacion-patron-estilo": "/img/vocab-estratificacion-patron-estilo.png",
  "evento-proceso": "/img/vocab-evento-proceso.png",
  "geomorfologia-actividad": "/img/vocab-geomorfologia-actividad.png",
  "geomorfologia-tipo-antropogenico": "/img/vocab-geomorfologia-tipo-antropogenico.png",
  "geomorfologia-tipo-natural": "/img/vocab-geomorfologia-tipo-natural.png",
  "geomorfologia-tipo-natural-amp": "/img/vocab-geomorfologia-tipo-natural-amp.png",
  "mappedfobservationmethod": "/img/vocab-mappedfobservationmethod.png",
  "marco-de-cartografiado": "/img/vocab-marco-de-cartografiado.png",
  "material-igme": "/img/vocab-material-igme.png",
  "medida-estructural": "/img/vocab-medida-estructural.png",
  "metamorfismo-facies": "/img/vocab-metamorfismo-facies.png",
  "metamorfismo-grado": "/img/vocab-metamorfismo-grado.png",
  "metodo-determinacion": "/img/vocab-metodo-determinacion.png",
  "pliegue-tipo": "/img/vocab-pliegue-tipo.png",
  "rango-estratigrafico": "/img/vocab-rango-estratigrafico.png",
  "falla-tipo": "/img/vocab-falla-tipo.png",
  "superficies-de-estratificacion": "/img/vocab-superficies-de-estratificacion.png",
  "evento-ambiente": "/img/vocab-evento-ambiente.png",
  "unidad-geologica-tipo": "/img/vocab-unidad-geologica-tipo.png",
  "unidad-geologica-composicion": "/img/vocab-unidad-geologica-composicion.png",
  "undidad-geologica-rol-parte": "/img/vocab-unidad-geologica-rol-parte.png",
  "unidad-geologica-morfologia": "/img/vocab-unidad-geologica-morfologia.png",
  "alteracion-distribucion": "/img/vocab-alteracion-distribucion.png",
  "polaridad": "/img/vocab-polaridad.png",


  // --- TE: Técnicos ---
  "contribucion-rol": "/img/vocab-contribucion-rol.png",
  "convencion-codigo": "/img/vocab-convencion-codigo.png",
  "file-type": "/img/vocab-file-type.png",
  "responsible-party-role": "/img/vocab-responsible-party-role.png",
  "void-reason": "/img/vocab-void-reason.png",
  "estado": "/img/vocab-estado.png"
}

// Icono por defecto para vocabularios sin icono específico
const DEFAULT_ICON = (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="6" width="28" height="28" rx="4"/><line x1="12" y1="14" x2="28" y2="14"/><line x1="12" y1="20" x2="28" y2="20"/><line x1="12" y1="26" x2="22" y2="26"/></svg>
)

// Componente que renderiza un icono SVG o una imagen PNG
// Para cambiar a PNG: pon la ruta en VOCAB_ICONS, ej: "litologia": "/img/vocab-litologia.png"
const VocabIcon = ({ vocabId, colors }) => {
  // Extraer el slug del ID (última parte de la URI)
  const slug = vocabId.split("/").pop()
  const icon = VOCAB_ICONS[slug]

  if (typeof icon === "string") {
    // Es una ruta a imagen PNG
    return (
      <img
        src={withPrefix(icon)}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    )
  }

  // Es un SVG inline
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.skoHubMiddleColor,
      }}
    >
      <div style={{ width: "50px", height: "50px" }}>
        {icon || DEFAULT_ICON}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────
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
    return title || conceptScheme.id
  }

  const getDescription = (conceptScheme) => {
    return (
      i18n(language)(
        conceptScheme?.description || conceptScheme?.dc_description
      ) || ""
    )
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
              flexDirection: "column",
              gap: "14px",
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
                    display: "flex",
                    alignItems: "center",
                    background: "none",
                    border: "2px solid #ddd",
                    borderRadius: "10px",
                    padding: "0",
                    cursor: "pointer",
                    overflow: "hidden",
                    width: "100%",
                    height: "130px",
                    textAlign: "left",
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
                      width: "160px",
                      minWidth: "160px",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div style={{ padding: "12px 20px", flex: 1 }}>
                    <h3
                      style={{
                        margin: "0 0 6px 0",
                        fontSize: "20px",
                        color: config.colors.skoHubDarkColor,
                      }}
                    >
                      {getCategoryLabel(code)}
                    </h3>
                    <p
                      style={{
                        margin: "0 0 6px 0",
                        color: "#555",
                        fontSize: "14px",
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
          <div style={{ width: "100%" }}>
            {/* Botón volver */}
            <div style={{ marginBottom: "10px", textAlign: "right" }}>
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
                  e.currentTarget.style.background =
                    config.colors.skoHubMiddleColor
                  e.currentTarget.style.color = config.colors.skoHubWhite
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background =
                    config.colors.skoHubLightGrey
                  e.currentTarget.style.color = config.colors.skoHubDarkColor
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                {language === "en"
                  ? "Back to categories"
                  : "Volver a categorías"}
              </button>
            </div>

            {/* Título + descripción + logo */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "15px",
              gap: "20px",
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: "0 0 6px 0" }}>
                  {getCategoryLabel(selectedCategory)}
                </h2>
                <p style={{
                  margin: 0,
                  color: "#555",
                  fontSize: "14px",
                  lineHeight: "1.4",
                }}>
                  {getCategoryDescription(selectedCategory)}
                </p>
              </div>
              <img
                src={withPrefix("/img/logo-gi-carto.png")}
                alt="Logo"
                style={{
                  height: "110px",
                  width: "auto",
                }}
              />
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
        {!selectedCategory &&
          availableCategories.length === 0 &&
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

        {/* Lista de vocabularios como tarjetas */}
        {(selectedCategory || availableCategories.length === 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
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
              .map((conceptScheme) => {
                const schemeSlug = conceptScheme.id.split("/").pop()
                return (
                <div
                  key={conceptScheme.id}
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    overflow: "hidden",
                    transition: "box-shadow 0.2s, border-color 0.2s",
                    minHeight: "100px",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor =
                      config.colors.skoHubAction
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.1)"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  {/* Icono */}
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
                    style={{
                      width: "100px",
                      minWidth: "100px",
                      background: config.colors.skoHubLightGrey,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                    }}
                  >
                    <VocabIcon
                      vocabId={conceptScheme.id}
                      colors={config.colors}
                    />
                  </Link>
                  {/* Contenido */}
                  <div
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
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
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          lineHeight: "1.3",
                          marginBottom: "6px",
                          color: config.colors.skoHubDarkColor,
                        }}
                      >
                        {getTitle(conceptScheme)}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#666",
                          lineHeight: "1.4",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {getDescription(conceptScheme)}
                      </div>
                    </Link>
                  </div>
                  {/* Botones de descarga */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    padding: "10px 12px",
                    justifyContent: "center",
                    // borderLeft: "1px solid #e0e0e0",
                  }}>
                    {[
                      { label: "TTL", ext: "ttl" },
                      { label: "RDF/XML", ext: "rdf" },
                      { label: "JSON-LD", ext: "jsonld" },
                    ].map(({ label, ext }) => {
                      const slug = conceptScheme.id.split("/").pop()
                      return (
                        <a
                          key={ext}
                          href={`${customDomain ? customDomain : "/"}downloads/${slug}.${ext}`}
                          download
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: "11px",
                            padding: "3px 10px",
                            borderRadius: "3px",
                            border: `1px solid ${config.colors.skoHubMiddleGrey}`,
                            color: config.colors.skoHubDarkColor,
                            textDecoration: "none",
                            background: config.colors.skoHubLightGrey,
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </a>
                      )
                    })}
                  </div>
                </div>
                )
              })}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default IndexPage
