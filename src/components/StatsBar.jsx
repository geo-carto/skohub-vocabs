const StatsBar = ({
  vocabCount,
  termCount,
  languages,
  lastModified,
  language,
}) => (
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
          aria-hidden="true"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </span>
      <div className="stat-value">{vocabCount}</div>
      <div className="stat-label">
        {language === "en" ? "vocabularies" : "vocabularios"}
      </div>
    </div>

    {termCount > 0 && (
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
            aria-hidden="true"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </span>
        <div className="stat-value">
          {termCount.toLocaleString(language === "en" ? "en-GB" : "es-ES", {
            useGrouping: false,
          })}
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
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </span>
      <div className="stat-value">{languages.length}</div>
      <div className="stat-label">
        {language === "en" ? "languages" : "idiomas"} · {languages.join(" · ")}
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
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </span>
      <div className="stat-value">3</div>
      <div className="stat-label">
        {language === "en" ? "formats" : "formatos"}
      </div>
    </div>

    {lastModified && (
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
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <div className="stat-date">
          {lastModified.replace(/\b20(\d{2})\b/, "$1")}
        </div>
        <div className="stat-label">
          {language === "en" ? "updated" : "actualizado"}
        </div>
      </div>
    )}
  </div>
)

export default StatsBar
