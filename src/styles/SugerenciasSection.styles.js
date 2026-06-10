export const sugerenciasStyles = `
  .home-suggestion-card {
    border-radius: 0;
    overflow: hidden;
    box-shadow: none;
  }

  .sidebar-suggestion {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px minmax(340px, 1fr);
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    font-size: 15px;

    p {
      margin: 0 0 10px 0;
      color: rgb(80, 60, 40);
      line-height: 1.4;
    }

    p + p {
      display: none;
    }

    @media (max-width: 760px) {
      grid-template-columns: 1fr;
      padding: 16px;
      text-align: left;
    }
  }

  .sidebar-suggestion-img {
    width: 420px;
    height: 400px;
    object-fit: contain;
    display: block;

    @media (max-width: 760px) {
      width: min(100%, 260px);
      height: auto;
      justify-self: center;
    }
  }

  .sidebar-suggestion-content {
    min-width: 0;

    .section-subtitle {
      line-height: 1.6;
    }
  }

  .sidebar-suggestion-title {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.3;
    color: rgb(35, 15, 5);
    margin: 0 0 16px;
  }

  .sidebar-suggestion-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 19px;
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

  .suggestion-form {
    display: grid;
    gap: 8px;
    min-width: 0;

    input,
    textarea {
      width: 100%;
      border: 1px solid rgb(220, 205, 185);
      border-radius: 6px;
      background: white;
      color: rgb(35, 15, 5);
      font-family: inherit;
      font-size: 14px;
      padding: 8px 10px;

      &:focus {
        outline: none;
        border-color: rgb(196, 95, 40);
      }

      &::placeholder {
        color: rgb(150, 130, 110);
      }
    }

    textarea {
      min-height: 140px;
      resize: vertical;
    }
  }
`
