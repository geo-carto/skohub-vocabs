import React, { useEffect, useState } from "react"
import escapeRegExp from "lodash.escaperegexp"
import {
  i18n,
  getFilePath,
  getLanguageFromUrl,
  replaceFilePathInUrl,
} from "../common"
import NestedList from "../components/nestedList"
import TreeControls from "../components/TreeControls"
import Layout from "../components/layout"
import SEO from "../components/seo"
import Search from "../components/Search"

import { conceptStyle } from "../styles/concepts.css.js"
import { getConfigAndConceptSchemes } from "../hooks/configAndConceptSchemes"
import { getUserLang } from "../hooks/getUserLanguage"
import { useSkoHubContext } from "../context/Context.jsx"
import { withPrefix, Link } from "gatsby"

const CATEGORIES = {
  GE: { es: "Geología", en: "Geology" },
  TE: { es: "Técnicos", en: "Technical" },
}
import { handleKeypresses, importIndex } from "./helpers"

const App = ({ pageContext, children, location }) => {
  const { data, updateState } = useSkoHubContext()
  const { config, conceptSchemes } = getConfigAndConceptSchemes()
  const style = conceptStyle(config.colors)
  const [index, setIndex] = useState({})
  const [query, setQuery] = useState(null)
  const [tree, setTree] = useState(
    pageContext.node.type === "ConceptScheme" ? pageContext.node : null
  )
  let showTreeControls = false

  const [labels, setLabels] = useState(
    Object.fromEntries(
      config.searchableAttributes.map((attr) => [
        attr,
        attr === "prefLabel" || attr === "altLabel" ? true : false,
      ])
    )
  )

  handleKeypresses(labels, setLabels)

  if (!showTreeControls && tree && tree.hasTopConcept) {
    for (const topConcept of tree.hasTopConcept) {
      if (topConcept.narrower?.length > 0) {
        showTreeControls = true
        break
      }
    }
  }

  const [language, setLanguage] = useState("")
  const [currentScheme, setCurrentScheme] = useState(null)

  // get current scheme
  useEffect(() => {
    const fetchConceptSchemeForCollection = async (collection) => {
      for (const member of collection.member) {
        const path = replaceFilePathInUrl(
          location.pathname,
          member.id,
          "json",
          config.customDomain
        )
        const res = await (await fetch(path)).json()
        const cs = res.inScheme[0]
        if (res.type === "Concept") {
          return cs
        }
      }
    }

    const getCurrentScheme = async () => {
      if (pageContext.node.type === "ConceptScheme")
        setCurrentScheme(pageContext.node)
      else if (pageContext.node.type === "Concept")
        setCurrentScheme(pageContext.node.inScheme[0])
      else if (pageContext.node.type === "Collection") {
        const cs = await fetchConceptSchemeForCollection(pageContext.node)
        setCurrentScheme(cs)
      } else return {}
    }
    getCurrentScheme()
  }, [])

  // set language stuff
  useEffect(() => {
    if (currentScheme) {
      const languageFromUrl = getLanguageFromUrl(location)

      if (languageFromUrl && !data.selectedLanguage) {
        const userLang = getUserLang({
          availableLanguages: conceptSchemes[currentScheme.id].languages,
          selectedLanguage: languageFromUrl,
        })
        setLanguage(userLang)
        updateState({
          ...data,
          currentScheme,
          indexPage: false,
          selectedLanguage: userLang,
          availableLanguages: conceptSchemes[currentScheme.id].languages,
        })
      } else {
        const userLang = getUserLang({
          availableLanguages: conceptSchemes[currentScheme.id].languages,
          selectedLanguage: data?.selectedLanguage || null,
        })
        setLanguage(userLang)
        updateState({
          ...data,
          currentScheme,
          indexPage: false,
          selectedLanguage: userLang,
          availableLanguages: conceptSchemes[currentScheme.id].languages,
        })
      }
    }
  }, [data?.languages, data?.selectedLanguage, currentScheme])

  // Fetch and load the serialized index
  useEffect(() => {
    importIndex(
      data?.currentScheme?.id,
      labels,
      data.selectedLanguage,
      setIndex,
      config
    )
  }, [data, language, labels])

  // Fetch and load the tree
  useEffect(() => {
    data?.currentScheme?.id &&
      pageContext.node.type !== "ConceptScheme" &&
      fetch(
        withPrefix(
          getFilePath(data?.currentScheme?.id, "json", config.customDomain)
        )
      )
        .then((response) => response.json())
        .then((tree) => setTree(tree))
  }, [data, pageContext.node.type])

  // Scroll current item into view
  useEffect(() => {
    const current = document.querySelector(".current")
    current &&
      current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      })
  })
  const toggleClick = (e) => setLabels({ ...labels, [e]: !labels[e] })
  const title =
    pageContext.node?.prefLabel ||
    pageContext.node?.title ||
    pageContext.node?.dc_title

  return (
    <Layout>
      <SEO
        title={i18n(language)(title)}
        keywords={["Concept", i18n(language)(title)]}
      />
      {data?.currentScheme?.id && (
        <div
          style={{
            padding: "10px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          {/* Breadcrumb */}
          <nav style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", flexWrap: "wrap" }}>
            <Link
              to="/"
              onClick={() => updateState({ ...data, currentScheme: {} })}
              style={{ color: config.colors.skoHubAction, textDecoration: "none" }}
            >
              {language === "en" ? "Home" : "Inicio"}
            </Link>
            {data.currentScheme?.theme && CATEGORIES[data.currentScheme.theme] && (
              <>
                <span style={{ color: config.colors.skoHubMiddleGrey }}>›</span>
                <Link
                  to="/"
                  state={{ category: data.currentScheme.theme }}
                  onClick={() => updateState({ ...data, currentScheme: {} })}
                  style={{ color: config.colors.skoHubAction, textDecoration: "none" }}
                >
                  {CATEGORIES[data.currentScheme.theme][language] ||
                    CATEGORIES[data.currentScheme.theme].es}
                </Link>
              </>
            )}
            <span style={{ color: config.colors.skoHubMiddleGrey }}>›</span>
            {pageContext.node.type === "ConceptScheme" ? (
              <span style={{ color: config.colors.skoHubAction, textDecoration: "none" }}>
                {data.currentScheme?.title?.[language] ||
                  data.currentScheme?.prefLabel?.[language] ||
                  data.currentScheme?.dc_title?.[language] ||
                  data.currentScheme?.id}
              </span>
            ) : (
              <Link
                to={getFilePath(data.currentScheme.id, "html", config.customDomain)}
                style={{ color: config.colors.skoHubAction, textDecoration: "none" }}
              >
                {data.currentScheme?.title?.[language] ||
                  data.currentScheme?.prefLabel?.[language] ||
                  data.currentScheme?.dc_title?.[language] ||
                  data.currentScheme?.id}
              </Link>
            )}
          </nav>
          {/* Back button */}
          <button
            onClick={() => window.history.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "white",
              border: `1px solid ${config.colors.skoHubMiddleGrey}`,
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "13px",
              color: config.colors.skoHubDarkColor,
              padding: "7px 16px",
              fontWeight: "400",
              fontFamily: "inherit",
              flexShrink: 0,
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = config.colors.skoHubAction; e.currentTarget.style.color = config.colors.skoHubAction }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = config.colors.skoHubMiddleGrey; e.currentTarget.style.color = config.colors.skoHubDarkColor }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {language === "en" ? "Back" : "Volver atrás"}
          </button>
        </div>
      )}
      <div className="Concept" css={style}>
        <nav className="block nav-block">
          <Search
            handleQueryInput={(e) => setQuery(e.target.value || null)}
            labels={labels}
            onLabelClick={(e) => toggleClick(e)}
          />
          {showTreeControls && <TreeControls />}
          <div className="concepts">
            {tree && (
              <NestedList
                items={tree.hasTopConcept}
                current={pageContext.node.id}
                queryFilter={
                  query && index?.search ? index.search(query) : null
                }
                highlight={query ? RegExp(escapeRegExp(query), "gi") : null}
                language={language}
                topLevel={true}
                customDomain={config.customDomain}
              />
            )}
          </div>
        </nav>
        <div className="content concept block main-block">{children}</div>
      </div>
    </Layout>
  )
}

export default App
