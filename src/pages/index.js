import React, { useEffect, useState } from "react"
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
    gap: 24px;
    align-items: stretch;
    padding-top: 12px;
    padding-bottom: 40px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  /* ── Hero ── */
  .hero {
    background: rgb(244, 244, 244);
    background-size: cover;
    background-position: center;
    border-radius: 12px;
    padding: 40px 36px;
    margin-bottom: 14px;
    height: 310px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;

    @media (max-width: 640px) {
      height: auto;
      padding: 24px 20px;
    }
  }

  .hero-text {
    max-width: 66%;

    @media (max-width: 640px) {
      max-width: 100%;
    }

    h1 {
      font-size: 58px;
      font-weight: 700;
      line-height: 1.1;
      margin: 0 0 16px 0;
    }

    h2 {
      font-size: 26px;
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
    border: 1px solid rgb(220, 205, 185);
    border-radius: 10px;
    overflow: hidden;
    background: rgb(255, 255, 255);

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

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    border-right: 1px solid rgb(220, 205, 185);

    &:last-child {
      border-right: none;
    }

    .stat-icon-bg {
      flex-shrink: 0;
      width: 52px;
      height: 52px;
      min-width: 52px;
      border-radius: 50%;
      background: rgb(235, 215, 190);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon {
      width: 28px;
      height: 28px;
      color: rgb(35, 15, 5);
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

  .cat-card {
    display: flex;
    align-items: stretch;
    background: rgb(255, 255, 255);
    border: 1px solid rgb(220, 205, 185);
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    text-align: left;
    font-family: inherit;
    width: 100%;

    &:hover {
      border-color: rgb(196, 95, 40);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 640px) {
      flex-direction: column;
    }
  }

  .cat-card-img {
    width: 220px;
    min-width: 220px;
    height: auto;
    display: block;

    @media (max-width: 640px) {
      width: 100%;
      min-width: unset;
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
    font-size: 34px;
    font-weight: 700;
    margin: 0;
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
    border: 1px solid rgb(220, 205, 185);
    border-radius: 8px;
    overflow: hidden;
    transition:
      box-shadow 0.2s,
      border-color 0.2s;
    min-height: 100px;
    background: rgb(255, 255, 255);

    &:hover {
      border-color: rgb(196, 95, 40);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
    display: flex;
    flex-direction: column;
    gap: 14px;
    justify-content: flex-start;

    @media (max-width: 900px) {
      display: none;
    }
  }

  /* Carousel */
  .carousel-panel {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    height: 310px;

    .carousel-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: opacity 0.5s ease;
    }

    .carousel-dots {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 6px;

      button {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: none;
        padding: 0;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.5);
        transition: background 0.2s;

        &.active {
          background: white;
        }
      }
    }

    .carousel-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.7);
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: rgb(35, 15, 5);
      padding: 0;

      &:hover {
        background: white;
      }
      &.prev {
        left: 8px;
      }
      &.next {
        right: 8px;
      }
    }
  }

  .sidebar-panel {
    background: white;
    border: 1px solid rgb(220, 205, 185);
    border-radius: 8px;
    overflow: hidden;
  }

  .sidebar-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgb(244, 244, 244);
    border-bottom: 1px solid rgb(220, 205, 185);

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
      font-size: 12px;
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
    padding: 8px 12px;
    font-size: 15px;
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
    padding: 10px 12px;
    font-size: 15px;

    p {
      margin: 0 0 10px 0;
      color: rgb(80, 60, 40);
      line-height: 1.4;
    }
  }

  .sidebar-suggestion-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
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
    border: 1px solid rgb(220, 205, 185);
    border-radius: 12px;
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
    border: 1px solid rgb(220, 205, 185);
    border-radius: 12px;
    overflow: hidden;
    background: white;
    display: flex;
    align-items: stretch;

    .stat-item {
      flex: 1;
      padding: 10px 14px;
      border-right: 1px solid rgb(220, 205, 185);
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
    padding: 10px 12px;
  }

  .timeline-item {
    display: flex;
    gap: 10px;
    padding-bottom: 14px;

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
    border: 1px solid rgb(220, 205, 185);
    border-radius: 8px;
    overflow: hidden;
  }

  .filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgb(244, 244, 244);
    border-bottom: 1px solid rgb(220, 205, 185);

    .filter-title {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
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
    border-bottom: 1px solid rgb(220, 205, 185);
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
    border-bottom: 1px solid rgb(220, 205, 185);
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
    border: 1px solid rgb(220, 205, 185);
    border-radius: 8px;
    overflow: hidden;
    background: white;
    transition:
      box-shadow 0.2s,
      border-color 0.2s;
    cursor: pointer;

    &:hover {
      border-color: rgb(196, 95, 40);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
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
    border-right: 1px solid rgb(220, 205, 185);
  }

  .vocab-card-body {
    flex: 1;
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
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
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    background: rgba(255, 248, 240, 0.35);
  }

  .explore-overlay-btn {
    background: rgb(196, 95, 40);
    color: white;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    padding: 5px 14px;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
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
  const [exploreSlide, setExploreSlide] = useState(0)

  const { data, updateState } = useSkoHubContext()
  const { config } = getConfigAndConceptSchemes()
  const customDomain = config.customDomain
  const homeConfig = config?.home || {}
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
      const res = await fetch("index.json")
      const csData = await res.json()
      const schemes = normalizeConceptSchemes(csData)
      setConceptSchemes(schemes)
      const languages = Array.from(
        new Set(schemes.flatMap((cs) => cs.languages || []))
      )
      updateState({ ...data, languages: languages, indexPage: true })
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
    if (conceptSchemes.length > 0 && !exploreCs) {
      const found = conceptSchemes.find((cs) => {
        const t =
          cs.title?.es ||
          cs.title?.en ||
          cs.prefLabel?.es ||
          cs.prefLabel?.en ||
          ""
        return t.toLowerCase().includes("unidad geol")
      })
      setExploreCs(found || conceptSchemes[0])
    }
  }, [conceptSchemes.length])

  useEffect(() => {
    const timer = setInterval(() => setExploreSlide((i) => (i + 1) % 4), 3500)
    return () => clearInterval(timer)
  }, [])

  const getTitle = (cs) =>
    i18n(language)(cs?.title || cs?.prefLabel || cs?.dc_title) || cs.id

  const schemeOptions = conceptSchemes.map((cs) => ({
    id: cs.id,
    label: getTitle(cs),
  }))

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
      return sortBy === "za" ? tB.localeCompare(tA) : tA.localeCompare(tB)
    })

  const Sidebar = () => {
    const slides = homeConfig.carrusel || []
    const [slideIdx, setSlideIdx] = React.useState(0)

    React.useEffect(() => {
      if (slides.length <= 1) return
      const timer = setInterval(() => {
        setSlideIdx((i) => (i + 1) % slides.length)
      }, 5000)
      return () => clearInterval(timer)
    }, [slides.length])

    return (
      <aside className="sidebar">
        {/* Carrusel */}
        {slides.length > 0 && (
          <div className="carousel-panel">
            <img
              src={withPrefix(`/img/${slides[slideIdx].imagen}`)}
              alt=""
              className="carousel-img"
            />
            {slides.length > 1 && (
              <>
                <button
                  className="carousel-arrow prev"
                  onClick={() =>
                    setSlideIdx((i) => (i - 1 + slides.length) % slides.length)
                  }
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
                  className="carousel-arrow next"
                  onClick={() => setSlideIdx((i) => (i + 1) % slides.length)}
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
                <div className="carousel-dots">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      className={i === slideIdx ? "active" : ""}
                      onClick={() => setSlideIdx(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
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
            <p>
              {language === "en"
                ? "Your feedback helps us improve the repository."
                : "Tu opinión nos ayuda a mejorar el repositorio."}
            </p>
            <a
              href="mailto:vocabularios.cientificos@igme.es"
              className="sidebar-suggestion-btn"
            >
              {language === "en" ? "Send suggestion →" : "Enviar sugerencia →"}
            </a>
          </div>
        </div>

        {/* Últimas actualizaciones */}
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

        {/* Enlaces */}
        {homeConfig.enlaces?.length > 0 && (
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
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {language === "en" ? "Related Links" : "Enlaces Relacionados"}
              </span>
            </div>
            <div className="sidebar-panel-body">
              {homeConfig.enlaces.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  className="sidebar-item-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span
                    className="item-title"
                    style={{ color: "rgb(196,95,40)" }}
                  >
                    {item.titulo}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ minWidth: 12, color: "rgb(130,110,90)" }}
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </aside>
    )
  }

  return (
    <Layout language={language}>
      <SEO title="Concept Schemes" keywords={["conceptSchemes"]} />

      <div
        css={pageStyles}
        style={{ width: "100%", padding: "0", boxSizing: "border-box" }}
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
                      className="stat-value"
                      style={{ color: config.colors.skoHubDarkColor }}
                    >
                      {catTerms.toLocaleString(
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
                    <div
                      className="stat-value"
                      style={{
                        color: config.colors.skoHubDarkColor,
                        fontSize: "15px",
                      }}
                    >
                      {homeConfig.ultima_actualizacion}
                    </div>
                    <div className="stat-label">
                      {language === "en"
                        ? "Last update"
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
                            href={`${
                              customDomain || "/"
                            }downloads/${slug}.${ext}`}
                            download
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: "11px",
                              padding: "1px 8px",
                              borderRadius: "3px",
                              border: `1px solid ${config.colors.skoHubMiddleGrey}`,
                              color: config.colors.skoHubDarkColor,
                              textDecoration: "none",
                              background: "rgb(244,244,244)",
                              textAlign: "center",
                              whiteSpace: "nowrap",
                            }}
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
                    const SLIDE_NAMES =
                      language === "en"
                        ? ["Ego", "Force", "Tree", "Sunburst"]
                        : ["Ego", "Fuerza", "Árbol", "Sunburst"]

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
                            {slideContent[exploreSlide]}
                          </svg>
                          <div className="explore-dots">
                            {SLIDE_NAMES.map((_, i) => (
                              <button
                                key={i}
                                className={i === exploreSlide ? "active" : ""}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExploreSlide(i)
                                }}
                              />
                            ))}
                          </div>
                          <div className="explore-slide-label">
                            {SLIDE_NAMES[exploreSlide]}
                          </div>
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
          <div className="page-grid">
            {/* ── Columna principal ── */}
            <div>
              {/* Hero — solo en página de categorías */}
              {!selectedCategory && (
                <div
                  className="hero"
                  style={{
                    backgroundImage: `url(${withPrefix(
                      "/img/fondo-hero.png"
                    )})`,
                  }}
                >
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
                </div>
              )}

              {/* Stats bar */}
              {!selectedCategory && conceptSchemes.length > 0 && (
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
                      <div>
                        <div className="stat-label">
                          {language === "en"
                            ? "Last update"
                            : "Última actualización"}
                        </div>
                        <div
                          style={{
                            fontSize: "15px",
                            color: config.colors.skoHubDarkColor,
                            marginTop: "2px",
                          }}
                        >
                          {lastModified || homeConfig.ultima_actualizacion}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                        onClick={() => setSelectedCategory(code)}
                      >
                        <img
                          src={withPrefix(`/img/${cat.image}`)}
                          alt={getCategoryLabel(code)}
                          className="cat-card-img"
                        />
                        <div className="cat-card-body">
                          <h3
                            className="cat-card-title"
                            style={{ color: config.colors.skoHubDarkColor }}
                          >
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
              )}
            </div>

            {/* ── Sidebar ── */}
            <Sidebar />
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
          schemes={schemeOptions}
          onVocabChange={(id) => {
            const cs = conceptSchemes.find((c) => c.id === id)
            if (cs) setGraphVocab(cs)
          }}
        />
      )}
    </Layout>
  )
}

export default IndexPage
