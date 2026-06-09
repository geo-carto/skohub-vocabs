export const recursosStyles = `
  .recursos-destacados {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: none;
    height: auto;
  }

  .recursos-destacados .recursos-header {
    margin-bottom: 30px;
  }

  .recursos-destacados .recursos-grid {
    padding-bottom: 10px;
  }

  .recursos-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    background: transparent;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .recurso-card {
    display: grid;
    grid-template-columns: 96px 1fr;
    align-items: center;
    gap: 14px;
    min-height: 150px;
    padding: 22px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: none;
    border-right: none;
    border-bottom: none;
    text-decoration: none;
    color: inherit;
    text-align: left;
    transition: background 0.15s, transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-7px);
      box-shadow: 0 8px 24px rgba(35, 15, 5, 0.1);
    }

    &:last-child {
      border-right: none;
    }

    @media (max-width: 1100px) {
      border-bottom: none;

      &:nth-child(2n) {
        border-right: none;
      }
    }

    @media (max-width: 640px) {
      grid-template-columns: 96px 1fr;
      border-right: none;
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
    max-height: 88px;
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
      font-size: 21px;
      font-weight: 700;
      line-height: 1.3;
      color: rgb(35, 15, 5);
      margin: 0 0 4px;
    }

    .recurso-desc {
      font-size: 16px;
      line-height: 1.5;
      color: rgb(80, 60, 40);
      margin: 0 0 8px;
    }

    .recurso-link {
      font-size: 16px;
      color: rgb(196, 95, 40);
      font-weight: 600;
    }
  }
`
