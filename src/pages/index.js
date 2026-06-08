import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { withPrefix, navigate } from "gatsby"
import { i18n, getFilePath, getLanguageFromUrl } from "../common"
import { useSkoHubContext } from "../context/Context"
import { getUserLang } from "../hooks/getUserLanguage"
import { getConfigAndConceptSchemes } from "../hooks/configAndConceptSchemes.js"

import Layout from "../components/Layout"
import SEO from "../components/Seo"
import GraphModal from "../components/GraphModal"
import VocabIcon from "../components/VocabIcon"
import { getPageStyles } from "../styles/indexPageStyles"
import StatsBar from "../components/StatsBar"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [filterIdioma, setFilterIdioma] = useState("")
  const [filterEstado, setFilterEstado] = useState("")
  const [sortBy, setSortBy] = useState("az")
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
  }, [])

  useEffect(() => {
    if (location.state?.category) {
      setSelectedCategory(location.state.category)
      window.history.replaceState({ category: location.state.category }, "")
    }
  }, [])

  useEffect(() => {
    const handlePopState = (e) => {
      setSelectedCategory(e.state?.category || null)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

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

  const getTitle = (cs) =>
    i18n(language)(cs?.title || cs?.prefLabel || cs?.dc_title) || cs.id

  const sortSchemeOptions = (items) =>
    items
      .map((cs) => ({
        id: cs.id,
        label: getTitle(cs),
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, language === "en" ? "en" : "es", {
          sensitivity: "base",
        })
      )

  const schemeOptions = sortSchemeOptions(conceptSchemes)

  const graphSchemeOptions =
    graphVocab?.theme || selectedCategory
      ? conceptSchemes.filter(
          (cs) => cs.theme === (graphVocab?.theme || selectedCategory)
        )
      : conceptSchemes

  const sortedGraphSchemeOptions = sortSchemeOptions(graphSchemeOptions)

  const getDescription = (cs) =>
    i18n(language)(cs?.description || cs?.dc_description) || ""

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

  const filteredSchemes = selectedCategory
    ? conceptSchemes.filter((cs) => cs.theme === selectedCategory)
    : conceptSchemes

  const allLanguages = Array.from(
    new Set(conceptSchemes.flatMap((cs) => cs.languages))
  )

  const catLanguages = Array.from(
    new Set(filteredSchemes.flatMap((cs) => cs.languages))
  )

  const totalTerms = conceptSchemes.reduce(
    (sum, cs) => sum + (cs.termCount || 0),
    0
  )

  const catTerms = filteredSchemes.reduce(
    (sum, cs) => sum + (cs.termCount || 0),
    0
  )

  const lastModified = (() => {
    const dates = conceptSchemes.map((cs) => cs.modified).filter(Boolean)
    if (!dates.length) return null
    const max = dates.sort().at(-1)
    return new Date(max).toLocaleDateString(
      language === "en" ? "en-GB" : "es-ES",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )
  })()

  const catLastModified = (() => {
    const dates = filteredSchemes.map((cs) => cs.modified).filter(Boolean)
    if (!dates.length) return null
    const max = dates.sort().at(-1)
    return new Date(max).toLocaleDateString(
      language === "en" ? "en-GB" : "es-ES",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )
  })()

  const resetFilters = () => {
    setSearchTerm("")
    setFilterIdioma("")
    setFilterEstado("")
    setSortBy("az")
  }

  const displayedSchemes = filteredSchemes
    .filter((cs) => !filterIdioma || cs.languages.includes(filterIdioma))
    .filter(
      (cs) =>
        !searchTerm ||
        getTitle(cs).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const tA = getTitle(a),
        tB = getTitle(b)
      if (sortBy === "terms-desc") {
        return (b.termCount || 0) - (a.termCount || 0)
      }
      if (sortBy === "terms-asc") {
        return (a.termCount || 0) - (b.termCount || 0)
      }
      return sortBy === "za" ? tB.localeCompare(tA) : tA.localeCompare(tB)
    })

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
            {/* ── Hero (same layout as home page) ── */}
            <div
              className="home-top-band"
              style={{
                backgroundImage: `url(${withPrefix("/img/portada.png")})`,
              }}
            >
              <div className="hero">
                <div className="hero-text">
                  <h1>{getCategoryLabel(selectedCategory)}</h1>
                  <p>{getCategoryLongDescription(selectedCategory)}</p>
                </div>
                <div className="hero-stats-col">
                  <StatsBar
                    vocabCount={filteredSchemes.length}
                    termCount={catTerms}
                    languages={catLanguages}
                    lastModified={catLastModified}
                    language={language}
                  />
                </div>
              </div>
            </div>

            {/* ── Single-column sections ── */}
            <div className="home-scroll">
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
                        background: "#e3e0de",
                        ...(sidebarH ? { height: `${sidebarH}px` } : {}),
                      }}
                    >
                      {/* Explora Vocabularios */}
                      {conceptSchemes.length > 0 && exploreCs && (
                        <div className="sidebar-panel">
                          <div className="sidebar-panel-header">
                            <span className="panel-title">
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                              </svg>
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
                backgroundImage: `url(${withPrefix("/img/portada.png")})`,
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
                {conceptSchemes.length > 0 && (
                  <div className="hero-stats-col">
                    <StatsBar
                      vocabCount={conceptSchemes.length}
                      termCount={totalTerms}
                      languages={allLanguages}
                      lastModified={lastModified}
                      language={language}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="home-scroll">
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
                <section className="home-section cat-panel">
                  <div className="cat-section-title">
                    {language === "en" ? "Categories" : "Categorías"}
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
                            <h3 className="cat-card-title">
                              {getCategoryLabel(code)}
                            </h3>
                            <p className="cat-card-desc">
                              {getCategoryDescription(code)}
                            </p>
                            <span className="cat-card-count">
                              {count}{" "}
                              {language === "en"
                                ? "vocabularies"
                                : "vocabularios"}
                            </span>
                          </div>
                          <div className="cat-card-arrow">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="9 18 15 12 9 6" />
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
    title="Vocabularios Geocientíficos"
    keywords={["vocabularios", "SKOS", "geología"]}
  />
)

export default IndexPage
