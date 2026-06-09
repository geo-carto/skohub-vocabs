export const novedadesStyles = `
  .home-updates-wrap {
    position: relative;
  }

  .home-updates-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .home-update-card {
    position: relative;
    flex: 0 0 calc((100% - 36px) / 3);
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 280px;
    padding: 22px 24px;
    border-radius: 8px;
    background: white;
    box-shadow: none;
    scroll-snap-align: start;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-7px);
      box-shadow: 0 8px 24px rgba(35, 15, 5, 0.1);
    }

    @media (max-width: 1100px) {
      flex-basis: calc((100% - 18px) / 2);
    }

    @media (max-width: 700px) {
      flex-basis: 100%;
    }
  }

  .home-update-date {
    font-size: 17px;
    font-weight: 700;
    color: rgb(168, 78, 28);
  }

  .home-update-title {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.25;
    color: rgb(35, 15, 5);
  }

  .home-update-desc {
    font-size: 14px;
    line-height: 1.55;
    color: rgb(80, 60, 40);
    margin: 0;
  }

  .home-update-new {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: white;
    background: rgb(45, 140, 80);
    border-radius: 999px;
    padding: 3px 8px;
  }

  .home-update-img {
    width: 100%;
    height: 150px;
    object-fit: contain;
    object-position: center;
    margin-top: auto;
    display: block;
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
