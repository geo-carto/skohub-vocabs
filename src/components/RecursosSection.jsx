import React from "react"
import { withPrefix } from "gatsby"
import { getResourceLogo } from "./VocabIcon"

const ICONS = [
  <svg
    key="layers"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>,
  <svg
    key="graph"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="5" cy="12" r="3" />
    <circle cx="19" cy="5" r="3" />
    <circle cx="19" cy="19" r="3" />
    <line x1="8" y1="11" x2="16" y2="6" />
    <line x1="8" y1="13" x2="16" y2="18" />
  </svg>,
  <svg
    key="tree"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="2" width="6" height="4" rx="1" />
    <rect x="2" y="16" width="6" height="4" rx="1" />
    <rect x="16" y="16" width="6" height="4" rx="1" />
    <line x1="12" y1="6" x2="12" y2="12" />
    <line x1="5" y1="16" x2="12" y2="12" />
    <line x1="19" y1="16" x2="12" y2="12" />
  </svg>,
  <svg
    key="doc"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>,
]

const RecursosSection = ({ enlaces, language }) => {
  return (
    <section className="home-section recursos-destacados">
      <h2 className="recursos-header">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        {language === "en" ? "Featured Resources" : "Recursos Destacados"}
      </h2>
      <div className="recursos-grid">
        {enlaces.map((item, i) => {
          const logo = getResourceLogo(item)
          return (
            <a
              key={i}
              href={item.url}
              className="recurso-card"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="recurso-icon-wrap">
                {logo && (
                  <img
                    className="recurso-logo"
                    src={withPrefix(logo)}
                    alt=""
                    loading="lazy"
                  />
                )}
              </div>
              <div className="recurso-body">
                <div className="recurso-vector-icon">
                  {ICONS[i % ICONS.length]}
                </div>
                <div className="recurso-title">{item.titulo}</div>
                {item.descripcion && (
                  <div className="recurso-desc">{item.descripcion}</div>
                )}
                <span className="recurso-link">
                  {language === "en" ? "Learn more →" : "Saber más →"}
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}

export default RecursosSection
