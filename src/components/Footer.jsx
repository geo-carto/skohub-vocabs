import { css } from "@emotion/react"
import PropTypes from "prop-types"
import { useState } from "react"

import { getConfigAndConceptSchemes } from "../hooks/configAndConceptSchemes"

const CONDICIONES_TEXT = [
  "Los vocabularios publicados en este sitio se distribuyen bajo licencia Creative Commons Attribution 4.0 International (CC BY 4.0), salvo indicación contraria.",
  "Estos vocabularios incluyen términos propios y términos adaptados, reutilizados o alineados con vocabularios y registros abiertos de referencia, en particular vocabularios CGI/GeoSciML e INSPIRE.",
  "La reutilización de los vocabularios requiere citar la fuente, indicar si se han realizado modificaciones y no sugerir que la institución titular respalda el uso derivado que se haga de ellos.",
  'Cita recomendada: "[Nombre del vocabulario]", [Institución / Proyecto], versión [x], fecha [aaaa-mm-dd], licencia CC BY 4.0.',
  "La reutilización de los contenidos, datos e información publicados en este sitio se entiende sin perjuicio de las condiciones generales de reutilización establecidas por el Instituto Geológico y Minero de España, de acuerdo con la normativa estatal sobre reutilización de la información del sector público. Cuando un recurso concreto indique una licencia específica, se aplicarán las condiciones de dicha licencia.",
  "Esta web utiliza mecanismos de generación y publicación basados en SkoHub Vocabs y SkoHub Pages, proyectos de código abierto publicados bajo licencia Apache License 2.0. Sobre esta base se han incorporado desarrollos propios y nuevas funcionalidades, estilos y un diseño visual personalizado para ajustarse a las necesidades del proyecto.",
  "La eventual publicación, distribución o reutilización del código desarrollado específicamente para esta web se regirá por las condiciones que establezca el Instituto Geológico y Minero, sin perjuicio del cumplimiento de las licencias aplicables a los componentes de terceros utilizados.",
  "La personalización visual, los desarrollos propios, los contenidos, los vocabularios y los datos publicados en este sitio son responsabilidad de Instituto Geológico y Minero de España.",
]

const Footer = () => {
  const { config } = getConfigAndConceptSchemes()
  const [modalOpen, setModalOpen] = useState(false)

  const style = css`
    background: #4a2f2f;
    color: ${config.colors.skoHubWhite};

    .footerContent {
      padding: 15px;

      ul {
        display: flex;
        align-items: center;
        list-style: none;
        margin: 0;
        padding: 0;
        flex-wrap: wrap;
        gap: 4px 0;

        li {
          display: inline-flex;
          align-items: center;
          padding: 0 20px 0 0;
          margin: 0;
        }

        .push-right {
          margin-left: auto;
        }
      }

      a,
      .footer-btn {
        color: ${config.colors.skoHubWhite};
        font-weight: 700;
        background: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
        font-size: inherit;
        padding: 0;

        &:hover {
          text-decoration: underline;
        }
      }

      .footer-copyright {
        font-size: 13px;
        opacity: 0.85;
        font-weight: 400;
      }

      @media only screen and (max-width: 800px) {
        text-align: center;

        ul {
          flex-direction: column;
          align-items: center;

          li {
            padding: 2px 0;
          }

          .push-right {
            margin-left: 0;
          }
        }
      }
    }

    .footer-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .footer-modal {
      background: white;
      color: rgb(35, 15, 5);
      border-radius: 10px;
      max-width: 720px;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }

    .footer-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px 14px;
      border-bottom: 1px solid rgb(220, 205, 185);
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: rgb(35, 15, 5);
      }

      button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 22px;
        line-height: 1;
        color: rgb(130, 110, 90);
        padding: 0 4px;

        &:hover {
          color: rgb(35, 15, 5);
        }
      }
    }

    .footer-modal-body {
      overflow-y: auto;
      padding: 20px 24px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;

      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.65;
        color: rgb(60, 40, 20);
      }
    }
  `

  const links = config?.footer?.links || []

  return (
    <footer css={style}>
      <div className="footerContent">
        <ul>
          <li>
            <span className="footer-copyright">
              © 2026 Instituto Geológico y Minero de España. Powered by SkoHub.
            </span>
          </li>

          <li className="push-right">
            <button className="footer-btn" onClick={() => setModalOpen(true)}>
              Condiciones de uso
            </button>
          </li>

          {process.env.GATSBY_RESPOSITORY_URL && (
            <li>
              <a
                href={process.env.GATSBY_RESPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Source
              </a>
            </li>
          )}

          {links.map((link, idx) => (
            <li key={idx}>
              <a
                href={link.url}
                target={link.target || undefined}
                rel={link.rel || undefined}
              >
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {modalOpen && (
        <div
          className="footer-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="footer-modal">
            <div className="footer-modal-header">
              <h2>Condiciones de uso</h2>
              <button onClick={() => setModalOpen(false)} aria-label="Cerrar">
                ×
              </button>
            </div>
            <div className="footer-modal-body">
              {CONDICIONES_TEXT.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

Footer.propTypes = {
  siteTitle: PropTypes.string,
}

Footer.defaultProps = {
  siteTitle: ``,
}

export default Footer
