import Markdown from "markdown-to-jsx"
import Concept from "./Concept"
import { i18n, getDomId, getFilePath } from "../common"
import JsonLink from "./JsonLink"
import ConceptURI from "./ConceptURI"
import GraphModal from "./GraphModal"
import { useSkoHubContext } from "../context/Context"
import { useEffect, useState } from "react"
import { useLocation } from "@gatsbyjs/reach-router"

const ConceptScheme = ({
  pageContext: { node: conceptScheme, embed, customDomain },
}) => {
  const { data } = useSkoHubContext()
  const [language, setLanguage] = useState("")
  const [graphOpen, setGraphOpen] = useState(false)
  useEffect(() => {
    setLanguage(data.selectedLanguage)
  }, [data?.selectedLanguage])

  const pathname = useLocation()
  const description =
    conceptScheme?.description || conceptScheme?.dc_description
  const title =
    conceptScheme?.title || conceptScheme?.dc_title || conceptScheme?.prefLabel
  // got some hash uri to show
  if (pathname.hash) {
    const filtered = embed.find((c) => c.json.id.endsWith(pathname.hash))
    return (
      <div id={getDomId(conceptScheme.id)}>
        <Concept pageContext={{ node: filtered.json, language }} />
      </div>
    )
  } else {
    return (
      <div id={getDomId(conceptScheme.id)}>
        <div>
          <h1>{title && i18n(language)(title)}</h1>
          <ConceptURI id={conceptScheme.id} />
          <div className="concept-top-actions">
            <button
              onClick={() => setGraphOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                border: "1px solid rgb(220,205,185)",
                borderRadius: "20px",
                background: "white",
                cursor: "pointer",
                fontSize: "13px",
                fontFamily: "inherit",
                color: "rgb(80,60,40)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgb(196,95,40)"
                e.currentTarget.style.color = "rgb(196,95,40)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgb(220,205,185)"
                e.currentTarget.style.color = "rgb(80,60,40)"
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="5" cy="12" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/>
                <line x1="8" y1="11" x2="16" y2="6"/><line x1="8" y1="13" x2="16" y2="18"/>
              </svg>
              {language === "en" ? "View graph" : "Ver grafo"}
            </button>
            <JsonLink to={getFilePath(conceptScheme.id, "json", customDomain)} />
          </div>
          {graphOpen && (
            <GraphModal
              vocabId={conceptScheme.id}
              customDomain={customDomain}
              language={language}
              title={title && i18n(language)(title)}
              onClose={() => setGraphOpen(false)}
            />
          )}
          {description && (
            <div className="markdown">
              <Markdown>{i18n(language)(description)}</Markdown>
            </div>
          )}
          {conceptScheme.publisher && (
            <div>
              <h3>Publisher</h3>
              <a href={conceptScheme.publisher.id}>
                {conceptScheme.publisher.id}
              </a>
            </div>
          )}
          {conceptScheme.issued && (
            <div>
              <h3>Issued</h3>
              <p>{conceptScheme.issued}</p>
            </div>
          )}
          {conceptScheme.created && (
            <div>
              <h3>Created</h3>
              <p>{conceptScheme.created}</p>
            </div>
          )}
          {conceptScheme.modified && (
            <div>
              <h3>Modified</h3>
              <p>{conceptScheme.modified}</p>
            </div>
          )}
          {conceptScheme.creator && (
            <div>
              <h3>Creator</h3>
              {conceptScheme.creator.startsWith("http") ? (
                <a target="_blank" rel="noreferrer" href={conceptScheme.creator}>
                  {conceptScheme.creator}
                </a>
              ) : (
                <p>{conceptScheme.creator}</p>
              )}
            </div>
          )}
          {conceptScheme.contributor && (
            <div>
              <h3>Contributor</h3>
              {conceptScheme.contributor.startsWith("http") ? (
                <a target="_blank" rel="noreferrer" href={conceptScheme.contributor}>
                  {conceptScheme.contributor}
                </a>
              ) : (
                <p>{conceptScheme.contributor}</p>
              )}
            </div>
          )}
          {conceptScheme.versionInfo && (
            <div>
              <h3>Version</h3>
              <p>{conceptScheme.versionInfo}</p>
            </div>
          )}
          {conceptScheme.source && (
            <div>
              <h3>Source</h3>
              {conceptScheme.source.startsWith("http") ? (
                <a target="_blank" rel="noreferrer" href={conceptScheme.source}>
                  {conceptScheme.source}
                </a>
              ) : (
                <p>{conceptScheme.source}</p>
              )}
            </div>
          )}
          {conceptScheme.provenance && (
            <div>
              <h3>Provenance</h3>
              <p>{conceptScheme.provenance}</p>
            </div>
          )}
          {conceptScheme.license && (
            <div>
              <h3>License</h3>
              <a href={conceptScheme.license.id}>{conceptScheme.license.id}</a>
            </div>
          )}
          {conceptScheme.preferredNamespaceUri && (
            <div>
              <h3>Preferred Namespace URI</h3>
              <p>{conceptScheme.preferredNamespaceUri}</p>
            </div>
          )}
          {conceptScheme.preferredNamespacePrefix && (
            <div>
              <h3>Preferred Namespace Prefix</h3>
              <p>{conceptScheme.preferredNamespacePrefix}</p>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default ConceptScheme
