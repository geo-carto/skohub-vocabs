import Markdown from "markdown-to-jsx"
import { Link } from "gatsby"
import JsonLink from "./JsonLink.jsx"
import { getConfigAndConceptSchemes } from "../hooks/configAndConceptSchemes.js"
import { useSkoHubContext } from "../context/Context.jsx"
import { i18n, getDomId, getFilePath } from "../common"
import ConceptURI from "./ConceptURI.jsx"
import ConceptEgoModal from "./ConceptEgoModal.jsx"
import { useEffect, useState } from "react"

const Concept = ({
  pageContext: { node: concept, collections, customDomain },
}) => {
  const { conceptSchemes } = getConfigAndConceptSchemes()
  const { data } = useSkoHubContext()
  const [language, setLanguage] = useState("")
  const [graphOpen, setGraphOpen] = useState(false)
  const definition =
    concept?.definition || concept?.description || concept?.dcdescription
  const title = concept?.prefLabel || concept?.title || concept?.dctitle

  useEffect(() => {
    setLanguage(data.selectedLanguage)
  }, [data?.selectedLanguage])

  return (
    <div id={getDomId(concept.id)}>
      {concept.deprecated && (
        <h1
          style={{
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            padding: "4px 12px",
            borderRadius: "4px",
            display: "inline-block",
          }}
        >
          ⚠ Deprecated
        </h1>
      )}
      <h1>{title && i18n(language)(title)}</h1>
      <ConceptURI id={concept.id} />
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
        <JsonLink to={getFilePath(concept.id, "json", customDomain)} />
      </div>
      {graphOpen && (
        <ConceptEgoModal
          concept={concept}
          language={language}
          customDomain={customDomain}
          onClose={() => setGraphOpen(false)}
        />
      )}
      {concept.isReplacedBy && concept.isReplacedBy.length > 0 && (
        <div>
          <h3>Is replaced by</h3>
          <ul>
            {concept.isReplacedBy.map((isReplacedBy) => (
              <li key={isReplacedBy.id}>
                <Link to={getFilePath(isReplacedBy.id, `html`, customDomain)}>
                  {isReplacedBy.id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {definition && (
        <div className="markdown">
          <h3>Definition</h3>
          <Markdown>
            {i18n(language)(definition) ||
              `*No definition in language "${language}" provided.*`}
          </Markdown>
        </div>
      )}
      {concept.note && i18n(language)(concept.note) !== "" && (
        <div className="markdown">
          <h3 id="note">Note</h3>
          <ul aria-labelledby="note">
            {i18n(language)(concept.note).map((note, i) => (
              <li key={i}>
                <Markdown>{note}</Markdown>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.changeNote && i18n(language)(concept.changeNote) !== "" && (
        <div className="markdown">
          <h3 id="changenote">Change Note</h3>
          <ul aria-labelledby="changenote">
            {i18n(language)(concept.changeNote).map((changeNote, i) => (
              <li key={i}>
                <Markdown>{changeNote}</Markdown>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.editorialNote &&
        i18n(language)(concept.editorialNote) !== "" && (
          <div className="markdown">
            <h3 id="editorialnote">Editorial Note</h3>
            <ul aria-labelledby="editorialnote">
              {i18n(language)(concept.editorialNote).map((editorialNote, i) => (
                <li key={i}>
                  <Markdown>{editorialNote}</Markdown>
                </li>
              ))}
            </ul>
          </div>
        )}
      {concept.historyNote && i18n(language)(concept.historyNote) !== "" && (
        <div className="markdown">
          <h3 id="historynote">History Note</h3>
          <ul aria-labelledby="historynote">
            {i18n(language)(concept.historyNote).map((historyNote, i) => (
              <li key={i}>
                <Markdown>{historyNote}</Markdown>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.scopeNote && i18n(language)(concept.scopeNote) !== "" && (
        <div className="markdown">
          <h3 id="scopenote">Scope Note</h3>
          <ul aria-labelledby="scopenote">
            {i18n(language)(concept.scopeNote).map((scopeNote, i) => (
              <li key={i}>
                <Markdown>{scopeNote}</Markdown>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.altLabel && i18n(language)(concept.altLabel) !== "" && (
        <div>
          <h3 id="alt-label">Alt Label</h3>
          <ul aria-labelledby="alt-label">
            {i18n(language)(concept.altLabel).map((altLabel, i) => (
              <li key={i}>{altLabel}</li>
            ))}
          </ul>
        </div>
      )}
      {concept.hiddenLabel && i18n(language)(concept.hiddenLabel) !== "" && (
        <div>
          <h3 id="hidden-label">Hidden Label</h3>
          <ul aria-labelledby="hidden-label">
            {i18n(language)(concept.hiddenLabel).map((hiddenLabel, i) => (
              <li key={i}>{hiddenLabel}</li>
            ))}
          </ul>
        </div>
      )}
      {concept.example && (
        <div className="markdown">
          <h3>Example</h3>
          <Markdown>
            {i18n(language)(concept.example) ||
              `*No example in language "${language}" provided.*`}
          </Markdown>
        </div>
      )}
      {concept.related && concept.related.length > 0 && (
        <div>
          <h3>Related</h3>
          <ul>
            {concept.related.map((related) => (
              <li key={related.id}>
                <Link to={getFilePath(related.id, `html`, customDomain)}>
                  {i18n(language)(related.prefLabel) || related.id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.narrowMatch && concept.narrowMatch.length > 0 && (
        <div>
          <h3>Narrow Match</h3>
          <ul>
            {concept.narrowMatch.map((narrowMatch) => (
              <li key={narrowMatch.id}>
                <a target="_blank" rel="noreferrer" href={narrowMatch.id}>
                  {narrowMatch.id}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.broadMatch && concept.broadMatch.length > 0 && (
        <div>
          <h3>Broad Match</h3>
          <ul>
            {concept.broadMatch.map((broadMatch) => (
              <li key={broadMatch.id}>
                <a target="_blank" rel="noreferrer" href={broadMatch.id}>
                  {broadMatch.id}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.exactMatch && concept.exactMatch.length > 0 && (
        <div>
          <h3>Exact Match</h3>
          <ul>
            {concept.exactMatch.map((exactMatch) => (
              <li key={exactMatch.id}>
                <a target="_blank" rel="noreferrer" href={exactMatch.id}>
                  {exactMatch.id}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.closeMatch && concept.closeMatch.length > 0 && (
        <div>
          <h3>Close Match</h3>
          <ul>
            {concept.closeMatch.map((closeMatch) => (
              <li key={closeMatch.id}>
                <a target="_blank" rel="noreferrer" href={closeMatch.id}>
                  {closeMatch.id}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.relatedMatch && concept.relatedMatch.length > 0 && (
        <div>
          <h3>Related Match</h3>
          <ul>
            {concept.relatedMatch.map((relatedMatch) => (
              <li key={relatedMatch.id}>
                <a target="_blank" rel="noreferrer" href={relatedMatch.id}>
                  {relatedMatch.id}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.status && (
        <div>
          <h3>Status</h3>
          {concept.status.startsWith("http") ? (
            <a target="_blank" rel="noreferrer" href={concept.status}>
              {concept.status.split("/").pop()}
            </a>
          ) : (
            <p>{concept.status}</p>
          )}
        </div>
      )}
      {concept.created && (
        <div>
          <h3>Created</h3>
          <p>{concept.created}</p>
        </div>
      )}
      {concept.modified && (
        <div>
          <h3>Modified</h3>
          <p>{concept.modified}</p>
        </div>
      )}
      {concept.notation && concept.notation.length > 0 && (
        <div>
          <h3>Notation</h3>
          <ul>
            {concept.notation.map((notation, i) => (
              <li key={i}>{notation}</li>
            ))}
          </ul>
        </div>
      )}
      {collections && collections.length > 0 && (
        <div className="collections">
          <h3>in Collections</h3>
          <ul>
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link to={getFilePath(collection.id, `html`, customDomain)}>
                  {i18n(language)(collection.prefLabel) ||
                    `*No label in language "${language}" provided.*`}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {concept.inSchemeAll && (
        <div>
          <h3 id="in-scheme">In Scheme</h3>
          <ul aria-labelledby="in-scheme">
            {concept.inSchemeAll.map((inScheme) => (
              <li key={inScheme.id}>
                {Object.keys(conceptSchemes).includes(inScheme.id) ? (
                  <Link to={getFilePath(inScheme.id, "html", customDomain)}>
                    {inScheme.id}
                  </Link>
                ) : (
                  <a href={inScheme.id}>{inScheme.id}</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Concept
