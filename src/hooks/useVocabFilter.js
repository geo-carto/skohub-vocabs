import { useState } from "react"
import { i18n } from "../common"

export const useVocabFilter = ({
  conceptSchemes,
  selectedCategory,
  language,
  graphVocab,
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterIdioma, setFilterIdioma] = useState("")
  const [filterEstado, setFilterEstado] = useState("")
  const [sortBy, setSortBy] = useState("az")

  const getTitle = (cs) =>
    i18n(language)(cs?.title || cs?.prefLabel || cs?.dc_title) || cs.id

  const getDescription = (cs) =>
    i18n(language)(cs?.description || cs?.dc_description) || ""

  const sortSchemeOptions = (items) =>
    items
      .map((cs) => ({ id: cs.id, label: getTitle(cs) }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, language === "en" ? "en" : "es", {
          sensitivity: "base",
        })
      )

  const filteredSchemes = selectedCategory
    ? conceptSchemes.filter((cs) => cs.theme === selectedCategory)
    : conceptSchemes

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
      if (sortBy === "terms-desc")
        return (b.termCount || 0) - (a.termCount || 0)
      if (sortBy === "terms-asc") return (a.termCount || 0) - (b.termCount || 0)
      return sortBy === "za" ? tB.localeCompare(tA) : tA.localeCompare(tB)
    })

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

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(
      language === "en" ? "en-GB" : "es-ES",
      { day: "numeric", month: "short", year: "numeric" }
    )

  const lastModified = (() => {
    const dates = conceptSchemes.map((cs) => cs.modified).filter(Boolean)
    if (!dates.length) return null
    return formatDate(dates.sort().at(-1))
  })()

  const catLastModified = (() => {
    const dates = filteredSchemes.map((cs) => cs.modified).filter(Boolean)
    if (!dates.length) return null
    return formatDate(dates.sort().at(-1))
  })()

  const schemeOptions = sortSchemeOptions(conceptSchemes)

  const graphSchemeOptions =
    graphVocab?.theme || selectedCategory
      ? conceptSchemes.filter(
          (cs) => cs.theme === (graphVocab?.theme || selectedCategory)
        )
      : conceptSchemes

  const sortedGraphSchemeOptions = sortSchemeOptions(graphSchemeOptions)

  const resetFilters = () => {
    setSearchTerm("")
    setFilterIdioma("")
    setFilterEstado("")
    setSortBy("az")
  }

  return {
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
    schemeOptions,
    sortedGraphSchemeOptions,
    resetFilters,
  }
}
