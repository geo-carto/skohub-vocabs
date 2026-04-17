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

// ─── Iconos SVG por vocabulario ───────────────────────────────────────
// Para sustituir por imágenes PNG, cambia el valor a una ruta:
//   "cl_lithology": "/img/vocab-lithology.png"
// y en el componente VocabIcon se renderizará un <img> en vez del SVG.
const VOCAB_ICONS = {
  // --- GE: Geología ---
  "edad-geologica": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="6" width="32" height="5" rx="1"/><rect x="4" y="13" width="32" height="4" rx="1"/><rect x="4" y="19" width="32" height="6" rx="1"/><rect x="4" y="27" width="32" height="3" rx="1"/><rect x="4" y="32" width="32" height="4" rx="1"/></svg>
  ),
  "evento-ambiente": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="18" r="10"/><path d="M10 30 Q20 24 30 30"/><path d="M15 18 Q20 12 25 18"/></svg>
  ),
  "rango-estratigrafico": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="6" y1="8" x2="34" y2="8"/><line x1="6" y1="14" x2="34" y2="14"/><line x1="6" y1="20" x2="34" y2="20"/><line x1="6" y1="26" x2="34" y2="26"/><line x1="6" y1="32" x2="34" y2="32"/><line x1="20" y1="5" x2="20" y2="35" strokeDasharray="2 2"/></svg>
  ),
  "coleccion-tipo": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="6" width="24" height="8" rx="2"/><rect x="8" y="17" width="24" height="8" rx="2"/><rect x="8" y="28" width="24" height="8" rx="2"/></svg>
  ),
  "marco-de-cartografiado": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="30" height="30" rx="2"/><line x1="5" y1="15" x2="35" y2="15"/><line x1="5" y1="25" x2="35" y2="25"/><line x1="15" y1="5" x2="15" y2="35"/><line x1="25" y1="5" x2="25" y2="35"/></svg>
  ),
  "unidad-geologica-tipo": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 34 L14 10 L22 26 L30 8 L34 34Z"/><line x1="6" y1="34" x2="34" y2="34"/></svg>
  ),
  "unidad-geologica-rol-parte": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="14" r="8"/><line x1="12" y1="22" x2="8" y2="34"/><line x1="28" y1="22" x2="32" y2="34"/><line x1="20" y1="22" x2="20" y2="34"/></svg>
  ),
  "evento-proceso": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 32 Q14 20 20 22 Q26 24 32 10"/><polygon points="30,6 36,12 30,12"/></svg>
  ),
  "unidad-geologica-morfologia": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="20" cy="20" rx="14" ry="8"/><ellipse cx="20" cy="20" rx="14" ry="8" transform="rotate(60 20 20)"/><ellipse cx="20" cy="20" rx="14" ry="8" transform="rotate(120 20 20)"/></svg>
  ),
  "unidad-geologica-composicion": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="14" cy="14" r="8"/><circle cx="26" cy="14" r="8"/><circle cx="20" cy="26" r="8"/></svg>
  ),
  "afloramiento-caracter": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 34 L12 20 L18 28 L26 14 L36 34Z"/><circle cx="28" cy="10" r="4"/></svg>
  ),
  "estratificacion-patron": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10 Q12 6 20 10 Q28 14 36 10"/><path d="M4 18 Q12 14 20 18 Q28 22 36 18"/><path d="M4 26 Q12 22 20 26 Q28 30 36 26"/><path d="M4 34 Q12 30 20 34 Q28 38 36 34"/></svg>
  ),
  "estratificacion-patron-estilo": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10 L36 10"/><path d="M4 17 Q20 12 36 17"/><path d="M4 24 Q12 28 20 24 Q28 20 36 24"/><path d="M4 31 L36 31" strokeDasharray="4 2"/></svg>
  ),
  "estratificacion-grosor": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="6" width="32" height="3"/><rect x="4" y="12" width="32" height="6"/><rect x="4" y="21" width="32" height="2"/><rect x="4" y="26" width="32" height="8"/></svg>
  ),
  "alteracion-tipo": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="20" r="12"/><path d="M14 16 Q20 10 26 16"/><path d="M14 24 Q20 30 26 24"/><line x1="20" y1="8" x2="20" y2="32" strokeDasharray="2 2"/></svg>
  ),
  "alteracion-producto": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8 L12 26 L8 34 L32 34 L28 26 L28 8Z"/><line x1="12" y1="20" x2="28" y2="20"/><circle cx="20" cy="28" r="3"/></svg>
  ),
  "alteracion-distribucion": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="6" width="28" height="28" rx="2"/><circle cx="14" cy="14" r="3"/><circle cx="26" cy="18" r="4"/><circle cx="16" cy="28" r="2"/><circle cx="28" cy="28" r="3"/></svg>
  ),
  "alteracion-grado": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="28" width="6" height="8"/><rect x="17" y="20" width="6" height="16"/><rect x="26" y="10" width="6" height="26"/></svg>
  ),
  "metamorfismo-facies": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="20,4 36,34 4,34"/><line x1="10" y1="24" x2="30" y2="24"/><line x1="14" y1="16" x2="26" y2="16"/></svg>
  ),
  "metamorfismo-grado": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 34 L20 6 L36 34"/><path d="M10 24 L20 10 L30 24"/><path d="M16 16 L20 14 L24 16"/></svg>
  ),
  "geomorfologia-tipo-natural": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 34 L10 18 L18 26 L28 10 L38 34"/></svg>
  ),
  "geomorfologia-tipo-natural-amp": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 34 L10 18 L18 26 L28 10 L38 34"/><path d="M6 34 Q20 28 34 34" strokeDasharray="2 2"/></svg>
  ),
  "geomorfologia-tipo-antropogenico": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="10" y="16" width="20" height="18"/><polygon points="8,16 20,6 32,16"/><rect x="16" y="24" width="8" height="10"/></svg>
  ),
  "geomorfologia-actividad": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 28 Q10 10 20 20 Q30 30 34 12"/><circle cx="34" cy="12" r="3" fill="currentColor"/></svg>
  ),
  "contacto-tipo": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 20 Q12 10 20 20 Q28 30 36 20"/><line x1="4" y1="20" x2="36" y2="20" strokeDasharray="4 2"/></svg>
  ),
  "falla-tipo": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="8" x2="32" y2="32" strokeWidth="2.5"/><polygon points="8,14 8,8 14,8" fill="currentColor"/><polygon points="26,32 32,32 32,26" fill="currentColor"/></svg>
  ),
  "pliegue-tipo": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 30 Q12 6 20 20 Q28 34 36 10"/></svg>
  ),
  "litologia": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="6" width="28" height="28" rx="3"/><line x1="6" y1="14" x2="34" y2="14"/><line x1="6" y1="22" x2="34" y2="22"/><line x1="6" y1="30" x2="34" y2="30"/><circle cx="14" cy="10" r="2"/><circle cx="26" cy="18" r="2"/><circle cx="18" cy="26" r="2"/></svg>
  ),
  "material-igme": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="20,4 4,34 36,34"/><polygon points="20,14 12,30 28,30"/><circle cx="20" cy="24" r="3"/></svg>
  ),
  "superficies-de-estratificacion": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12 Q20 6 36 12"/><path d="M4 20 Q20 14 36 20"/><path d="M4 28 Q20 22 36 28"/><line x1="20" y1="8" x2="20" y2="34" strokeDasharray="2 2"/></svg>
  ),
  "mappedfobservationmethod": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="16" r="10"/><circle cx="20" cy="16" r="4"/><line x1="20" y1="26" x2="20" y2="36"/><line x1="14" y1="34" x2="26" y2="34"/></svg>
  ),
  "medida-estructural": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="20" y1="4" x2="20" y2="36"/><line x1="4" y1="20" x2="36" y2="20"/><path d="M20 4 L24 12" /><path d="M20 4 L16 12"/><circle cx="20" cy="20" r="10" strokeDasharray="3 2"/></svg>
  ),
  "convencion-codigo": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 12 L8 20 L14 28"/><path d="M26 12 L32 20 L26 28"/><line x1="22" y1="8" x2="18" y2="32"/></svg>
  ),
  "metodo-determinacion": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="18" cy="18" r="10"/><line x1="26" y1="26" x2="34" y2="34" strokeWidth="2.5"/></svg>
  ),
  "polaridad": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="20" y1="4" x2="20" y2="36"/><polygon points="16,10 20,4 24,10" fill="currentColor"/><circle cx="20" cy="32" r="3"/></svg>
  ),
  // --- TE: Técnicos ---
  "void-reason": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="20" r="14"/><line x1="10" y1="10" x2="30" y2="30"/></svg>
  ),
  "estado": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="20" r="6"/><circle cx="28" cy="20" r="6"/><line x1="18" y1="20" x2="22" y2="20"/><path d="M28 14 L32 10"/></svg>
  ),
  "contribucion-rol": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="14" cy="12" r="5"/><circle cx="26" cy="12" r="5"/><path d="M4 34 Q4 24 14 24 Q20 24 20 28"/><path d="M36 34 Q36 24 26 24 Q20 24 20 28"/></svg>
  ),
  "responsible-party-role": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="12" r="6"/><path d="M8 36 Q8 24 20 24 Q32 24 32 36"/><path d="M16 18 L20 22 L28 12" strokeWidth="2"/></svg>
  ),
  "file-type": (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4 L26 4 L32 10 L32 36 L10 36Z"/><line x1="26" y1="4" x2="26" y2="10"/><line x1="26" y1="10" x2="32" y2="10"/><line x1="14" y1="18" x2="28" y2="18"/><line x1="14" y1="24" x2="28" y2="24"/><line x1="14" y1="30" x2="22" y2="30"/></svg>
  ),
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
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                          marginBottom: "4px",
                          color: config.colors.skoHubDarkColor,
                        }}
                      >
                        {getTitle(conceptScheme)}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
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
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                      {["ttl", "rdf", "jsonld"].map((fmt) => (
                        <a
                          key={fmt}
                          href={getFilePath(conceptScheme.id, fmt === "rdf" ? "rdf" : fmt === "jsonld" ? "jsonld" : "ttl", customDomain)}
                          download
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "3px",
                            border: `1px solid ${config.colors.skoHubMiddleGrey}`,
                            color: config.colors.skoHubDarkColor,
                            textDecoration: "none",
                            background: config.colors.skoHubLightGrey,
                          }}
                        >
                          {fmt.toUpperCase()}
                        </a>
                      ))}
                    </div>
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
