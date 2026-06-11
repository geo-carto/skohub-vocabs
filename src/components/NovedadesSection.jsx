import React, { useRef } from "react"
import { withPrefix } from "gatsby"

const NovedadesSection = ({ novedades, language, updatesSliderRef }) => {
  return (
    <section
      className="home-section content-left nov-section"
      style={{
        backgroundImage: `url(${withPrefix("/img/sec-nov.png")})`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="nov-panel-inner">
        <div className="nov-panel-content">
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <div className="section-title-text">
              <span className="section-eyebrow">
                {language === "en" ? "UPDATES" : "ACTUALIDAD"}
              </span>
              <h2 className="home-section-title">
                {language === "en" ? "News" : "Novedades"}
              </h2>
              <p className="section-subtitle">
                {language === "en"
                  ? "Stay up to date with the latest updates and changes in the repository and news of interest related to semantics, knowledge systems and linked data."
                  : "Manténte al día de las últimas actualizaciones y cambios en el repositorio y de novedades de interés relacionados con la semántica, los sistemas de conocimiento y los datos enlazados."}
              </p>
            </div>
          </div>
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
        </div>
      </div>
    </section>
  )
}

export default NovedadesSection
