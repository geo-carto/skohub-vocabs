import { css } from "@emotion/react"
import { novedadesStyles } from "./NovedadesSection.styles"
import { sugerenciasStyles } from "./SugerenciasSection.styles"
import { recursosStyles } from "./RecursosSection.styles"
import { statsBarStyles } from "./StatsBar.styles"
import { dashboardStyles } from "./DashboardSection.styles"

export const getPageStyles = (colors) => css`
  /* ── Hero ── */
  .home-top-band {
    margin-top: -81px;
    margin-left: -22px;
    margin-right: -22px;
    margin-bottom: 0;
    padding-top: 81px;
    min-height: calc(100vh - 30px);
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    box-sizing: border-box;
    border-bottom: 18px solid rgb(32, 42, 56);
  }

  .cat-page .home-top-band {
    margin-left: -22px;
    margin-right: -22px;
    padding-top: 0;
    height: clamp(370px, 24vw, 450px);
    min-height: 370px;
    max-height: none;
    overflow: hidden;
    background: none;
    position: relative;
  }

  .cat-hero-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center bottom;
  }

  .cat-hero-overlay {
    position: absolute !important;
    inset: 0;
    padding-top: 128px !important;
    min-height: 0 !important;
  }

  .home-scroll {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0;
    width: calc(100% + 44px);
    margin: 0 -22px -20px;
  }

  .home-section {
    width: 100%;
    padding: 50px 150px 54px 100px;
  }

  .home-section:first-child {
    padding-top: 58px;
    background-color: #e2e2e2 !important;
  }

  .home-section.nov-section {
    padding: 0 !important;
    overflow: visible;
    min-height: 0;
  }

  .nov-section .home-updates-wrap,
  .nov-section .home-updates-grid {
    width: 100% !important;
    max-width: 100% !important;
  }

  .home-section.home-suggestion-card {
    background-color: #e2e2e2 !important;
    padding-top: 90px !important;
    padding-left: 60px !important;
    padding-right: 60px !important;
  }

  .home-suggestion-card .section-title-block {
    margin-bottom: 0;
  }

  .home-section.cat-panel > .section-title-block,
  .home-section.home-suggestion-card > .section-title-block,
  .home-section.cat-panel .section-title-text,
  .home-section.home-suggestion-card .section-title-text,
  .home-section.cat-panel .home-section-title,
  .home-section.home-suggestion-card .home-section-title,
  .home-section.cat-panel .section-subtitle,
  .home-section.home-suggestion-card .section-subtitle {
    text-align: left;
    align-items: flex-start;
  }

  .home-section.cat-panel .section-subtitle {
    max-width: none;
  }

  .home-section.nov-section .section-subtitle,
  .home-section.recursos-destacados .section-subtitle {
    max-width: none;
  }

  .nov-panel-inner {
    display: flex;
    align-items: stretch;
    width: 100%;
  }

  .nov-panel-content {
    flex: 1;
    min-width: 0;
    max-width: 100%;
    padding: 68px 150px 100px 150px;
    display: flex;
    flex-direction: column;
  }

  .home-section.content-right > .section-title-block,
  .home-section.content-right > .home-updates-wrap,
  .home-section.content-right > .home-updates-grid,
  .home-section.content-right > .recursos-grid,
  .home-section.content-right > .sidebar-suggestion {
    margin-left: auto;
    margin-right: 0;
  }

  .home-section.content-left > .section-title-block,
  .home-section.content-left > .home-updates-wrap,
  .home-section.content-left > .home-updates-grid,
  .home-section.content-left > .recursos-grid,
  .home-section.content-left > .sidebar-suggestion {
    margin-left: 0;
    margin-right: auto;
  }

  .home-section.cat-panel,
  .home-section.recursos-destacados {
    border-radius: 0;
    overflow: visible;
  }

  .home-section.recursos-destacados {
    padding-top: 90px !important;
    padding-left: 150px !important;
    padding-right: 150px !important;
    background-color: transparent !important;
  }

  .home-section.recursos-destacados > .recursos-grid {
    width: 100% !important;
    max-width: 100% !important;
  }

  .home-section.cat-panel {
    padding-top: 80px !important;
    padding-bottom: 140px !important;
    padding-left: 60px !important;
    padding-right: 60px !important;
    min-height: calc(100vh - 390px);
    box-sizing: border-box;
    background-color: #e2e2e2 !important;
  }

  .home-section .cat-list {
    background: transparent !important;
    padding: 0 !important;
  }

  .home-section .cat-card {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  }

  .home-section:nth-child(odd) {
    background: white;
  }

  .home-section:nth-child(even) {
    background: rgb(241, 242, 243);
  }

  .home-section > .section-title-block,
  .home-section > .cat-list,
  .home-section > .home-updates-wrap,
  .home-section > .home-updates-grid,
  .home-section > .recursos-grid,
  .home-section > .gallery-slider-wrap,
  .home-section > .sidebar-suggestion,
  .home-section > .cat-section-content {
    width: min(75vw, 1180px);
    max-width: calc(100vw - 44px);
    margin-left: auto;
    margin-right: auto;
  }

  .home-section.home-suggestion-card > .section-title-block,
  .home-section.home-suggestion-card > .sidebar-suggestion {
    width: min(75vw, 1180px);
    max-width: calc(100vw - 120px);
  }

  .section-title-block {
    display: flex;
    align-items: flex-end;
    gap: 20px;
    margin-bottom: 52px;
  }

  .section-title-icon-wrap {
    display: none;
  }

  .nov-section .section-title-icon-wrap {
    background: rgb(240, 240, 240);
  }

  .section-title-text {
    display: flex;
    flex-direction: column;
  }

  .section-subtitle {
    font-size: 19px;
    line-height: 1.6;
    color: rgb(80, 60, 40);
    margin: 42px 0 0 0;
    max-width: 620px;
  }

  .section-eyebrow {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgb(196, 95, 40);
    margin-bottom: 1px;
  }

  .section-title-text .home-section-title,
  .section-title-text > div > .home-section-title,
  .section-title-text > h2,
  .section-title-text > div > h2 {
    padding: 0;
    margin: 0;
    background: transparent;
    border-bottom: none;
    font-size: 54px;
    line-height: 1.15;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
    color: rgb(20, 10, 0);
  }

  @media (max-width: 1100px) {
    .home-section > .section-title-block,
    .home-section > .cat-list,
    .home-section > .home-updates-wrap,
    .home-section > .home-updates-grid,
    .home-section > .recursos-grid,
    .home-section > .gallery-slider-wrap,
    .home-section > .sidebar-suggestion,
    .home-section > .cat-section-content {
      width: min(88vw, 980px);
    }
  }

  @media (max-width: 1024px) {
    .home-section.cat-panel {
      padding-left: 40px !important;
      padding-right: 40px !important;
    }

    .home-section.recursos-destacados {
      padding-left: 40px !important;
      padding-right: 40px !important;
    }

    .nov-panel-content {
      padding: 50px 40px 80px 40px;
    }

    .home-section.home-suggestion-card {
      padding-left: 40px !important;
      padding-right: 40px !important;
    }

    /* Cat cards */
    .cat-card-body {
      padding: 36px 16px 20px;
    }
    .cat-card-title {
      font-size: 28px;
    }

    /* Novedades: 3 tarjetas por fila en tablet */
    .home-update-card {
      flex: 0 0 calc((100% - 56px) / 3) !important;
    }

    /* Dashboard: wrap stats y más espacio */
    .dashboard-stats-wrap {
      width: 100% !important;
      max-width: 100% !important;
    }

    .dashboard-section .stats-bar {
      flex-wrap: wrap;
    }

    .dashboard-section .stat-item {
      flex: 1 1 auto;
      min-width: 160px;
    }
  }

  @media (max-width: 760px) {
    .home-section {
      padding: 34px 14px 40px;
    }

    .home-section > .section-title-block,
    .home-section > .cat-list,
    .home-section > .home-updates-wrap,
    .home-section > .home-updates-grid,
    .home-section > .recursos-grid,
    .home-section > .gallery-slider-wrap,
    .home-section > .sidebar-suggestion,
    .home-section > .cat-section-content {
      width: 100%;
      max-width: none;
    }

    .section-title-text .home-section-title,
    .section-title-text > div > .home-section-title,
    .section-title-text > h2,
    .section-title-text > div > h2 {
      font-size: 34px;
    }

    /* Hero text */
    .hero-text h2 {
      font-size: 28px !important;
    }
    .hero-text p {
      font-size: 16px !important;
      line-height: 1.65 !important;
    }
    .hero-stats-col {
      display: none;
    }

    /* Sections: quitar paddings horizontales grandes */
    .home-section.cat-panel {
      padding-left: 20px !important;
      padding-right: 20px !important;
      padding-top: 40px !important;
      padding-bottom: 60px !important;
    }

    .home-section.recursos-destacados {
      padding-left: 20px !important;
      padding-right: 20px !important;
    }

    .nov-panel-content {
      padding: 40px 20px 60px 20px !important;
    }

    .home-section.home-suggestion-card {
      padding-left: 20px !important;
      padding-right: 20px !important;
    }

    /* Category cards */
    .cat-list {
      gap: 20px;
    }

    .cat-card,
    .cat-list .cat-card:first-child {
      flex-direction: column !important;
    }

    .cat-card::after,
    .cat-list .cat-card:first-child::after {
      display: none;
    }

    .cat-card-img {
      width: 100% !important;
      height: 160px !important;
    }

    .cat-card-body {
      padding: 20px 16px 16px;
    }
    .cat-card-title {
      font-size: 22px;
    }

    .cat-card-body > div:first-child {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .cat-card-desc,
    .cat-card-body > div:last-child {
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
  }

  /* ── Cat page sections ── */
  .home-section.cat-nav-section {
    padding-top: 14px !important;
    padding-bottom: 0 !important;
    background: #e2e2e2 !important;
  }

  .home-section.cat-panels-section {
    padding-top: 8px !important;
    padding-bottom: 18px !important;
    background: #e2e2e2 !important;
  }

  .home-section.cat-explore-section {
    padding-top: 10px !important;
    padding-bottom: 14px !important;
    background: white !important;
  }

  .home-section.cat-filters-section {
    padding-top: 10px !important;
    padding-bottom: 14px !important;
    background: rgb(241, 242, 243) !important;
  }

  .cat-panels-row {
    display: flex;
    flex-direction: column;
    gap: 18px;
    align-items: flex-start;

    @media (max-width: 760px) {
      flex-direction: column;
    }

    > .cat-filters-col,
    > .cat-sidebar-col {
      flex: 1;
      min-width: 0;
    }
  }

  .cat-filters-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .home-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgb(35, 15, 5);
  }

  .hero {
    background: transparent;
    border-radius: 0;
    box-shadow: none;
    padding: calc((100vh - 129px) / 12) 64px 60px 120px;
    min-height: calc(100vh - 129px);
    margin: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 28px;

    @media (max-width: 900px) {
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 16px;
      min-height: 60vh;
      padding: 40px 20px;
    }

    @media (max-width: 640px) {
      min-height: 50vh;
      padding: 30px 20px;
    }
  }

  .cat-page .hero {
    min-height: 0;
  }

  .hero-text {
    max-width: 35%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0;

    @media (max-width: 1400px) {
      max-width: 48%;
    }

    @media (max-width: 900px) {
      max-width: 100%;
    }

    @media (max-width: 640px) {
      max-width: 100%;
    }

    h1 {
      font-size: 112px;
      font-weight: 700;
      line-height: 1.05;
      margin: 0 0 52px 0;
      color: ${colors.skoHubDarkColor};
    }

    h2 {
      font-size: 44px;
      font-weight: 700;
      line-height: 1.35;
      margin: 0 0 30px 0;
      color: rgb(178, 84, 30);
    }

    p {
      font-size: 19px;
      line-height: 1.75;
      margin: 0;
      color: rgb(80, 60, 40);
      max-width: 100%;
      text-align: justify;
      background: rgba(242, 239, 240, 0.8);
      padding: 10px 14px 10px 0;
      border-radius: 4px;
    }

    @media (max-width: 1400px) {
      h1 {
        font-size: 80px;
      }
      h2 {
        font-size: 36px;
      }
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

  .cat-page .hero-text p {
    color: ${colors.skoHubDarkColor};
    font-size: 15px;
    text-align: left;
    max-width: 100%;
  }

  .cat-page .hero-text h1 {
    font-size: 72px;
    margin-bottom: 16px;
  }

  .cat-page .hero-text {
    max-width: 46%;
  }

  @media (max-width: 1100px) {
    .cat-page .home-top-band {
      height: 390px;
      min-height: 390px;
    }

    .cat-page .cat-hero-img {
      height: 100%;
      object-fit: cover;
      object-position: center bottom;
    }

    .cat-page .cat-hero-overlay {
      padding-top: 104px !important;
      padding-left: 40px !important;
      padding-right: 40px !important;
    }

    .cat-page .hero-text {
      max-width: 72%;
    }

    .cat-page .hero-text h1 {
      font-size: 54px;
      margin-bottom: 12px;
    }

    .cat-page .hero-text p {
      font-size: 14px;
      line-height: 1.55;
    }

    .cat-page .hero-text > div {
      gap: 12px !important;
    }

    .cat-page .hero-text > div > img {
      max-height: 112px !important;
    }
  }

  @media (max-width: 760px) {
    .cat-page .home-top-band {
      height: 430px;
      min-height: 430px;
    }

    .cat-page .cat-hero-img {
      height: 100%;
      object-fit: cover;
      object-position: center bottom;
    }

    .cat-page .cat-hero-overlay {
      padding-top: 96px !important;
      padding-left: 20px !important;
      padding-right: 20px !important;
      justify-content: flex-start;
    }

    .cat-page .hero-text {
      max-width: 100%;
    }

    .cat-page .hero-text h1 {
      font-size: 40px;
      margin-bottom: 10px;
    }

    .cat-page .hero-text > div {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 10px !important;
    }

    .cat-page .hero-text p {
      font-size: 13px !important;
      line-height: 1.5 !important;
      padding-right: 8px;
    }

    .cat-page .hero-text > div > img {
      max-height: 82px !important;
      align-self: flex-start !important;
    }
  }

  /* ── Stats ── */

  .hero-stats-col {
    flex: 1;
    min-width: 0;
    align-self: stretch;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding-right: 20px;

    .stats-bar {
      margin-bottom: 0;
      height: auto;
      width: fit-content;
      max-width: 100%;
      justify-content: center;
      flex-wrap: wrap;

      .stat-item {
        flex: 0 0 auto;
        padding: 22px 14px;
        gap: 8px;
      }
    }

    @media (max-width: 1200px) {
      .stats-bar .stat-item {
        padding: 10px 10px;
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
    gap: 52px;
  }

  .cat-panel {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: none;

    .cat-list {
      padding: 12px;
      background: white;
    }

    .cat-card {
      box-shadow: none;
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
    border-left: 3px solid rgb(196, 95, 40);
    border-radius: 0;
    overflow: hidden;
    position: relative;
    padding: 0;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    box-shadow: none;
    text-align: left;
    font-family: inherit;
    width: 100%;
    --cat-card-title-color: rgb(35, 15, 5);

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 34%;
      height: 100%;
      background: linear-gradient(to right, transparent 30%, white 100%);
      pointer-events: none;
    }

    &:hover {
      transform: translateX(7px);
      box-shadow: 0 8px 24px rgba(35, 15, 5, 0.1);
    }

    @media (max-width: 640px) {
      flex-direction: column;
    }
  }

  .cat-card-img {
    width: 34%;
    min-width: 0;
    flex-shrink: 0;
    align-self: stretch;
    min-height: 220px;
    display: block;
    object-fit: cover;
    object-position: center;
    padding: 0;

    @media (max-width: 640px) {
      width: 100%;
      height: 180px;
      min-height: 0;
      align-self: auto;
    }
  }

  .cat-card-body {
    flex: 1;
    padding: 52px 24px 36px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }

  .cat-card-title {
    font-size: 38px;
    font-weight: 700;
    margin: 0;
    color: rgb(35, 15, 5);
  }

  .cat-card-desc {
    font-size: 17px;
    line-height: 1.82;
    color: rgb(80, 60, 40);
    margin: 0;
  }

  .cat-card-count {
    display: inline-block;
    font-size: 15px;
    color: rgb(130, 110, 90);
    background: rgba(196, 95, 40, 0.12);
    border-radius: 20px;
    padding: 3px 12px;
    align-self: flex-start;
  }

  .cat-card-arrow {
    position: absolute;
    bottom: 16px;
    right: 20px;
    color: rgb(196, 95, 40);

    @media (max-width: 640px) {
      display: none;
    }
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

  /* ═══════════════════════════════════════
     CATEGORY PAGE (3-column layout)
  ═══════════════════════════════════════ */

  .cat-page {
    padding-top: 0;
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

  /* Filters column */
  .cat-filters-col {
    background: white;
    border: none;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 6px 18px rgba(35, 15, 5, 0.08);
  }

  .cat-filters-col.is-horizontal {
    width: 100%;
    box-shadow: none;
    overflow: visible;
    background: transparent;
    border-radius: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 10px;
    order: 2;
  }

  .cat-filters-col.is-horizontal .filter-header {
    flex: 1 0 100%;
    padding: 0;
    margin-bottom: -8px;
    background: transparent;
    border-bottom: none;
    justify-content: flex-end;
  }

  .cat-filters-col.is-horizontal .filter-section {
    flex: 1 1 190px;
    min-width: 172px;
    padding: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .cat-filters-col.is-horizontal .filter-section:first-of-type {
    flex-basis: 280px;
  }

  .cat-filters-col.is-horizontal .filter-label {
    min-width: 0;
    font-size: 12px;
  }

  .cat-filters-col.is-horizontal select,
  .cat-filters-col.is-horizontal .filter-search {
    width: 100%;
  }

  .cat-filters-col.is-horizontal select {
    min-width: 0;
    padding-right: 24px;
  }

  .filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
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
    flex: 1;
    padding: 0;
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
      padding: 5px 10px 5px 34px;
      font-size: 13px;
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
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .filter-section {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    border-bottom: none;
    &:last-child {
      border-bottom: none;
    }

    .filter-label {
      min-width: 100px;
    }

    select {
      flex: 1;
      min-width: 0;
      padding: 4px 28px 4px 10px;
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
      background-position: right 10px center;
      &:focus {
        outline: none;
        border-color: rgb(196, 95, 40);
      }
    }
  }

  /* Vocab cards v2 */
  .vocab-card-v2 {
    display: block;
    cursor: pointer;

    &:hover .vocab-title-link {
      color: rgb(196, 95, 40);
    }
  }

  .vocab-card-inner {
    display: flex;
    align-items: stretch;
    border-radius: 8px;
    overflow: hidden;
    background: white;
  }

  .home-section:nth-child(even) .vocab-card-inner {
    background: rgb(241, 242, 243);
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

    @media (max-width: 560px) {
      width: 100%;
      min-width: unset;
      height: 120px;
    }
  }

  @media (max-width: 560px) {
    .vocab-card-inner {
      flex-direction: column;
    }

    .home-section:nth-child(odd) .vocab-card-thumb {
      background: white;
    }
  }

  .vocab-card-body {
    flex: 1;
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;

    .vocab-title-link {
      font-size: 24px;
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
      -webkit-line-clamp: 3;
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
        gap: 3px;
        font-size: 13px;
        padding: 1px 5px;
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

    > .sidebar-panel {
      flex: 1;
      min-height: 0;
    }

    .explore-graph-area {
      flex: 1;
      min-height: 0;
    }
  }

  .cat-sidebar-col.explore-wide {
    height: auto !important;
    width: 100%;
    order: 1;
    background: #e2e2e2;
  }

  .cat-sidebar-col.explore-wide > .sidebar-panel {
    min-height: 118px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: stretch;
    background: #e2e2e2 !important;
    box-shadow: none !important;
    border-radius: 0;
    overflow: visible;
  }

  .cat-sidebar-col.explore-wide .sidebar-panel-header {
    border-bottom: none;
    border-right: none;
    background: #e2e2e2 !important;
    padding: 2px 0 2px 0;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0;
    text-align: left;
  }

  .cat-sidebar-col.explore-wide .panel-title {
    align-items: center;
    flex-direction: row;
    gap: 14px;
    font-size: 50px;
    line-height: 1.15;
    text-transform: none;
    letter-spacing: 0;
    color: rgb(178, 84, 30);
  }

  .cat-sidebar-col.explore-wide .explore-header-btn {
    align-self: flex-end;
    margin-top: 18px;
    border: none;
    border-radius: 18px;
    padding: 8px 18px;
    background: rgba(196, 95, 40, 0.92);
    color: white;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .explore-panel-desc {
    margin: 18px 0 0;
    font-size: 15px;
    line-height: 1.45;
    color: rgb(80, 60, 40);
    max-width: 620px;
  }

  .explore-copy-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    width: 100%;

    .explore-panel-desc {
      flex: 1;
    }
  }

  .cat-sidebar-col.explore-wide .explore-header-btn:hover {
    background: rgb(196, 95, 40);
  }

  .cat-sidebar-col.explore-wide .explore-graph-area {
    border-top: none;
    min-height: 72px;
    max-height: 82px;
    padding: 8px 14px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .explore-graph-img {
    height: 143px;
    width: auto;
    display: block;
    border-radius: 10px;
    border: 1px solid rgb(210, 190, 165);
  }

  .explore-image-box {
    padding: 8px 0 8px 0;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    cursor: pointer;
    overflow: hidden;
    border-radius: 0;
    position: relative;
  }

  .explore-img-label {
    position: absolute;
    top: 30px;
    left: 20px;
    z-index: 2;
    font-size: 18px;
    font-weight: 700;
    color: rgb(35, 15, 5);
    pointer-events: none;
  }

  .explore-img-sublabel {
    position: absolute;
    top: 60px;
    left: 20px;
    z-index: 2;
    font-size: 13px;
    color: rgb(80, 60, 40);
    pointer-events: none;
    max-width: 200px;
    line-height: 1.4;
  }

  .explore-img-btn {
    position: absolute;
    bottom: 18px;
    left: 20px;
    z-index: 2;
    background: rgba(196, 95, 40, 0.92);
    color: white;
    border: none;
    border-radius: 20px;
    padding: 6px 16px;
    font-size: 15px;
    font-family: inherit;
    cursor: pointer;
    font-weight: 700;

    &:hover {
      background: rgb(196, 95, 40);
    }
  }

  @media (max-width: 1100px) {
    .cat-sidebar-col.explore-wide > .sidebar-panel {
      grid-template-columns: 1fr;
      gap: 18px;
    }

    .cat-sidebar-col.explore-wide .sidebar-panel-header {
      border-right: none;
      border-bottom: none;
    }

    .explore-image-box {
      width: 100%;
      min-height: 210px;
      display: flex;
      justify-content: flex-end;
      padding: 8px 0;
      overflow: hidden;
      position: relative;
    }

    .explore-graph-img {
      width: 100%;
      height: 210px;
      max-height: none;
      object-fit: cover;
      object-position: center;
    }

    .explore-img-label,
    .explore-img-sublabel,
    .explore-img-btn {
      position: absolute;
      z-index: 2;
    }

    .explore-img-label {
      top: 28px;
      left: 20px;
      font-size: 18px;
      pointer-events: none;
    }

    .explore-img-sublabel {
      top: 58px;
      left: 20px;
      max-width: 240px;
      font-size: 13px;
      pointer-events: none;
    }

    .explore-img-btn {
      bottom: 18px;
      left: 20px;
      margin-top: 0;
      pointer-events: auto;
    }
  }

  @media (max-width: 760px) {
    .cat-sidebar-col.explore-wide > .sidebar-panel {
      grid-template-columns: 1fr;
    }

    .cat-sidebar-col.explore-wide .sidebar-panel-header {
      border-right: none;
      border-bottom: 1px solid rgb(220, 205, 185);
    }

    .explore-image-box {
      width: 100%;
      min-height: 210px;
      display: flex;
      justify-content: flex-end;
      padding: 8px 0;
      overflow: hidden;
      position: relative;
    }

    .explore-graph-img {
      width: 100%;
      height: 210px;
      max-height: none;
      object-fit: cover;
      object-position: center;
    }

    .explore-img-label,
    .explore-img-sublabel,
    .explore-img-btn {
      position: absolute;
      z-index: 2;
    }

    .explore-img-label {
      top: 28px;
      left: 20px;
      font-size: 18px;
      pointer-events: none;
    }

    .explore-img-sublabel {
      top: 58px;
      left: 20px;
      max-width: 240px;
      font-size: 13px;
      pointer-events: none;
    }

    .explore-img-btn {
      bottom: 18px;
      left: 20px;
      margin-top: 0;
      pointer-events: auto;
    }
  }

  @media (max-width: 320px) {
    .cat-sidebar-col.explore-wide .panel-title {
      font-size: 34px;
    }

    .explore-panel-desc {
      font-size: 13px;
    }

    .explore-graph-img {
      height: 190px;
    }
  }

  /* ── Recursos Destacados ── */
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

  ${novedadesStyles}
  ${sugerenciasStyles}
  ${statsBarStyles(colors)}
  ${recursosStyles}
  ${dashboardStyles}
`
