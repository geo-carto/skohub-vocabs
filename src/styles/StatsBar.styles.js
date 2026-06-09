export const statsBarStyles = (colors) => `
  .stats-bar {
    display: flex;
    gap: 0;
    margin-bottom: 14px;
    border: none;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.68);
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
        font-size: 25px;
      }
      .stat-label {
        font-size: 14px;
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
      color: ${colors.skoHubDarkColor};
    }

    .stat-label {
      font-size: 16px;
      color: rgb(105, 87, 70);
      line-height: 1.3;
    }

    .stat-date {
      font-size: 25px;
      font-weight: 700;
      color: rgb(35, 15, 5);
      line-height: 1.15;
      white-space: nowrap;
    }

    .stat-update-label {
      font-size: 14px;
      color: rgb(130, 110, 90);
      line-height: 1.2;
      white-space: nowrap;
      max-width: none;
    }

    @media (max-width: 640px) {
      flex: 1 1 50%;
      border-bottom: 1px solid rgb(220, 205, 185);
    }
  }
`
