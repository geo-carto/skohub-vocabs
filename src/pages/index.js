import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { withPrefix, navigate } from "gatsby"
import { getFilePath, getLanguageFromUrl } from "../common"
import { useSkoHubContext } from "../context/Context"
import { getUserLang } from "../hooks/getUserLanguage"
import { getConfigAndConceptSchemes } from "../hooks/configAndConceptSchemes.js"
import { useVocabFilter } from "../hooks/useVocabFilter"

import Layout from "../components/Layout"
import SEO from "../components/Seo"
import GraphModal from "../components/GraphModal"
import VocabIcon from "../components/VocabIcon"
import { getPageStyles } from "../styles/indexPageStyles"
import DashboardSection from "../components/DashboardSection"
import NovedadesSection from "../components/NovedadesSection"
import SugerenciasSection from "../components/SugerenciasSection"
import RecursosSection from "../components/RecursosSection"

const CATEGORIES = {
  GE: {
    label: { es: "Geología", en: "Geology" },
    description: {
      es: "Vocabularios controlados de atributos geológicos y geomorfológicos del modelo de datos estandarizados de cartografía geológica.",
      en: "Controlled vocabularies of geological and geomorphological properties of the geological mapping standardized data model.",
    },
    longDescription: {
      es: "Vocabularios controlados de atributos geológicos y geomorfológicos del modelo de datos estandarizados de cartografía geológica. Cada vocabulario contiene el listado de términos, descripciones y jerarquía, si aplica, junto con información relevante sobre su gestión. Están disponibles para descarga en formatos TTL, RDF/XML o JSON-LD.",
      en: "Controlled vocabularies of geological and geomorphological properties of the geological mapping standardized data model. Each vocabulary contains the list of terms, descriptions and hierarchy where applicable, along with relevant management information. Available for download in TTL, RDF/XML or JSON-LD formats.",
    },
    image: "categoria-geologia.png",
  },
  TE: {
    label: { es: "Técnicos", en: "Technical" },
    description: {
      es: "Vocabularios controlados de propiedades técnicas y administrativas del modelo de datos estandarizados de cartografía geológica.",
      en: "Controlled vocabularies of technical and administrative propierties of the geological mapping standardized data model.",
    },
    longDescription: {
      es: "Vocabularios controlados de propiedades técnicas y administrativas del modelo de datos estandarizados de cartografía geológica. Cada vocabulario contiene el listado de términos, descripciones y jerarquía, si aplica, junto con información relevante sobre su gestión. Están disponibles para descarga en formatos TTL, RDF/XML o JSON-LD.",
      en: "Controlled vocabularies of technical and administrative properties of the geological mapping standardized data model. Each vocabulary contains the list of terms, descriptions and hierarchy where applicable, along with relevant management information. Available for download in TTL, RDF/XML or JSON-LD formats.",
    },
    image: "categoria-tecnicos.png",
  },
}

const IndexPage = ({ location }) => {
  const [conceptSchemes, setConceptSchemes] = useState([])
  const [language, setLanguage] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [graphVocab, setGraphVocab] = useState(null)
  const [exploreCs, setExploreCs] = useState(null)
  const [suggestionName, setSuggestionName] = useState("")
  const [suggestionSubject, setSuggestionSubject] = useState("")
  const [suggestionMessage, setSuggestionMessage] = useState("")

  const { data, updateState } = useSkoHubContext()
  const { config } = getConfigAndConceptSchemes()
  const pageStyles = getPageStyles(config.colors)
  const customDomain = config.customDomain
  const homeConfig = config?.home || {}

  const updatesSliderRef = useRef(null)
  const filterColRef = useRef(null)
  const [sidebarH, setSidebarH] = useState(null)

  const {
    searchTerm,
    setSearchTerm,
    filterIdioma,
    setFilterIdioma,
    filterEstado,
    setFilterEstado,
    sortBy,
    setSortBy,
    getTitle,
    getDescription,
    filteredSchemes,
    displayedSchemes,
    allLanguages,
    catLanguages,
    totalTerms,
    catTerms,
    lastModified,
    catLastModified,
    sortedGraphSchemeOptions,
    resetFilters,
  } = useVocabFilter({ conceptSchemes, selectedCategory, language, graphVocab })

  const handleSuggestionSubmit = (e) => {
    e.preventDefault()
    const subject =
      suggestionSubject.trim() ||
      (language === "en"
        ? "Repository suggestion"
        : "Sugerencia para el repositorio")
    const body = [
      suggestionName.trim()
        ? `${language === "en" ? "Name" : "Nombre"}: ${suggestionName.trim()}`
        : null,
      suggestionMessage.trim(),
    ]
      .filter(Boolean)
      .join("\n\n")
    window.location.href = `mailto:vocabularios.cientificos@igme.es?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
  }
  const normalizeConceptSchemes = (value) => {
    if (Array.isArray(value)) return value
    if (value?.conceptSchemes && Array.isArray(value.conceptSchemes)) {
      return value.conceptSchemes
    }
    if (value && typeof value === "object") {
      return Object.values(value).filter((item) => item?.id)
    }
    return []
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    async function fetchConceptData() {
      try {
        const res = await fetch(withPrefix("/index.json"))
        if (!res.ok) throw new Error(`Could not load index.json: ${res.status}`)
        const csData = await res.json()
        const schemes = normalizeConceptSchemes(csData)
        setConceptSchemes(schemes)
        const languages = Array.from(
          new Set(schemes.flatMap((cs) => cs.languages || []))
        )
        updateState({ ...data, languages: languages, indexPage: true })
      } catch {
        setConceptSchemes([])
      }
    }
    fetchConceptData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (location.state?.category) {
      setSelectedCategory(location.state.category)
      window.history.replaceState({ category: location.state.category }, "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handlePopState = (e) => {
      setSelectedCategory(e.state?.category || null)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      window.scrollTo({ top: 0, behavior: "instant" })
    }
  }, [selectedCategory])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.languages, data?.selectedLanguage])

  useEffect(() => {
    if (conceptSchemes.length > 0) {
      const pool = selectedCategory
        ? conceptSchemes.filter((cs) => cs.theme === selectedCategory)
        : conceptSchemes
      if (!pool.length) return
      if (exploreCs && pool.some((cs) => cs.id === exploreCs.id)) return
      const sortedPool = [...pool].sort((a, b) =>
        getTitle(a).localeCompare(
          getTitle(b),
          language === "en" ? "en" : "es",
          {
            sensitivity: "base",
          }
        )
      )
      setExploreCs(sortedPool[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptSchemes, selectedCategory, exploreCs, language])

  useLayoutEffect(() => {
    if (!selectedCategory || !filterColRef.current) return
    const sync = () => {
      if (filterColRef.current) setSidebarH(filterColRef.current.offsetHeight)
    }
    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [
    selectedCategory,
    language,
    searchTerm,
    filterIdioma,
    filterEstado,
    sortBy,
  ])

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

  const getCategoryLongDescription = (code) => {
    const cat = CATEGORIES[code]
    if (!cat) return ""
    const src = cat.longDescription || cat.description
    if (!src) return ""
    return src[language] || src["es"] || ""
  }

  const availableCategories = Object.keys(CATEGORIES).filter((code) =>
    conceptSchemes.some((cs) => cs.theme === code)
  )

  return (
    <Layout language={language} topBackground={true}>
      <div
        css={pageStyles}
        style={
          selectedCategory
            ? {
                width: "100%",
                minHeight: "100%",
                padding: "0",
                boxSizing: "border-box",
                background: "transparent",
              }
            : {
                width: "100%",
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "visible",
                padding: "0",
                boxSizing: "border-box",
                background: "transparent",
              }
        }
      >
        {selectedCategory ? (
          /* ══════════════════════════════════════
           CATEGORY PAGE — 3-column layout
        ══════════════════════════════════════ */
          <div className="cat-page">
            {/* ── Hero ── */}
            <div className="home-top-band cat-hero-img-band">
              <img
                src={withPrefix("/img/sec-listado.png")}
                alt=""
                className="cat-hero-img"
              />
              <div className="hero cat-hero-overlay">
                <div className="hero-text">
                  <h1>{getCategoryLabel(selectedCategory)}</h1>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "stretch",
                      gap: "16px",
                    }}
                  >
                    <p style={{ margin: 0, flex: 1 }}>
                      {getCategoryLongDescription(selectedCategory)}
                    </p>
                    <img
                      src={withPrefix("/img/logo-gi-carto.png")}
                      alt=""
                      style={{
                        width: "auto",
                        maxHeight: "130px",
                        objectFit: "contain",
                        flexShrink: 0,
                        alignSelf: "center",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Single-column sections ── */}
            <div className="home-scroll">
              {/* Dashboard */}
              <DashboardSection
                vocabCount={filteredSchemes.length}
                termCount={catTerms}
                languages={catLanguages}
                lastModified={catLastModified}
                language={language}
              />

              {/* Nav: breadcrumb + back button */}
              <div className="home-section cat-nav-section">
                <div className="cat-section-content">
                  <div className="cat-breadcrumb">
                    <div className="breadcrumb-path">
                      <button
                        onClick={() => {
                          setSelectedCategory(null)
                          window.history.pushState(null, "")
                          resetFilters()
                        }}
                      >
                        {language === "en" ? "Home" : "Inicio"}
                      </button>
                      <span className="sep">›</span>
                      <span className="current">
                        {getCategoryLabel(selectedCategory)}
                      </span>
                    </div>
                    <button
                      className="back-btn-top"
                      onClick={() => {
                        setSelectedCategory(null)
                        resetFilters()
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      {language === "en" ? "Back" : "Volver atrás"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 1: Filters + Explore Vocabularios */}
              <div className="home-section cat-panels-section">
                <div className="cat-section-content">
                  <div className="cat-panels-row">
                    {/* Left: Filters */}
                    <div
                      className="cat-filters-col is-horizontal"
                      ref={filterColRef}
                    >
                      <div className="filter-header">
                        <button className="filter-clear" onClick={resetFilters}>
                          {language === "en" ? "Clear all" : "Limpiar todo"}
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="1 4 1 10 7 10" />
                            <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                          </svg>
                        </button>
                      </div>
                      <div className="filter-section">
                        <div className="filter-label">
                          <svg
                            style={{ position: "static" }}
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="4" y1="12" x2="14" y2="12" />
                          </svg>
                          {language === "en"
                            ? "Search vocabulary"
                            : "Buscar vocabulario"}
                        </div>
                        <div className="filter-search">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                          <input
                            type="text"
                            placeholder={
                              language === "en"
                                ? "Search by text..."
                                : "Buscar por texto..."
                            }
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="filter-section">
                        <div className="filter-label">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                          </svg>
                          {language === "en" ? "Format" : "Formato"}
                        </div>
                        <select value="" onChange={() => {}}>
                          <option value="">
                            {language === "en" ? "All" : "Todos"}
                          </option>
                          <option value="ttl">TTL</option>
                          <option value="rdf">RDF/XML</option>
                          <option value="jsonld">JSON-LD</option>
                        </select>
                      </div>
                      <div className="filter-section">
                        <div className="filter-label">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          {language === "en" ? "Language" : "Idioma"}
                        </div>
                        <select
                          value={filterIdioma}
                          onChange={(e) => setFilterIdioma(e.target.value)}
                        >
                          <option value="">
                            {language === "en" ? "All" : "Todos"}
                          </option>
                          <option value="es">
                            {language === "en" ? "Spanish" : "Español"}
                          </option>
                          <option value="en">
                            {language === "en" ? "English" : "Inglés"}
                          </option>
                        </select>
                      </div>
                      <div className="filter-section">
                        <div className="filter-label">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {language === "en" ? "Status" : "Estado"}
                        </div>
                        <select
                          value={filterEstado}
                          onChange={(e) => setFilterEstado(e.target.value)}
                        >
                          <option value="">
                            {language === "en" ? "All" : "Todos"}
                          </option>
                          <option value="valido">
                            {language === "en" ? "Valid" : "Válido"}
                          </option>
                          <option value="retirado">
                            {language === "en" ? "Retired" : "Retirado"}
                          </option>
                          <option value="sustituido">
                            {language === "en" ? "Superseded" : "Sustituido"}
                          </option>
                          <option value="propuesto">
                            {language === "en" ? "Proposed" : "Propuesto"}
                          </option>
                          <option value="invalido">
                            {language === "en" ? "Invalid" : "Inválido"}
                          </option>
                        </select>
                      </div>
                      <div className="filter-section">
                        <div className="filter-label">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                          </svg>
                          {language === "en" ? "Sort by" : "Ordenar por"}
                        </div>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="az">A → Z</option>
                          <option value="za">Z → A</option>
                          <option value="terms-desc">
                            {language === "en"
                              ? "Terms count \u2193"
                              : "N\u00famero de t\u00e9rminos \u2193"}
                          </option>
                          <option value="terms-asc">
                            {language === "en"
                              ? "Terms count \u2191"
                              : "N\u00famero de t\u00e9rminos \u2191"}
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Right: Sidebar */}
                    <div
                      className="cat-sidebar-col explore-wide"
                      style={{
                        background: "#e2e2e2",
                        ...(sidebarH ? { height: `${sidebarH}px` } : {}),
                      }}
                    >
                      {/* Explora Vocabularios */}
                      {conceptSchemes.length > 0 && exploreCs && (
                        <div className="sidebar-panel">
                          <div className="sidebar-panel-header">
                            <span className="panel-title">
                              <div
                                style={{
                                  width: "52px",
                                  height: "52px",
                                  borderRadius: "50%",
                                  background: "rgba(196, 95, 40, 0.12)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <svg
                                  width="26"
                                  height="26"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="rgb(196, 95, 40)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="11" cy="11" r="8" />
                                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                              </div>
                              {language === "en"
                                ? "Explore Vocabularies"
                                : "Explora Vocabularios"}
                            </span>
                            <div className="explore-copy-row">
                              <p className="explore-panel-desc">
                                {language === "en"
                                  ? "Browse the vocabulary list to discover all topics. Search and filter vocabularies, explore their terms, learn their meaning and visualize their relationships."
                                  : "Navega por el listado de vocabularios para descubrir todas las temáticas. Busca y filtra vocabularios, explora sus términos, aprende su significado y visualiza sus relaciones."}
                              </p>
                            </div>
                          </div>
                          <div className="explore-image-box">
                            <span className="explore-img-label">
                              {language === "en"
                                ? "Visualize Relationships"
                                : "Visualiza Relaciones"}
                            </span>
                            <span className="explore-img-sublabel">
                              {language === "en"
                                ? "Explore the hierarchies and relationships between terms"
                                : "Profundiza en las jerarquías y las relaciones entre términos"}
                            </span>
                            <button
                              type="button"
                              className="explore-img-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                setGraphVocab(exploreCs)
                              }}
                            >
                              {language === "en"
                                ? "Open graph →"
                                : "Ver grafo →"}
                            </button>
                            <img
                              className="explore-graph-img"
                              src={withPrefix("/img/ver-grafo.png")}
                              alt=""
                              loading="lazy"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections: one vocabulary per section */}
              {displayedSchemes.map((cs) => (
                <div className="home-section" key={cs.id}>
                  <div className="cat-section-content">
                    <div
                      className="vocab-card-v2"
                      onClick={() => {
                        updateState({
                          ...data,
                          conceptSchemeLanguages: [...cs.languages],
                          currentScheme: cs,
                          selectedLanguage: cs.languages.includes(language)
                            ? language
                            : cs.languages[0],
                        })
                        navigate(getFilePath(cs.id, "html", customDomain))
                      }}
                    >
                      <div className="vocab-card-inner">
                        <div className="vocab-card-thumb">
                          <VocabIcon vocabId={cs.id} colors={config.colors} />
                        </div>
                        <div className="vocab-card-body">
                          <span className="vocab-title-link">
                            {getTitle(cs)}
                          </span>
                          <p className="vocab-desc">{getDescription(cs)}</p>
                          <div className="vocab-meta-row">
                            <span className="meta-item">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                              {cs.languages
                                .map((l) =>
                                  l === "es"
                                    ? "Es"
                                    : l === "en"
                                    ? "En"
                                    : l.toUpperCase()
                                )
                                .join(" · ")}
                            </span>
                            {cs.termCount > 0 && (
                              <span className="meta-item">
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <line x1="8" y1="6" x2="21" y2="6" />
                                  <line x1="8" y1="12" x2="21" y2="12" />
                                  <line x1="8" y1="18" x2="21" y2="18" />
                                  <line x1="3" y1="6" x2="3.01" y2="6" />
                                  <line x1="3" y1="12" x2="3.01" y2="12" />
                                  <line x1="3" y1="18" x2="3.01" y2="18" />
                                </svg>
                                {cs.termCount.toLocaleString(
                                  language === "en" ? "en-GB" : "es-ES"
                                )}{" "}
                                {language === "en" ? "terms" : "términos"}
                              </span>
                            )}
                            {cs.collectionCount > 0 && (
                              <span className="meta-item">
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M3 7h6l2 3h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
                                  <path d="M3 7V5a2 2 0 0 1 2-2h4l2 4" />
                                </svg>
                                {cs.collectionCount.toLocaleString(
                                  language === "en" ? "en-GB" : "es-ES"
                                )}{" "}
                                {language === "en"
                                  ? cs.collectionCount === 1
                                    ? "collection"
                                    : "collections"
                                  : cs.collectionCount === 1
                                  ? "colecci\u00f3n"
                                  : "colecciones"}
                              </span>
                            )}
                            {cs.modified && (
                              <span className="meta-item">
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                {new Date(cs.modified).toLocaleDateString(
                                  language === "en" ? "en-GB" : "es-ES",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                            )}
                            <button
                              className="btn-ver-grafo"
                              onClick={(e) => {
                                e.stopPropagation()
                                setGraphVocab(cs)
                              }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="5" cy="12" r="3" />
                                <circle cx="19" cy="5" r="3" />
                                <circle cx="19" cy="19" r="3" />
                                <line x1="8" y1="11" x2="16" y2="6" />
                                <line x1="8" y1="13" x2="16" y2="18" />
                              </svg>
                              {language === "en" ? "View graph" : "Ver grafo"}
                            </button>
                            <span className="status-valid">
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              {language === "en" ? "Valid" : "Válido"}
                            </span>
                            {[
                              { label: "TTL", ext: "ttl" },
                              { label: "RDF/XML", ext: "rdf" },
                              { label: "JSON-LD", ext: "jsonld" },
                            ].map(({ label, ext }, i) => {
                              const slug = cs.id.split("/").pop()
                              return (
                                <a
                                  key={ext}
                                  className="btn-ver-grafo"
                                  href={`${
                                    customDomain || "/"
                                  }downloads/${slug}.${ext}`}
                                  download
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    fontSize: "12px",
                                    lineHeight: "1",
                                    background: "rgb(245, 240, 232)",
                                    borderColor: "rgb(210, 190, 165)",
                                    ...(i === 0 ? { marginLeft: "auto" } : {}),
                                  }}
                                >
                                  {label}
                                </a>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════
           HOME PAGE — 2-column grid
        ══════════════════════════════════════ */
          <>
            <div
              className="home-top-band"
              style={{
                backgroundImage: `url(${withPrefix("/img/sec-portada.png")})`,
              }}
            >
              <div className="hero">
                <div className="hero-text">
                  <h1>{config.title || "Repositorio de Vocabularios"}</h1>
                  {homeConfig.subtitle && (
                    <h2>
                      {language === "en" && homeConfig.subtitle_en
                        ? homeConfig.subtitle_en
                        : homeConfig.subtitle}
                    </h2>
                  )}
                  {homeConfig.description && (
                    <p>
                      {language === "en" && homeConfig.description_en
                        ? homeConfig.description_en
                        : homeConfig.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="home-scroll">
              {/* Dashboard */}
              {conceptSchemes.length > 0 && (
                <DashboardSection
                  vocabCount={conceptSchemes.length}
                  termCount={totalTerms}
                  languages={allLanguages}
                  lastModified={lastModified}
                  language={language}
                />
              )}

              {/* ── Columna principal ── */}
              {/* Search */}
              {!selectedCategory &&
                availableCategories.length === 0 &&
                filteredSchemes.length > 4 && (
                  <div className="search-wrapper">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder={
                        language === "en"
                          ? "Search vocabularies..."
                          : "Buscar vocabularios, conceptos o colecciones..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}

              {/* Categories */}
              {!selectedCategory && availableCategories.length > 0 && (
                <section
                  className="home-section cat-panel"
                  style={{
                    backgroundImage: `linear-gradient(to right, transparent 0%, #e2e2e2 42%), url(${withPrefix(
                      "/img/sec-voc.png"
                    )})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%, auto 100%",
                    backgroundPosition: "0 0, left center",
                  }}
                >
                  <div className="section-title-block">
                    <span className="section-title-icon-wrap">
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgb(196,95,40)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    </span>
                    <div className="section-title-text">
                      <span className="section-eyebrow">
                        {language === "en" ? "EXPLORE" : "EXPLORA"}
                      </span>
                      <div className="home-section-title">
                        {language === "en"
                          ? "Discover and consult the vocabularies"
                          : "Descubre y consulta los vocabularios"}
                      </div>
                      <p className="section-subtitle">
                        {language === "en"
                          ? "Access controlled vocabularies that structure and standardize geoscientific knowledge. Available in Spanish and English and in multiple formats for download."
                          : "Accede a vocabularios controlados que estructuran y normalizan el conocimiento geocientífico. Disponibles en español e inglés y en múltiples formatos para su descarga."}
                      </p>
                    </div>
                  </div>
                  <div className="cat-list">
                    {availableCategories.map((code) => {
                      const cat = CATEGORIES[code]
                      const count = conceptSchemes.filter(
                        (cs) => cs.theme === code
                      ).length
                      return (
                        <button
                          key={code}
                          className="cat-card"
                          onClick={() => {
                            setSelectedCategory(code)
                            window.history.pushState({ category: code }, "")
                          }}
                        >
                          <img
                            src={withPrefix(`/img/${cat.image}`)}
                            alt={getCategoryLabel(code)}
                            className="cat-card-img"
                          />
                          <div className="cat-card-body">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "14px",
                                marginBottom: "10px",
                              }}
                            >
                              <div
                                style={{
                                  width: "46px",
                                  height: "46px",
                                  borderRadius: "50%",
                                  background: "rgba(196, 95, 40, 0.12)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {code === "GE" ? (
                                  <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="rgb(196, 95, 40)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 20h18L12 5 8 13l-3-2z" />
                                    <path d="M8 13l4-8 5 9" />
                                  </svg>
                                ) : (
                                  <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="rgb(196, 95, 40)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                  </svg>
                                )}
                              </div>
                              <h3
                                className="cat-card-title"
                                style={{ flex: 1, margin: 0 }}
                              >
                                {getCategoryLabel(code)}
                              </h3>
                            </div>
                            <p
                              className="cat-card-desc"
                              style={{
                                paddingLeft: "60px",
                                paddingRight: "48px",
                              }}
                            >
                              {getCategoryDescription(code)}
                            </p>
                            <div
                              style={{
                                paddingLeft: "60px",
                                paddingRight: "48px",
                                marginTop: "6px",
                                display: "flex",
                                justifyContent: "flex-end",
                              }}
                            >
                              <span className="cat-card-count">
                                {count}{" "}
                                {language === "en"
                                  ? "vocabularies"
                                  : "vocabularios"}
                              </span>
                            </div>
                          </div>
                          <div className="cat-card-arrow">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="8" y1="12" x2="16" y2="12" />
                              <polyline points="12 8 16 12 12 16" />
                            </svg>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Novedades */}
              {!selectedCategory && homeConfig.novedades?.length > 0 && (
                <NovedadesSection
                  novedades={homeConfig.novedades}
                  language={language}
                  updatesSliderRef={updatesSliderRef}
                />
              )}

              {/* Sugerencias */}
              {!selectedCategory && (
                <SugerenciasSection
                  language={language}
                  handleSuggestionSubmit={handleSuggestionSubmit}
                  suggestionName={suggestionName}
                  setSuggestionName={setSuggestionName}
                  suggestionSubject={suggestionSubject}
                  setSuggestionSubject={setSuggestionSubject}
                  suggestionMessage={suggestionMessage}
                  setSuggestionMessage={setSuggestionMessage}
                />
              )}

              {/* Recursos Destacados */}
              {!selectedCategory && homeConfig.enlaces?.length > 0 && (
                <RecursosSection
                  enlaces={homeConfig.enlaces}
                  language={language}
                />
              )}
            </div>
          </>
        )}
      </div>
      {graphVocab && (
        <GraphModal
          vocabId={graphVocab.id}
          customDomain={customDomain}
          language={language}
          title={getTitle(graphVocab)}
          onClose={() => setGraphVocab(null)}
          schemes={sortedGraphSchemeOptions}
          onVocabChange={(id) => {
            const cs = conceptSchemes.find(
              (c) =>
                c.id === id &&
                (!graphVocab?.theme || c.theme === graphVocab.theme)
            )
            if (cs) setGraphVocab(cs)
          }}
        />
      )}
    </Layout>
  )
}

export const Head = () => (
  <SEO
    title="Vocabularios IGME"
    keywords={["vocabularios", "SKOS", "geología"]}
  />
)

export default IndexPage
