import React from "react"
import { withPrefix } from "gatsby"

const SugerenciasSection = ({
  language,
  handleSuggestionSubmit,
  suggestionName,
  setSuggestionName,
  suggestionSubject,
  setSuggestionSubject,
  suggestionMessage,
  setSuggestionMessage,
}) => {
  return (
    <section
      className="home-section home-suggestion-card"
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
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <div className="section-title-text">
          <span className="section-eyebrow">
            {language === "en" ? "PARTICIPATE" : "PARTICIPA"}
          </span>
          <h2 className="home-section-title">
            {language === "en" ? "Suggestions?" : "¿Tienes sugerencias?"}
          </h2>
        </div>
      </div>
      <div className="sidebar-suggestion">
        <div className="sidebar-suggestion-content">
          <p
            className="section-subtitle"
            style={{ marginBottom: "52px", marginTop: 0 }}
          >
            {language === "en"
              ? "Your opinion helps us improve the repository and continue building quality semantic resources for the scientific community."
              : "Tu opinión nos ayuda a mejorar el repositorio y a seguir construyendo recursos semánticos de calidad para la comunidad científica."}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgb(196,95,40)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polyline points="2,4 12,13 22,4" />
              </svg>
            </div>
            <div className="sidebar-suggestion-title">
              {language === "en"
                ? "Write to us and contact us"
                : "Escribe y contacta con nosotros"}
            </div>
          </div>
        </div>
        <img
          src={withPrefix("/img/sugerencias.png")}
          alt=""
          className="sidebar-suggestion-img"
          loading="lazy"
        />
        <form className="suggestion-form" onSubmit={handleSuggestionSubmit}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              aria-label={
                language === "en" ? "Clear form" : "Limpiar formulario"
              }
              onClick={() => {
                setSuggestionName("")
                setSuggestionSubject("")
                setSuggestionMessage("")
              }}
              style={{
                fontSize: "12px",
                color: "rgb(130, 110, 90)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                padding: 0,
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
                aria-hidden="true"
              >
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={suggestionName}
            onChange={(e) => setSuggestionName(e.target.value)}
            placeholder={language === "en" ? "Name" : "Nombre"}
            aria-label={language === "en" ? "Name" : "Nombre"}
          />
          <input
            type="text"
            value={suggestionSubject}
            onChange={(e) => setSuggestionSubject(e.target.value)}
            placeholder={language === "en" ? "Subject" : "Asunto"}
            aria-label={language === "en" ? "Subject" : "Asunto"}
          />
          <textarea
            value={suggestionMessage}
            onChange={(e) => setSuggestionMessage(e.target.value)}
            placeholder={language === "en" ? "Message" : "Mensaje"}
            aria-label={language === "en" ? "Message" : "Mensaje"}
            required
          />
          <button type="submit" className="sidebar-suggestion-btn">
            {language === "en" ? "Send suggestion →" : "Enviar sugerencia →"}
          </button>
        </form>
      </div>
    </section>
  )
}

export default SugerenciasSection
