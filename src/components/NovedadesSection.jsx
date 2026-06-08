import React, { useRef } from "react"
import { withPrefix } from "gatsby"

const NovedadesSection = ({ novedades, language, updatesSliderRef }) => {
  return (
    <section className="home-section">
      <h2 className="home-section-title">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {language === "en" ? "News" : "Novedades"}
      </h2>
      <div className="home-updates-wrap">
        <div className="home-updates-grid" ref={updatesSliderRef}>
          {novedades.map((item, i) => {
            const title = (item.titulo || "").toLowerCase()
            const updateImage =
              item.imagen ||
              (title.includes("public")
                ? "publicacion.png"
                : title.includes("grafo")
                ? "grafo-2.png"
                : title.includes("filtro")
                ? "filtros.png"
                : null)
            return (
              <article key={i} className="home-update-card">
                {i === 0 && item.nuevo && (
                  <span className="home-update-new">
                    {language === "en" ? "NEW" : "NUEVO"}
                  </span>
                )}
                {item.fecha && (
                  <div className="home-update-date">{item.fecha}</div>
                )}
                <div className="home-update-title">
                  {language === "en" && item.titulo_en
                    ? item.titulo_en
                    : item.titulo}
                </div>
                {(item.descripcion || item.descripcion_en) && (
                  <p className="home-update-desc">
                    {language === "en" && item.descripcion_en
                      ? item.descripcion_en
                      : item.descripcion}
                  </p>
                )}
                {updateImage && (
                  <img
                    className="home-update-img"
                    src={withPrefix(`/img/${updateImage}`)}
                    alt=""
                    loading="lazy"
                  />
                )}
              </article>
            )
          })}
        </div>
        {novedades.length > 3 && (
          <>
            <button
              type="button"
              className="gallery-nav-btn gallery-nav-prev"
              onClick={() => {
                const el = updatesSliderRef.current
                if (!el) return
                const itemW = el.firstElementChild?.offsetWidth || 0
                el.scrollBy({ left: -(itemW + 18), behavior: "smooth" })
              }}
              aria-label={language === "en" ? "Previous" : "Anterior"}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="gallery-nav-btn gallery-nav-next"
              onClick={() => {
                const el = updatesSliderRef.current
                if (!el) return
                const itemW = el.firstElementChild?.offsetWidth || 0
                el.scrollBy({ left: itemW + 18, behavior: "smooth" })
              }}
              aria-label={language === "en" ? "Next" : "Siguiente"}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>
    </section>
  )
}

export default NovedadesSection
