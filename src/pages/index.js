import React, { useEffect, useRef, useState } from "react"
import { css } from "@emotion/react"
import { withPrefix, navigate } from "gatsby"
import { i18n, getFilePath, getLanguageFromUrl } from "../common"
import { useSkoHubContext } from "../context/Context"
import { getUserLang } from "../hooks/getUserLanguage"
import { getConfigAndConceptSchemes } from "../hooks/configAndConceptSchemes.js"

import Layout from "../components/layout"
import SEO from "../components/seo"
import GraphModal from "../components/GraphModal"

const CATEGORIES = {
  GE: {
    label: { es: "Geología", en: "Geology" },
    description: {
      es: "Vocabularios controlados de atributos geológicos y geomorfológicos del modelo de datos estandarizados de cartografía geológica.",
      en: "Controlled vocabularies of geological and geomorphological properties of the geological mapping standardized data model.",
    },
    image: "categoria-geologia.png",
  },
  TE: {
    label: { es: "Técnicos", en: "Technical" },
    description: {
      es: "Vocabularios controlados de propiedades técnicas y administrativas del modelo de datos estandarizados de cartografía geológica.",
      en: "Controlled vocabularies of technical and administrative propierties of the geological mapping standardized data model.",
    },
    image: "categoria-tecnicos.png",
  },
}

const VOCAB_ICONS = {
  "afloramiento-caracter": "/img/vocab-afloramiento-caracter.png",
  "alteracion-grado": "/img/vocab-alteracion-grado.png",
  "alteracion-producto": "/img/vocab-alteracion-producto.png",
  "alteracion-tipo": "/img/vocab-alteracion-tipo.png",
  "coleccion-tipo": "/img/vocab-coleccion-tipo.png",
  "contacto-tipo": "/img/vocab-contacto-tipo.png",
  "edad-geologica": "/img/vocab-edad-geologica.png",
  "estratificacion-grosor": "/img/vocab-estratificacion-grosor.png",
  "estratificacion-patron": "/img/vocab-estratificacion-patron.png",
  "estratificacion-patron-estilo":
    "/img/vocab-estratificacion-patron-estilo.png",
  "evento-proceso": "/img/vocab-evento-proceso.png",
  "geomorfologia-actividad": "/img/vocab-geomorfologia-actividad.png",
  "geomorfologia-tipo-antropogenico":
    "/img/vocab-geomorfologia-tipo-antropogenico.png",
  "geomorfologia-tipo-natural": "/img/vocab-geomorfologia-tipo-natural.png",
  "geomorfologia-tipo-natural-amp":
    "/img/vocab-geomorfologia-tipo-natural-amp.png",
  "metodo-observacion-objeto-cartografiado":
    "/img/vocab-metodo-observacion-objeto-cartografiado.png",
  "marco-de-cartografiado": "/img/vocab-marco-de-cartografiado.png",
  "material-igme": "/img/vocab-material-igme.png",
  "medida-estructural": "/img/vocab-medida-estructural.png",
  "metamorfismo-facies": "/img/vocab-metamorfismo-facies.png",
  "metamorfismo-grado": "/img/vocab-metamorfismo-grado.png",
  "metodo-determinacion": "/img/vocab-metodo-determinacion.png",
  "pliegue-tipo": "/img/vocab-pliegue-tipo.png",
  "rango-estratigrafico": "/img/vocab-rango-estratigrafico.png",
  "falla-tipo": "/img/vocab-falla-tipo.png",
  "superficies-de-estratificacion":
    "/img/vocab-superficies-de-estratificacion.png",
  "evento-ambiente": "/img/vocab-evento-ambiente.png",
  "unidad-geologica-tipo": "/img/vocab-unidad-geologica-tipo.png",
  "unidad-geologica-composicion": "/img/vocab-unidad-geologica-composicion.png",
  "unidad-geologica-rol-parte": "/img/vocab-unidad-geologica-rol-parte.png",
  "unidad-geologica-morfologia": "/img/vocab-unidad-geologica-morfologia.png",
  "alteracion-distribucion": "/img/vocab-alteracion-distribucion.png",
  polaridad: "/img/vocab-polaridad.png",
  "contribucion-rol": "/img/vocab-contribucion-rol.png",
  "convencion-codigo": "/img/vocab-convencion-codigo.png",
  "archivo-tipo": "/img/vocab-archivo-tipo.png",
  "responsible-party-role": "/img/vocab-responsible-party-role.png",
  "valor-razon-vacio": "/img/vocab-valor-razon-vacio.png",
  estado: "/img/vocab-estado.png",
}

const RESOURCE_LOGOS = [
  {
    match: (item) => /skos|w3c/i.test(`${item.titulo || ""} ${item.url || ""}`),
    src: "/img/logo-skos.png",
  },
  {
    match: (item) => /geosciml/i.test(`${item.titulo || ""} ${item.url || ""}`),
    src: "/img/logo-geosciml.png",
  },
  {
    match: (item) => /inspire/i.test(`${item.titulo || ""} ${item.url || ""}`),
    src: "/img/logo-inspire.png",
  },
  {
    match: (item) =>
      /egdi|europe-geology/i.test(`${item.titulo || ""} ${item.url || ""}`),
    src: "/img/logo-egdi.png",
  },
]

const getResourceLogo = (item) =>
  RESOURCE_LOGOS.find((logo) => logo.match(item))?.src || null

const DEFAULT_ICON = (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="6" y="6" width="28" height="28" rx="4" />
    <line x1="12" y1="14" x2="28" y2="14" />
    <line x1="12" y1="20" x2="28" y2="20" />
    <line x1="12" y1="26" x2="22" y2="26" />
  </svg>
)

const VocabIcon = ({ vocabId, colors }) => {
  const slug = vocabId.split("/").pop()
  const icon = VOCAB_ICONS[slug]
  if (typeof icon === "string") {
    return (
      <img
        src={withPrefix(icon)}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    )
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.skoHubMiddleColor,
      }}
    >
      <div style={{ width: "50px", height: "50px" }}>
        {icon || DEFAULT_ICON}
      </div>
    </div>
  )
}

const pageStyles = css`
  .page-grid {
    display: grid;
    grid-template-columns: 1fr 540px;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
    gap: 24px;
    align-items: stretch;
    padding-top: 0;
    padding-bottom: 40px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  /* ── Hero ── */
  .home-top-band {
    min-height: 195px;
    margin-bottom: 5px;

    @media (max-width: 900px) {
      height: auto;
    }
  }

  .hero {
    background: transparent;
    background-size: cover;
    background-position: center;
    border-radius: 0;
    box-shadow: none;
    padding: 5px 36px 52px;
    height: 100%;
    margin: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 28px;

    @media (max-width: 900px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    @media (max-width: 640px) {
      height: auto;
      padding: 20px 20px 14px;
    }
  }

  .hero-text {
    max-width: 50%;
    flex-shrink: 0;

    @media (max-width: 900px) {
      max-width: 100%;
    }

    @media (max-width: 640px) {
      max-width: 100%;
    }

    h1 {
      font-size: 48px;
      font-weight: 700;
      line-height: 1.1;
      margin: 0 0 16px 0;
    }

    h2 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 18px 0;
    }

    p {
      font-size: 15px;
      line-height: 1.65;
      margin: 0;
      color: rgb(80, 60, 40);
    }

    @media (max-width: 640px) {
      h1 {
        font-size: 38px;
      }
      h2 {
        font-size: 18px;
      }
    }
  }

  /* ── Stats ── */
  .stats-bar {
    display: flex;
    gap: 0;
    margin-bottom: 14px;
    border: none;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.38);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.12);

    .stat-item {
      padding: 5px 10px;
      gap: 8px;

      .stat-icon-bg {
        width: 34px;
        height: 34px;
        min-width: 34px;
      }
      .stat-icon {
        width: 18px;
        height: 18px;
      }
      .stat-value {
        font-size: 22px;
      }
      .stat-label {
        font-size: 12px;
      }
    }

    @media (max-width: 640px) {
      flex-wrap: wrap;
    }
  }

  .hero-stats-col {
    flex: 1;
    min-width: 0;
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 20px;

    .stats-bar {
      margin-bottom: 0;
      height: 125px;
      width: fit-content;
      justify-content: center;

      .stat-item {
        flex: 0 0 auto;
        padding: 14px 14px;
        gap: 8px;
      }
    }

    @media (max-width: 900px) {
      flex: none;
      align-self: auto;
      width: 100%;

      .stats-bar {
        height: auto;
        width: auto;

        .stat-item {
          padding: 5px 10px;
          gap: 8px;
        }
      }
    }
  }

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    border-right: none;

    &:last-child {
      border-right: none;
    }

    .stat-icon-bg {
      flex-shrink: 0;
      width: 52px;
      height: 52px;
      min-width: 52px;
      border-radius: 50%;
      background: rgba(196, 95, 40, 0.14);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon {
      width: 28px;
      height: 28px;
      color: rgb(196, 95, 40);
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      font-size: 16px;
      color: rgb(130, 110, 90);
      line-height: 1.3;
    }

    .stat-date {
      font-size: 15px;
      font-weight: 700;
      color: rgb(35, 15, 5);
      line-height: 1.15;
      white-space: nowrap;
    }

    .stat-update-label {
      font-size: 13px;
      color: rgb(130, 110, 90);
      line-height: 1.2;
      white-space: normal;
      max-width: 58px;
    }

    @media (max-width: 640px) {
      flex: 1 1 50%;
      border-bottom: 1px solid rgb(220, 205, 185);
    }
  }

  /* ── Search ── */
  .search-wrapper {
    margin-bottom: 20px;
    position: relative;

    svg {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: rgb(130, 110, 90);
    }

    input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      font-size: 15px;
      border: 1px solid rgb(220, 205, 185);
      border-radius: 8px;
      background: rgb(255, 255, 255);
      font-family: inherit;
      color: inherit;

      &:focus {
        outline: none;
        border-color: rgb(196, 95, 40);
      }

      &::placeholder {
        color: rgb(175, 155, 130);
      }
    }
  }

  /* ── Categories ── */
  .cat-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .main-col {
    display: grid;
    grid-template-rows: 1fr auto;
    row-gap: 16px;
  }

  .cat-panel {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.08);

    .cat-list {
      padding: 12px;
      background: white;
    }

    .cat-card {
      box-shadow: 0 2px 8px rgba(35, 15, 5, 0.06);
    }
  }

  .cat-section-title {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: rgb(244, 244, 244);
    border-bottom: 2px solid rgb(220, 205, 185);
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgb(35, 15, 5);
  }

  .cat-card {
    display: flex;
    align-items: stretch;
    background: rgb(255, 255, 255);
    border: none;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.08);
    text-align: left;
    font-family: inherit;
    width: 100%;
    --cat-card-title-color: rgb(35, 15, 5);

    &:hover {
      box-shadow: 0 10px 26px rgba(35, 15, 5, 0.12);
      --cat-card-title-color: rgb(196, 95, 40);
    }

    &:hover .cat-card-title {
      color: rgb(196, 95, 40);
    }

    @media (max-width: 640px) {
      flex-direction: column;
    }
  }

  .cat-card-img {
    width: 220px;
    min-width: 220px;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center;

    @media (max-width: 640px) {
      width: 100%;
      min-width: unset;
      height: 180px;
    }
  }

  .cat-card-body {
    flex: 1;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }

  .cat-card-title {
    font-size: 32px;
    font-weight: 700;
    margin: 0;
    color: var(--cat-card-title-color);
  }

  .cat-card-desc {
    font-size: 14px;
    line-height: 1.5;
    color: rgb(80, 60, 40);
    margin: 0;
  }

  .cat-card-count {
    display: inline-block;
    font-size: 13px;
    color: rgb(130, 110, 90);
    background: rgb(245, 240, 232);
    border-radius: 20px;
    padding: 3px 12px;
    align-self: flex-start;
  }

  .cat-card-arrow {
    padding: 0 20px;
    display: flex;
    align-items: center;
    color: rgb(130, 110, 90);

    @media (max-width: 640px) {
      display: none;
    }
  }

  /* ── Vocab list ── */
  .vocab-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .vocab-card {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    border: none;
    border-radius: 6px;
    overflow: hidden;
    transition:
      box-shadow 0.2s,
      border-color 0.2s;
    min-height: 100px;
    background: rgb(255, 255, 255);
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.08);

    &:hover {
      box-shadow: 0 10px 26px rgba(35, 15, 5, 0.12);
    }

    @media (max-width: 640px) {
      min-height: 80px;
    }
  }

  .vocab-icon {
    width: 100px;
    min-width: 100px;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;

    @media (max-width: 640px) {
      width: 70px;
      min-width: 70px;
    }
  }

  .vocab-downloads {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    justify-content: center;
    flex-wrap: wrap;

    @media (max-width: 640px) {
      padding: 6px 8px;
      gap: 3px;
    }
  }

  /* ── Back button ── */
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    padding: 8px 16px;
    font-weight: 600;
    transition: background 0.2s;
    font-family: inherit;
    margin-bottom: 16px;
  }

  /* ── Category header ── */
  .cat-header {
    margin-bottom: 20px;

    h2 {
      font-size: 30px;
      font-weight: 700;
      margin: 0 0 8px 0;
      text-transform: uppercase;
    }

    p {
      font-size: 14px;
      line-height: 1.5;
      color: rgb(80, 60, 40);
      margin: 0;
    }
  }

  /* ── Sidebar ── */
  .sidebar {
    display: grid;
    grid-template-rows: 1fr auto;
    row-gap: 16px;

    @media (max-width: 900px) {
      display: none;
    }
  }

  .sidebar-top-panels {
    display: flex;
    flex-direction: column;
    gap: 14px;

    .sidebar-panel {
      flex: 1;
    }
  }

  .sidebar-panel {
    background: white;
    border: none;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.08);
    display: flex;
    flex-direction: column;
  }

  .sidebar-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgb(244, 244, 244);
    border-bottom: 2px solid rgb(220, 205, 185);

    .panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: rgb(35, 15, 5);
    }

    .panel-link {
      font-size: 10px;
      color: rgb(196, 95, 40);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .sidebar-panel-body {
    padding: 4px 0;
  }

  .gallery-slider-wrap {
    position: relative;
    padding: 10px 12px 8px;
  }

  .gallery-slider {
    display: flex;
    overflow-x: scroll;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    gap: 8px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .gallery-slide-item {
    flex: 0 0 calc((100% - 16px) / 3);
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    color: rgb(35, 15, 5);

    &:hover .gallery-slide-img {
      opacity: 0.82;
    }
  }

  .gallery-slide-img {
    width: 100%;
    aspect-ratio: 3 / 4;
    max-height: 110px;
    object-fit: cover;
    border-radius: 4px;
    display: block;
    background: rgb(245, 240, 232);
    transition: opacity 0.15s;
  }

  .gallery-nav-btn {
    position: absolute;
    top: calc(50% - 9px);
    transform: translateY(-50%);
    z-index: 2;
    border: 1.5px solid rgba(210, 195, 175, 0.85);
    background: rgba(255, 255, 255, 0.88);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgb(100, 80, 60);
    padding: 0;
    transition: all 0.15s;

    &:hover {
      background: white;
      border-color: rgb(176, 118, 48);
      color: rgb(176, 118, 48);
    }

    &.gallery-nav-prev {
      left: 2px;
    }

    &.gallery-nav-next {
      right: 2px;
    }
  }

  .gallery-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(0, 0, 0, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .gallery-modal {
    width: 65vw;
    max-width: 1100px;
    height: 65vh;
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
  }

  .gallery-modal-titlebar {
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0;
    background: rgb(32, 32, 32);
    user-select: none;
  }

  .gallery-modal-title {
    flex: 1;
    text-align: left;
    font-size: 12px;
    color: rgb(200, 200, 200);
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 8px 0 14px;
  }

  .gallery-modal-winctrls {
    display: flex;
    gap: 0;
    align-items: stretch;
    flex-shrink: 0;
    height: 32px;
  }

  .gallery-wc-btn {
    width: 46px;
    height: 32px;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: rgb(200, 200, 200);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    flex-shrink: 0;
    border-radius: 0;
  }

  .gallery-wc-btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .gallery-wc-close:hover {
    background: rgb(196, 43, 28);
    color: white;
  }

  .gallery-modal-body {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(18, 18, 18);
    overflow: hidden;
  }

  .gallery-modal-img {
    max-width: 100%;
    max-height: 100%;
    display: block;
    object-fit: contain;
  }

  .gallery-modal-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: rgba(30, 30, 30, 0.6);
    color: white;
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    pointer-events: all;
    transition: background 0.15s;
  }

  .gallery-modal-nav:hover {
    background: rgba(30, 30, 30, 0.85);
  }

  .gallery-modal-nav.prev {
    left: 14px;
  }

  .gallery-modal-nav.next {
    right: 14px;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    font-size: 15px;
    gap: 8px;

    .item-title {
      flex: 1;
      color: rgb(35, 15, 5);
    }

    .item-date {
      font-size: 11px;
      color: rgb(130, 110, 90);
      white-space: nowrap;
    }

    .badge-nuevo {
      font-size: 10px;
      font-weight: 700;
      background: rgb(45, 140, 80);
      color: white;
      border-radius: 4px;
      padding: 2px 6px;
      white-space: nowrap;
    }

    .badge-destacado {
      font-size: 10px;
      font-weight: 700;
      background: rgb(196, 95, 40);
      color: white;
      border-radius: 4px;
      padding: 2px 6px;
      white-space: nowrap;
    }
  }

  .sidebar-item-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 12px;
    font-size: 13px;
    gap: 8px;
    cursor: pointer;
    transition: background 0.15s;
    text-decoration: none;
    color: inherit;

    &:hover {
      background: rgb(235, 225, 210);
    }

    .item-info {
      flex: 1;

      .item-title {
        color: rgb(35, 15, 5);
        margin-bottom: 2px;
      }

      .item-desc {
        font-size: 11px;
        color: rgb(130, 110, 90);
      }
    }
  }

  .sidebar-see-all {
    display: block;
    padding: 4px 12px 8px;
    font-size: 11px;
    color: rgb(196, 95, 40);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .sidebar-suggestion {
    flex: 1;
    display: grid;
    grid-template-columns: 226px 1fr;
    align-items: center;
    gap: 6px;
    padding: 8px 8px 8px 0;
    font-size: 15px;

    p {
      margin: 0 0 10px 0;
      color: rgb(80, 60, 40);
      line-height: 1.4;
    }

    p + p {
      display: none;
    }
  }

  .sidebar-suggestion-img {
    width: 238px;
    height: 188px;
    object-fit: contain;
    display: block;
  }

  .sidebar-suggestion-content {
    min-width: 0;
  }

  .sidebar-suggestion-title {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.3;
    color: rgb(35, 15, 5);
    margin: 0 0 6px;
  }

  .sidebar-suggestion-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 700;
    color: rgb(196, 95, 40);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: inherit;

    &:hover {
      text-decoration: underline;
    }
  }

  /* ═══════════════════════════════════════
     CATEGORY PAGE (3-column layout)
  ═══════════════════════════════════════ */

  .cat-page {
    padding-top: 16px;
    padding-bottom: 40px;
  }

  .cat-breadcrumb {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .breadcrumb-path {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;

      button {
        background: none;
        border: none;
        color: rgb(196, 95, 40);
        cursor: pointer;
        font-size: 14px;
        padding: 0;
        font-family: inherit;
        &:hover {
          text-decoration: underline;
        }
      }
      .sep {
        color: rgb(175, 155, 130);
      }
      .current {
        color: rgb(35, 15, 5);
      }
    }

    .back-btn-top {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      font-size: 13px;
      border: 1px solid rgb(220, 205, 185);
      border-radius: 20px;
      background: white;
      color: rgb(35, 15, 5);
      cursor: pointer;
      font-family: inherit;
      &:hover {
        border-color: rgb(196, 95, 40);
        color: rgb(196, 95, 40);
      }
    }
  }

  .cat-top-row {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 18px;
    margin-bottom: 20px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  .cat-hero-panel {
    background: rgb(244, 244, 244);
    border: none;
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.08);
    padding: 14px 22px;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 20px;

    .cat-hero-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;

      h2 {
        font-size: 34px;
        font-weight: 700;
        margin: 0 0 6px 0;
        line-height: 1.1;
      }
      p {
        font-size: 13px;
        line-height: 1.55;
        color: rgb(80, 60, 40);
        margin: 0;
      }
    }

    .cat-hero-logo-wrap {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .cat-hero-logo {
      height: 100%;
      width: auto;
      max-width: 140px;
      object-fit: contain;
      opacity: 0.9;
    }
  }

  .cat-stats-panel {
    border: none;
    border-radius: 10px;
    overflow: hidden;
    background: rgb(245, 240, 232);
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.08);
    display: flex;
    align-items: stretch;

    .stat-item {
      flex: 1;
      padding: 10px 14px;
      border-right: none;
      border-bottom: none;

      &:last-child {
        border-right: none;
      }

      .stat-value {
        font-size: 26px;
      }
      .stat-icon-bg {
        width: 40px;
        height: 40px;
        min-width: 40px;
      }
      .stat-icon {
        width: 22px;
        height: 22px;
      }
    }
  }

  /* Timeline */
  .timeline-panel-body {
    flex: 1;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .timeline-item {
    display: flex;
    gap: 10px;
    padding-bottom: 0;

    &:last-child {
      padding-bottom: 0;

      .timeline-line {
        display: none;
      }
    }

    .timeline-dot-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;

      .timeline-dot {
        width: 10px;
        height: 10px;
        min-width: 10px;
        border-radius: 50%;
        background: rgb(196, 95, 40);
        margin-top: 3px;
      }

      .timeline-line {
        width: 2px;
        flex: 1;
        background: rgb(220, 205, 185);
        margin-top: 4px;
        min-height: 18px;
      }
    }

    .timeline-content {
      flex: 1;

      .timeline-title {
        font-size: 13px;
        color: rgb(35, 15, 5);
        line-height: 1.3;
      }

      .timeline-date {
        font-size: 11px;
        color: rgb(130, 110, 90);
        margin-top: 2px;
      }

      .timeline-new {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        background: rgb(45, 140, 80);
        color: white;
        border-radius: 3px;
        padding: 1px 5px;
        margin-left: 4px;
        vertical-align: middle;
      }
    }
  }

  /* 3-column grid */
  .cat-content-grid {
    display: grid;
    grid-template-columns: 250px 1fr 310px;
    gap: 40px;
    align-items: start;

    @media (max-width: 1100px) {
      grid-template-columns: 220px 1fr;
      .cat-sidebar-col {
        display: none;
      }
    }
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      .cat-filters-col {
        display: none;
      }
    }
  }

  /* Filters column */
  .cat-filters-col {
    background: white;
    border: none;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.08);
  }

  .filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgb(244, 244, 244);
    border-bottom: 2px solid rgb(220, 205, 185);

    .filter-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: rgb(35, 15, 5);
    }
    .filter-clear {
      font-size: 12px;
      color: rgb(196, 95, 40);
      background: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
      padding: 0;
      display: flex;
      align-items: center;
      gap: 4px;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .filter-search {
    padding: 10px 12px;
    border-bottom: none;
    position: relative;

    svg {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: rgb(130, 110, 90);
      pointer-events: none;
    }
    input {
      width: 100%;
      padding: 8px 10px 8px 34px;
      font-size: 14px;
      border: 1px solid rgb(220, 205, 185);
      border-radius: 6px;
      background: white;
      font-family: inherit;
      color: inherit;
      &:focus {
        outline: none;
        border-color: rgb(196, 95, 40);
      }
      &::placeholder {
        color: rgb(175, 155, 130);
      }
    }
  }

  .filter-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 7px;
  }

  .filter-section {
    padding: 10px 14px;
    border-bottom: none;
    &:last-child {
      border-bottom: none;
    }

    select {
      width: 100%;
      padding: 7px 28px 7px 10px;
      font-size: 14px;
      border: 1px solid rgb(220, 205, 185);
      border-radius: 6px;
      background-color: white;
      color: rgb(130, 110, 90);
      font-family: inherit;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23826e5a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      &:focus {
        outline: none;
        border-color: rgb(196, 95, 40);
      }
    }
  }

  /* Vocab cards v2 */
  .vocab-card-v2 {
    display: flex;
    align-items: stretch;
    border: none;
    border-radius: 6px;
    overflow: hidden;
    background: white;
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.08);
    transition:
      box-shadow 0.2s,
      border-color 0.2s;
    cursor: pointer;

    &:hover {
      box-shadow: 0 10px 26px rgba(35, 15, 5, 0.12);
    }

    &:hover .vocab-title-link {
      color: rgb(196, 95, 40);
    }
  }

  .vocab-card-thumb {
    width: 110px;
    min-width: 110px;
    background: rgb(244, 244, 244);
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    flex-shrink: 0;
    border-right: none;
  }

  .vocab-card-body {
    flex: 1;
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;

    .vocab-title-link {
      font-size: 21px;
      font-weight: 700;
      line-height: 1.2;
      color: rgb(35, 15, 5);
      text-decoration: none;
      &:hover {
        color: rgb(196, 95, 40);
      }
    }
    .vocab-desc {
      font-size: 15px;
      line-height: 1.5;
      color: rgb(80, 60, 40);
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin: 0;
    }
    .vocab-meta-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: auto;
      padding-top: 6px;
      border-top: 1px solid rgb(235, 225, 210);
      flex-wrap: wrap;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: rgb(130, 110, 90);
      }
      .status-valid {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        padding: 2px 8px;
        border-radius: 20px;
        background: rgb(220, 245, 230);
        color: rgb(30, 120, 60);
      }

      .btn-ver-grafo {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        padding: 2px 10px;
        border-radius: 20px;
        border: 1px solid rgb(220, 205, 185);
        background: white;
        color: rgb(80, 60, 40);
        cursor: pointer;
        font-family: inherit;
        transition:
          border-color 0.15s,
          color 0.15s;

        &:hover {
          border-color: rgb(196, 95, 40);
          color: rgb(196, 95, 40);
        }
      }
    }
  }

  .vocab-card-dl-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    justify-content: center;
    flex-shrink: 0;
  }

  .vocab-download-link {
    font-size: 11px;
    padding: 1px 8px;
    border-radius: 3px;
    border: 1px solid rgb(195, 180, 160);
    color: rgb(35, 15, 5);
    text-decoration: none;
    background: rgb(244, 244, 244);
    text-align: center;
    white-space: nowrap;
    transition:
      background 0.12s,
      border-color 0.12s,
      color 0.12s,
      box-shadow 0.12s,
      transform 0.12s;

    &:hover,
    &:focus-visible {
      background: rgb(255, 245, 235);
      border-color: rgb(196, 95, 40);
      color: rgb(196, 95, 40);
      box-shadow: 0 0 0 2px rgba(196, 95, 40, 0.16);
      transform: translateY(-1px);
      outline: none;
    }
  }

  /* Category sidebar */
  .cat-sidebar-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .consultado-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    font-size: 14px;

    .rank-num {
      width: 20px;
      height: 20px;
      min-width: 20px;
      border-radius: 50%;
      background: rgb(220, 205, 185);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
    }
    .rank-title {
      flex: 1;
      color: rgb(35, 15, 5);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .rank-visits {
      font-size: 11px;
      color: rgb(130, 110, 90);
      white-space: nowrap;
    }
  }

  .ayuda-body {
    padding: 10px 12px;

    p {
      margin: 0 0 10px 0;
      color: rgb(80, 60, 40);
      line-height: 1.5;
      font-size: 13px;
    }
    a {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: rgb(196, 95, 40);
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .explore-select {
    width: 100%;
    padding: 6px 28px 6px 10px;
    font-size: 13px;
    border: 1px solid rgb(220, 205, 185);
    border-radius: 6px;
    background-color: white;
    color: rgb(130, 110, 90);
    font-family: inherit;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23826e5a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    &:focus {
      outline: none;
      border-color: rgb(196, 95, 40);
    }
  }

  .explore-graph-area {
    position: relative;
    cursor: pointer;
    border-top: 1px solid rgb(220, 205, 185);
    background: white;
    overflow: hidden;
    padding-bottom: 30px;

    &:hover .explore-overlay {
      opacity: 1;
    }
  }

  .explore-dots {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 5px;
    pointer-events: auto;

    button {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      border: none;
      padding: 0;
      cursor: pointer;
      background: rgb(210, 185, 160);
      transition: background 0.2s;
      &.active {
        background: rgb(150, 68, 22);
      }
    }
  }

  .explore-slide-label {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 9px;
    color: rgb(150, 110, 70);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    pointer-events: none;
    margin-top: 2px;
  }

  .explore-overlay {
    position: absolute;
    left: 12px;
    bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1;
    transition: opacity 0.2s;
    background: transparent;
  }

  .explore-overlay-btn {
    background: rgba(196, 95, 40, 0.92);
    color: white;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.03em;
    padding: 7px 16px;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    transition:
      background 0.15s,
      box-shadow 0.15s,
      transform 0.15s;
  }

  .explore-graph-area:hover .explore-overlay-btn {
    background: rgb(196, 95, 40);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.24);
    transform: translateY(-1px);
  }

  /* ── Recursos Destacados ── */
  .recursos-destacados {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.08);
    height: 190px;
  }

  .sidebar > .sidebar-panel {
    height: 190px;
  }

  .recursos-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgb(244, 244, 244);
    border-bottom: 2px solid rgb(220, 205, 185);
    font-size: 16px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgb(35, 15, 5);
  }

  .recursos-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    background: white;
  }

  .recurso-card {
    display: grid;
    grid-template-columns: 96px 1fr;
    align-items: center;
    gap: 14px;
    padding: 16px 14px;
    background: white;
    border-radius: 0;
    box-shadow: none;
    border-right: 1px solid rgb(235, 225, 210);
    border-bottom: none;
    text-decoration: none;
    color: inherit;
    text-align: left;
    transition: background 0.15s;

    &:last-child {
      border-right: none;
    }

    &:hover {
      background: rgb(250, 247, 242);
    }

    &:hover .recurso-link {
      text-decoration: underline;
    }
  }

  .recurso-icon-wrap {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
  }

  .recurso-logo {
    width: 100%;
    max-height: 76px;
    object-fit: contain;
    display: block;
  }

  .recurso-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .recurso-vector-icon {
      color: rgb(196, 95, 40);
      margin-bottom: 5px;
      line-height: 0;
    }

    .recurso-title {
      font-size: 17px;
      font-weight: 700;
      line-height: 1.3;
      color: rgb(35, 15, 5);
      margin: 0 0 4px;
    }

    .recurso-desc {
      font-size: 14px;
      line-height: 1.5;
      color: rgb(80, 60, 40);
      margin: 0 0 8px;
    }

    .recurso-link {
      font-size: 14px;
      color: rgb(196, 95, 40);
      font-weight: 600;
    }
  }
`

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

  const { data, updateState } = useSkoHubContext()
  const { config } = getConfigAndConceptSchemes()
  const customDomain = config.customDomain
  const homeConfig = config?.home || {}
  const homeSlides = homeConfig.carrusel || []
  const galleryItems = homeSlides.map((item, index) => ({
    title:
      item.titulo ||
      item.title ||
      (language === "en" ? `Image ${index + 1}` : `Imagen ${index + 1}`),
    image: item.imagen,
    thumb:
      item.miniatura || item.thumb || item.imagen?.replace(/(\.[^.]+)$/, "g$1"),
  }))
  const [galleryIndex, setGalleryIndex] = useState(null)
  const sliderRef = useRef(null)
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
    }
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

  useEffect(() => {
    if (galleryIndex === null || galleryItems.length === 0) return
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setGalleryIndex(null)
      } else if (event.key === "ArrowLeft") {
        setGalleryIndex(
          (index) => (index - 1 + galleryItems.length) % galleryItems.length
        )
      } else if (event.key === "ArrowRight") {
        setGalleryIndex((index) => (index + 1) % galleryItems.length)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [galleryIndex, galleryItems.length])

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

  const Sidebar = () => {
    return (
      <aside className="sidebar">
        <div className="sidebar-top-panels">
          {/* Sugerencias */}
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
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {language === "en" ? "Suggestions?" : "¿Tienes sugerencias?"}
              </span>
            </div>
            <div className="sidebar-suggestion">
              <img
                src={withPrefix("/img/sugerencias.png")}
                alt=""
                className="sidebar-suggestion-img"
                loading="lazy"
              />
              <div className="sidebar-suggestion-content">
                <div className="sidebar-suggestion-title">
                  {language === "en"
                    ? "Write to us and contact us"
                    : "Escríbenos y contacta con nosotros"}
                </div>
                <p>
                  {language === "en"
                    ? "Your feedback helps us improve the repository."
                    : "Tu opinión nos ayuda a mejorar el repositorio."}
                </p>
                <p>EscrÃ­benos y contacta con nosotros.</p>
                <a
                  href="mailto:vocabularios.cientificos@igme.es"
                  className="sidebar-suggestion-btn"
                >
                  {language === "en"
                    ? "Send suggestion →"
                    : "Enviar sugerencia →"}
                </a>
              </div>
            </div>

            {/* Últimas actualizaciones */}
          </div>
          {homeConfig.novedades?.length > 0 && (
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
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {language === "en"
                    ? "Latest updates"
                    : "Últimas actualizaciones"}
                </span>
              </div>
              <div className="timeline-panel-body">
                {homeConfig.novedades.map((item, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot-col">
                      <div className="timeline-dot" />
                      <div className="timeline-line" />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">
                        {item.titulo}
                        {item.nuevo && (
                          <span className="timeline-new">NUEVO</span>
                        )}
                      </div>
                      {item.fecha && (
                        <div className="timeline-date">{item.fecha}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {galleryItems.length > 0 && (
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
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {language === "en" ? "Gallery" : "Galería"}
              </span>
            </div>
            <div className="gallery-slider-wrap">
              <div className="gallery-slider" ref={sliderRef}>
                {galleryItems.map((item, index) => (
                  <button
                    key={item.image}
                    type="button"
                    className="gallery-slide-item"
                    onClick={() => setGalleryIndex(index)}
                  >
                    <img
                      className="gallery-slide-img"
                      src={withPrefix(`/img/${item.thumb}`)}
                      alt=""
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
              {galleryItems.length > 3 && (
                <>
                  <button
                    type="button"
                    className="gallery-nav-btn gallery-nav-prev"
                    onClick={() => {
                      const el = sliderRef.current
                      if (!el) return
                      const itemW = el.firstElementChild?.offsetWidth || 0
                      el.scrollBy({ left: -(itemW + 8), behavior: "smooth" })
                    }}
                    aria-label={language === "en" ? "Previous" : "Anterior"}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="gallery-nav-btn gallery-nav-next"
                    onClick={() => {
                      const el = sliderRef.current
                      if (!el) return
                      const itemW = el.firstElementChild?.offsetWidth || 0
                      el.scrollBy({ left: itemW + 8, behavior: "smooth" })
                    }}
                    aria-label={language === "en" ? "Next" : "Siguiente"}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </aside>
    )
  }

  return (
    <Layout language={language} topBackground={!selectedCategory}>
      <SEO title="Concept Schemes" keywords={["conceptSchemes"]} />

      <div
        css={pageStyles}
        style={
          selectedCategory
            ? {
                width: "100%",
                minHeight: "100%",
                padding: "0",
                boxSizing: "border-box",
                background: "white",
              }
            : {
                width: "100%",
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
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
            {/* Breadcrumb */}
            <div className="cat-breadcrumb">
              <div className="breadcrumb-path">
                <button
                  onClick={() => {
                    setSelectedCategory(null)
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

            {/* Hero + Stats — two separate panels */}
            <div className="cat-top-row">
              {/* Hero panel */}
              <div className="cat-hero-panel">
                <div className="cat-hero-text">
                  <h2 style={{ color: config.colors.skoHubDarkColor }}>
                    {getCategoryLabel(selectedCategory)}
                  </h2>
                  <p>{getCategoryDescription(selectedCategory)}</p>
                </div>
                <div className="cat-hero-logo-wrap">
                  <img
                    src={withPrefix("/img/logo-gi-carto.png")}
                    alt=""
                    className="cat-hero-logo"
                  />
                </div>
              </div>
              {/* Stats panel */}
              <div className="cat-stats-panel">
                <div className="stat-item">
                  <span className="stat-icon-bg">
                    <svg
                      className="stat-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </span>
                  <div
                    className="stat-value"
                    style={{ color: config.colors.skoHubDarkColor }}
                  >
                    {filteredSchemes.length}
                  </div>
                  <div className="stat-label">
                    {language === "en" ? "vocabularies" : "vocabularios"}
                  </div>
                </div>
                {catTerms > 0 && (
                  <div className="stat-item">
                    <span className="stat-icon-bg">
                      <svg
                        className="stat-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    </span>
                    <div
                      className="stat-date"
                      style={{ color: config.colors.skoHubDarkColor }}
                    >
                      {catTerms.toLocaleString(
                        language === "en" ? "en-GB" : "es-ES"
                      )}
                    </div>
                    <div className="stat-update-label">
                      {language === "en" ? "terms" : "términos"}
                    </div>
                  </div>
                )}
                <div className="stat-item">
                  <span className="stat-icon-bg">
                    <svg
                      className="stat-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </span>
                  <div
                    className="stat-value"
                    style={{ color: config.colors.skoHubDarkColor }}
                  >
                    {catLanguages.length}
                  </div>
                  <div className="stat-label">
                    {language === "en" ? "languages" : "idiomas"} ·{" "}
                    {catLanguages.join(" · ")}
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon-bg">
                    <svg
                      className="stat-icon"
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
                    </svg>
                  </span>
                  <div
                    className="stat-value"
                    style={{ color: config.colors.skoHubDarkColor }}
                  >
                    3
                  </div>
                  <div className="stat-label">
                    {language === "en" ? "formats" : "formatos"}
                  </div>
                </div>
                {homeConfig.ultima_actualizacion && (
                  <div className="stat-item">
                    <span className="stat-icon-bg">
                      <svg
                        className="stat-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
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
                    </span>
                    <div className="stat-date">
                      {homeConfig.ultima_actualizacion}
                    </div>
                    <div className="stat-update-label">
                      {language === "en"
                        ? "Last\nupdate"
                        : "Última actualización"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3-column: Filters | List | Sidebar */}
            <div className="cat-content-grid">
              {/* Left: Filters */}
              <div className="cat-filters-col">
                <div className="filter-header">
                  <span className="filter-title">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    {language === "en" ? "Filters" : "Filtros"}
                  </span>
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
                <div className="filter-search">
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
                      ? "Vocabulary name"
                      : "Nombre vocabulario"}
                  </div>
                  <div style={{ position: "relative" }}>
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

              {/* Center: Vocab list */}
              <div className="vocab-list">
                {displayedSchemes.map((cs) => (
                  <div
                    key={cs.id}
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
                    <div className="vocab-card-thumb">
                      <VocabIcon vocabId={cs.id} colors={config.colors} />
                    </div>
                    <div className="vocab-card-body">
                      <span className="vocab-title-link">{getTitle(cs)}</span>
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
                      </div>
                    </div>
                    <div className="vocab-card-dl-col">
                      {[
                        { label: "TTL", ext: "ttl" },
                        { label: "RDF/XML", ext: "rdf" },
                        { label: "JSON-LD", ext: "jsonld" },
                      ].map(({ label, ext }) => {
                        const slug = cs.id.split("/").pop()
                        return (
                          <a
                            key={ext}
                            className="vocab-download-link"
                            href={`${
                              customDomain || "/"
                            }downloads/${slug}.${ext}`}
                            download
                            onClick={(e) => e.stopPropagation()}
                          >
                            {label}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Sidebar */}
              <div className="cat-sidebar-col">
                {/* Explora Vocabularios */}
                {conceptSchemes.length > 0 &&
                  exploreCs &&
                  (() => {
                    const W = 280,
                      H = 148,
                      cx = 140,
                      cy = 74
                    const τ = Math.PI * 2,
                      cos = Math.cos,
                      sin = Math.sin
                    const lp = {
                      stroke: "rgb(210,90,70)",
                      strokeWidth: "1.2",
                      opacity: "0.5",
                    }
                    const C = {
                      d: "rgb(155,35,35)",
                      m: "rgb(200,85,65)",
                      ml: "rgb(232,148,128)",
                      l: "rgb(248,205,193)",
                      s: "rgb(250,220,215)",
                    }
                    const FORCE_SLIDE_INDEX = 1

                    // Slide 0 — Ego
                    const eg1 = Array.from({ length: 6 }, (_, i) => ({
                      x: cx + 52 * cos((i / 6) * τ - τ / 4),
                      y: cy + 42 * sin((i / 6) * τ - τ / 4),
                    }))
                    const eg2 = Array.from({ length: 5 }, (_, i) => ({
                      x: cx + 80 * cos(((i + 0.4) / 5) * τ - τ / 4),
                      y: cy + 60 * sin(((i + 0.4) / 5) * τ - τ / 4),
                      pi: Math.floor((i * 6) / 5),
                    }))

                    // Slide 1 — Fuerza
                    const FN = [
                      { x: 140, y: 74, r: 13 },
                      { x: 88, y: 34, r: 8 },
                      { x: 200, y: 30, r: 8 },
                      { x: 62, y: 90, r: 8 },
                      { x: 220, y: 97, r: 8 },
                      { x: 140, y: 14, r: 8 },
                      { x: 105, y: 120, r: 7 },
                      { x: 178, y: 126, r: 7 },
                      { x: 52, y: 46, r: 6 },
                      { x: 235, y: 52, r: 6 },
                      { x: 38, y: 122, r: 5 },
                      { x: 248, y: 118, r: 5 },
                    ]
                    const FC = [
                      C.d,
                      C.m,
                      C.m,
                      C.m,
                      C.m,
                      C.m,
                      C.ml,
                      C.ml,
                      C.ml,
                      C.ml,
                      C.l,
                      C.l,
                    ]
                    const FE = [
                      [0, 1],
                      [0, 2],
                      [0, 3],
                      [0, 4],
                      [0, 5],
                      [1, 8],
                      [2, 9],
                      [3, 10],
                      [4, 11],
                      [1, 6],
                      [4, 7],
                    ]

                    // Slide 2 — Árbol-H
                    const TN = [
                      { x: 14, y: 74, r: 11 },
                      { x: 88, y: 26, r: 8 },
                      { x: 88, y: 74, r: 8 },
                      { x: 88, y: 122, r: 8 },
                      { x: 163, y: 12, r: 6 },
                      { x: 163, y: 36, r: 6 },
                      { x: 163, y: 70, r: 6 },
                      { x: 163, y: 100, r: 6 },
                      { x: 163, y: 130, r: 6 },
                      { x: 236, y: 8, r: 5 },
                      { x: 236, y: 22, r: 5 },
                      { x: 236, y: 38, r: 5 },
                      { x: 236, y: 56, r: 5 },
                      { x: 236, y: 74, r: 5 },
                      { x: 236, y: 92, r: 5 },
                      { x: 236, y: 110, r: 5 },
                      { x: 236, y: 130, r: 5 },
                    ]
                    const TC = [
                      C.d,
                      C.m,
                      C.m,
                      C.m,
                      C.ml,
                      C.ml,
                      C.ml,
                      C.ml,
                      C.ml,
                      C.l,
                      C.l,
                      C.l,
                      C.l,
                      C.l,
                      C.l,
                      C.l,
                      C.l,
                    ]
                    const TE = [
                      [0, 1],
                      [0, 2],
                      [0, 3],
                      [1, 4],
                      [1, 5],
                      [2, 6],
                      [2, 7],
                      [3, 8],
                      [4, 9],
                      [5, 10],
                      [5, 11],
                      [6, 12],
                      [6, 13],
                      [7, 14],
                      [8, 15],
                      [8, 16],
                    ]

                    // Slide 3 — Sunburst (arcs)
                    const arcPath = (r1, r2, a1, a2) => {
                      const g = 0.06,
                        la = a2 - a1 > Math.PI ? 1 : 0
                      const [pa1, pa2] = [a1 + g, a2 - g]
                      const x1 = cx + r1 * cos(pa1),
                        y1 = cy + r1 * sin(pa1),
                        x2 = cx + r1 * cos(pa2),
                        y2 = cy + r1 * sin(pa2)
                      const x3 = cx + r2 * cos(pa2),
                        y3 = cy + r2 * sin(pa2),
                        x4 = cx + r2 * cos(pa1),
                        y4 = cy + r2 * sin(pa1)
                      return `M${x1.toFixed(1)},${y1.toFixed(
                        1
                      )} A${r1},${r1} 0 ${la} 1 ${x2.toFixed(1)},${y2.toFixed(
                        1
                      )} L${x3.toFixed(1)},${y3.toFixed(
                        1
                      )} A${r2},${r2} 0 ${la} 0 ${x4.toFixed(1)},${y4.toFixed(
                        1
                      )}Z`
                    }
                    const SB_R1C = [C.d, "rgb(175,45,45)", "rgb(165,38,38)"]
                    const SB_R2C = [
                      C.m,
                      "rgb(210,95,75)",
                      C.m,
                      "rgb(210,95,75)",
                      C.m,
                      "rgb(210,95,75)",
                    ]
                    const SB_R3C = [
                      C.ml,
                      C.l,
                      C.ml,
                      C.l,
                      C.ml,
                      C.l,
                      C.ml,
                      C.l,
                      C.ml,
                    ]

                    const slideContent = [
                      // 0 Ego
                      <g key="ego">
                        {eg1.map((n, i) => (
                          <line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={n.x}
                            y2={n.y}
                            {...lp}
                          />
                        ))}
                        {eg2.map((n, i) => (
                          <line
                            key={i}
                            x1={eg1[n.pi % 6].x}
                            y1={eg1[n.pi % 6].y}
                            x2={n.x}
                            y2={n.y}
                            {...lp}
                            opacity="0.32"
                          />
                        ))}
                        {eg2.map((n, i) => (
                          <circle key={i} cx={n.x} cy={n.y} r={4} fill={C.l} />
                        ))}
                        {eg1.map((n, i) => (
                          <circle key={i} cx={n.x} cy={n.y} r={7} fill={C.m} />
                        ))}
                        <circle cx={cx} cy={cy} r={15} fill={C.d} />
                      </g>,
                      // 1 Fuerza
                      <g key="force">
                        {FE.map(([a, b], i) => (
                          <line
                            key={i}
                            x1={FN[a].x}
                            y1={FN[a].y}
                            x2={FN[b].x}
                            y2={FN[b].y}
                            {...lp}
                          />
                        ))}
                        {FN.map((n, i) => (
                          <circle
                            key={i}
                            cx={n.x}
                            cy={n.y}
                            r={n.r}
                            fill={FC[i]}
                          />
                        ))}
                      </g>,
                      // 2 Árbol-H
                      <g key="tree">
                        {TE.map(([a, b], i) => (
                          <line
                            key={i}
                            x1={TN[a].x}
                            y1={TN[a].y}
                            x2={TN[b].x}
                            y2={TN[b].y}
                            {...lp}
                          />
                        ))}
                        {TN.map((n, i) => (
                          <circle
                            key={i}
                            cx={n.x}
                            cy={n.y}
                            r={n.r}
                            fill={TC[i]}
                          />
                        ))}
                      </g>,
                      // 3 Sunburst
                      <g key="sunburst">
                        <circle cx={cx} cy={cy} r={17} fill={C.d} />
                        {SB_R1C.map((c, i) => (
                          <path
                            key={i}
                            d={arcPath(
                              19,
                              40,
                              (i / 3) * τ - τ / 4,
                              ((i + 1) / 3) * τ - τ / 4
                            )}
                            fill={c}
                          />
                        ))}
                        {SB_R2C.map((c, i) => (
                          <path
                            key={i}
                            d={arcPath(
                              42,
                              63,
                              (i / 6) * τ - τ / 4,
                              ((i + 1) / 6) * τ - τ / 4
                            )}
                            fill={c}
                          />
                        ))}
                        {SB_R3C.map((c, i) => (
                          <path
                            key={i}
                            d={arcPath(
                              65,
                              82,
                              (i / 9) * τ - τ / 4,
                              ((i + 1) / 9) * τ - τ / 4
                            )}
                            fill={c}
                          />
                        ))}
                      </g>,
                    ]

                    return (
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
                        </div>
                        <div
                          className="explore-graph-area"
                          onClick={() => setGraphVocab(exploreCs)}
                        >
                          <svg
                            width={W}
                            height={H}
                            viewBox={`0 0 ${W} ${H}`}
                            style={{
                              width: "100%",
                              height: "auto",
                              display: "block",
                            }}
                          >
                            {slideContent[FORCE_SLIDE_INDEX]}
                          </svg>
                          <div className="explore-overlay">
                            <span className="explore-overlay-btn">
                              {language === "en"
                                ? "Open graph →"
                                : "Ver grafo →"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                {/* Últimas actualizaciones — timeline */}
                {homeConfig.novedades?.length > 0 && (
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
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {language === "en"
                          ? "Latest updates"
                          : "Últimas actualizaciones"}
                      </span>
                    </div>
                    <div className="timeline-panel-body">
                      {homeConfig.novedades.map((item, i) => (
                        <div key={i} className="timeline-item">
                          <div className="timeline-dot-col">
                            <div className="timeline-dot" />
                            <div className="timeline-line" />
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-title">
                              {item.titulo}
                              {item.nuevo && (
                                <span className="timeline-new">NUEVO</span>
                              )}
                            </div>
                            <div className="timeline-date">{item.fecha}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Destacados */}
                {homeConfig.destacados?.length > 0 && (
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
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {language === "en"
                          ? "Featured"
                          : "Vocabularios destacados"}
                      </span>
                    </div>
                    <div className="sidebar-panel-body">
                      {homeConfig.destacados.map((item, i) => {
                        const matched = conceptSchemes.find((cs) => {
                          const t =
                            cs.title?.[language] ||
                            cs.title?.es ||
                            cs.title?.en ||
                            cs.prefLabel?.[language] ||
                            cs.prefLabel?.es ||
                            cs.prefLabel?.en ||
                            ""
                          return t.toLowerCase() === item.titulo.toLowerCase()
                        })
                        return matched ? (
                          <a
                            key={i}
                            className="sidebar-item-link"
                            href={getFilePath(
                              matched.id,
                              "html",
                              config.customDomain
                            )}
                            onClick={() =>
                              updateState({
                                ...data,
                                conceptSchemeLanguages: [...matched.languages],
                                currentScheme: matched,
                                selectedLanguage: matched.languages.includes(
                                  language
                                )
                                  ? language
                                  : matched.languages[0],
                              })
                            }
                          >
                            <div className="item-info">
                              <span
                                className="badge-destacado"
                                style={{ marginRight: "8px" }}
                              >
                                ★
                              </span>
                              <span className="item-title">{item.titulo}</span>
                            </div>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{
                                color: "rgb(130,110,90)",
                                flexShrink: 0,
                              }}
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </a>
                        ) : (
                          <div key={i} className="sidebar-item">
                            <span className="badge-destacado">★</span>
                            <span className="item-title">{item.titulo}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ══════════════════════════════════════
           HOME PAGE — 2-column grid
        ══════════════════════════════════════ */
          <>
            <div className="home-top-band">
              <div className="hero">
                <div className="hero-text">
                  <h1 style={{ color: config.colors.skoHubDarkColor }}>
                    {config.title || "Repositorio de Vocabularios"}
                  </h1>
                  {homeConfig.subtitle && (
                    <h2 style={{ color: config.colors.skoHubDarkColor }}>
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
                    <div className="stats-bar">
                      <div className="stat-item">
                        <span className="stat-icon-bg">
                          <svg
                            className="stat-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                        </span>
                        <div
                          className="stat-value"
                          style={{ color: config.colors.skoHubDarkColor }}
                        >
                          {conceptSchemes.length}
                        </div>
                        <div className="stat-label">
                          {language === "en" ? "vocabularies" : "vocabularios"}
                        </div>
                      </div>
                      {totalTerms > 0 && (
                        <div className="stat-item">
                          <span className="stat-icon-bg">
                            <svg
                              className="stat-icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="8" y1="6" x2="21" y2="6" />
                              <line x1="8" y1="12" x2="21" y2="12" />
                              <line x1="8" y1="18" x2="21" y2="18" />
                              <line x1="3" y1="6" x2="3.01" y2="6" />
                              <line x1="3" y1="12" x2="3.01" y2="12" />
                              <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                          </span>
                          <div
                            className="stat-value"
                            style={{ color: config.colors.skoHubDarkColor }}
                          >
                            {totalTerms.toLocaleString(
                              language === "en" ? "en-GB" : "es-ES"
                            )}
                          </div>
                          <div className="stat-label">
                            {language === "en" ? "terms" : "términos"}
                          </div>
                        </div>
                      )}
                      <div className="stat-item">
                        <span className="stat-icon-bg">
                          <svg
                            className="stat-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        </span>
                        <div
                          className="stat-value"
                          style={{ color: config.colors.skoHubDarkColor }}
                        >
                          {allLanguages.length}
                        </div>
                        <div>
                          <div className="stat-label">
                            {language === "en" ? "languages" : "idiomas"}
                          </div>
                          <div className="stat-label">
                            {allLanguages.join(" · ")}
                          </div>
                        </div>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon-bg">
                          <svg
                            className="stat-icon"
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
                          </svg>
                        </span>
                        <div
                          className="stat-value"
                          style={{ color: config.colors.skoHubDarkColor }}
                        >
                          3
                        </div>
                        <div className="stat-label">
                          {language === "en" ? "formats" : "formatos"}
                        </div>
                      </div>
                      {(lastModified || homeConfig.ultima_actualizacion) && (
                        <div className="stat-item">
                          <span className="stat-icon-bg">
                            <svg
                              className="stat-icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
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
                          </span>
                          <span className="stat-date">
                            {lastModified || homeConfig.ultima_actualizacion}
                          </span>
                          <span className="stat-update-label">
                            {language === "en"
                              ? "Last update"
                              : "Última actualización"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="page-grid"
              style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
            >
              {/* ── Columna principal ── */}
              <div className="main-col">
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
                  <div className="cat-panel">
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
                              navigate("/", { state: { category: code } })
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
                  </div>
                )}

                {/* Recursos Destacados */}
                {!selectedCategory && homeConfig.enlaces?.length > 0 && (
                  <div className="recursos-destacados">
                    <div className="recursos-header">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {language === "en"
                        ? "Featured Resources"
                        : "Recursos Destacados"}
                    </div>
                    <div className="recursos-grid">
                      {homeConfig.enlaces.map((item, i) => {
                        const logo = getResourceLogo(item)
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
                                <div className="recurso-desc">
                                  {item.descripcion}
                                </div>
                              )}
                              <span className="recurso-link">
                                {language === "en"
                                  ? "Learn more →"
                                  : "Saber más →"}
                              </span>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Sidebar ── */}
              <Sidebar />
            </div>
          </>
        )}
        {galleryIndex !== null && galleryItems[galleryIndex] && (
          <div
            className="gallery-modal-backdrop"
            onClick={() => setGalleryIndex(null)}
          >
            <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
              {/* Title bar */}
              <div className="gallery-modal-titlebar">
                <span className="gallery-modal-title">
                  {galleryItems[galleryIndex].image}
                </span>
                <div className="gallery-modal-winctrls">
                  <button
                    type="button"
                    className="gallery-wc-btn gallery-wc-min"
                    aria-label="Minimizar"
                  >
                    ─
                  </button>
                  <button
                    type="button"
                    className="gallery-wc-btn gallery-wc-max"
                    aria-label="Maximizar"
                  >
                    □
                  </button>
                  <button
                    type="button"
                    className="gallery-wc-btn gallery-wc-close"
                    onClick={() => setGalleryIndex(null)}
                    aria-label="Cerrar"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {/* Image area */}
              <div className="gallery-modal-body">
                {galleryItems.length > 1 && (
                  <button
                    type="button"
                    className="gallery-modal-nav prev"
                    onClick={() =>
                      setGalleryIndex(
                        (index) =>
                          (index - 1 + galleryItems.length) %
                          galleryItems.length
                      )
                    }
                    aria-label="Anterior"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}
                <img
                  className="gallery-modal-img"
                  src={withPrefix(`/img/${galleryItems[galleryIndex].image}`)}
                  alt={galleryItems[galleryIndex].title}
                />
                {galleryItems.length > 1 && (
                  <button
                    type="button"
                    className="gallery-modal-nav next"
                    onClick={() =>
                      setGalleryIndex(
                        (index) => (index + 1) % galleryItems.length
                      )
                    }
                    aria-label="Siguiente"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
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

export default IndexPage
