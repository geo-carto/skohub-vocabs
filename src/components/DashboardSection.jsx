import React from "react"
import StatsBar from "./StatsBar"

const DashboardSection = ({
  vocabCount,
  termCount,
  languages,
  lastModified,
  language,
}) => {
  return (
    <section className="home-section dashboard-section">
      <div className="dashboard-stats-wrap">
        <StatsBar
          vocabCount={vocabCount}
          termCount={termCount}
          languages={languages}
          lastModified={lastModified}
          language={language}
        />
      </div>
    </section>
  )
}

export default DashboardSection
