export const novedadesStyles = `
  .home-updates-wrap {
    position: relative;
  }

  .home-updates-grid {
    display: flex;
    flex-wrap: nowrap;
    gap: 28px;
    overflow-x: auto;
    padding-bottom: 20px;
    margin-bottom: -20px;
    padding-right: 20px;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    @media (max-width: 760px) {
      flex-wrap: wrap;
      overflow-x: visible;
      scroll-snap-type: none;
      padding-right: 0;
      margin-bottom: 0;
      padding-bottom: 0;
    }
  }

  .home-update-card {
    position: relative;
    flex: 1 0 calc((100% - 84px) / 4);
    display: grid;
    grid-template-rows: auto auto 1fr 190px;
    gap: 16px;
    min-height: 480px;
    padding: 22px 24px;
    border-radius: 8px;
    background: rgb(234, 234, 234);
    box-shadow: 0 4px 16px rgba(35, 15, 5, 0.10), 0 8px 10px -2px rgba(35, 15, 5, 0.08);
    scroll-snap-align: start;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-7px);
      box-shadow: 0 8px 24px rgba(35, 15, 5, 0.1);
    }

    @media (max-width: 1100px) {
      flex-basis: calc((100% - 18px) / 2);
    }

    @media (max-width: 760px) {
      flex: 0 0 100% !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  }

  .home-update-date {
    font-size: 19px;
    font-weight: 700;
    color: rgb(168, 78, 28);
  }

  .home-update-title {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.25;
    color: rgb(35, 15, 5);
  }

  .home-update-desc {
    font-size: 16px;
    line-height: 1.55;
    color: rgb(80, 60, 40);
    margin: 0;
    min-height: 120px;
  }

  .home-update-new {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: white;
    background: rgb(45, 140, 80);
    border-radius: 999px;
    padding: 3px 8px;
  }

  .home-update-img {
    width: auto;
    max-width: 100%;
    height: auto;
    max-height: 185px;
    object-fit: contain;
    object-position: center;
    margin-top: 0;
    align-self: center;
    justify-self: center;
    display: block;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(35, 15, 5, 0.18);
  }

  .nov-section .home-section-title,
  .nov-section .section-subtitle {
    color: white;
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
`
