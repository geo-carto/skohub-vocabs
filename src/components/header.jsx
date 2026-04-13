import React, { useEffect, useState } from "react"
import { css } from "@emotion/react"
import { Link, withPrefix } from "gatsby"
import { getFilePath } from "../common"
import { useSkoHubContext } from "../context/Context.jsx"
import { getConfigAndConceptSchemes } from "../hooks/configAndConceptSchemes"
import { getUserLang } from "../hooks/getUserLanguage"

const Header = ({ siteTitle }) => {
  const { config, conceptSchemes: conceptSchemesData } =
    getConfigAndConceptSchemes()
  const { data, updateState } = useSkoHubContext()
  const style = css`
    background: ${config.colors.skoHubWhite};

    .headerContent {
          padding: 10px 20px;
          display: flex;
          align-items: center;
        }

    .skohubLogo {
          margin: 0;
          display: inline-flex;
          align-items: center;
          width: calc(100% - 80px);

      a {
        text-decoration: none;
        color: ${config.colors.skoHubDarkColor};
      }

      .skohubImg {
        display: inline-block;
        vertical-align: middle;
        height: 70px;
        width: auto;
        margin-right: 15px;
      }

      .skohubTitle {
        display: inline-block;
        vertical-align: middle;
        padding: 0 0 0 15px;
        font-size: 36px;
        line-height: 24px;
        font-weight: 700;

        @media only screen and (max-width: 800px) {
          padding: 0 0 0 8px;
          font-size: 18px;
        }
      }
      .conceptSchemes {
        display: flex;
      }

      .conceptScheme {
        padding: 15px 15px 0 0;
        font-size: 24px;
      }
      .conceptScheme:not(:last-child):after {
        content: ", ";
      }
    }

    ul.language-menu {
      margin: 0;
      padding: 0;
      list-style: none;
      display: inline-block;
      text-align: right;

      li {
        display: inline;

        button {
          background: none;
          width: 2rem;
          height: 2rem;
          display: inline-block;
          margin: 2px;
          color: ${config.colors.skoHubDarkGrey};
          border: 1px solid ${config.colors.skoHubDarkGrey};
          border-radius: 30px;

          &:hover {
            color: ${config.colors.skoHubAction};
            border: 1px solid ${config.colors.skoHubAction};
          }
        }

        .currentLanguage {
          color: black;
          font-weight: bold;
          display: inline-block;
          border: 1px solid ${config.colors.skoHubLightColor};
          border-radius: 30px;
        }
      }
    }
  `
  const [languages, setLanguages] = useState([])
  const [language, setLanguage] = useState("")
  const [title, setTitle] = useState("")

  // set page language
  useEffect(() => {
    if (typeof languages !== "undefined" && languages.length) {
      if (!data.selectedLanguage) {
        const userLang = getUserLang({
          availableLanguages: languages,
        })
        setLanguage(userLang)
        // updateState({ ...data, selectedLanguage: userLang })
      } else {
        setLanguage(data.selectedLanguage)
      }
    }
  }, [data])

  // Set Languages
  useEffect(() => {
    if (!data?.currentScheme?.id) {
      setLanguages(data.languages)
    } else {
      setLanguages(conceptSchemesData[data.currentScheme.id].languages)
    }
  }, [data])

  // set title
  useEffect(() => {
    const title =
      data.currentScheme?.title?.[data.selectedLanguage] ||
      data.currentScheme?.prefLabel?.[data.selectedLanguage] ||
      data.currentScheme?.dc_title?.[data.selectedLanguage] ||
      data.currentScheme?.id
    setTitle(title)
  }, [data])

  return (
    <header css={style}>
      <div className="headerContent">
        <div className="skohubLogo">
          <Link
            to={`/`}
            onClick={() => updateState({ ...data, currentScheme: {} })}
          >
            {config.logo && (
              <img
                className="skohubImg"
                src={`${withPrefix("/img/" + config.logo)}`}
                alt="Logo"
              />
            )}
            <img
              className="skohubImg"
              src={`${withPrefix("/img/logo-voc.png")}`}
              alt="Logo Vocabularios"
            />
            <span className="skohubTitle">{siteTitle}</span>
          </Link>
          
        </div>
        {languages && languages.length > 1 && (
          <ul className="language-menu">
            {languages.map((l) => (
              <li key={l}>
                {l === data.selectedLanguage ? (
                  <button className="currentLanguage">{l}</button>
                ) : (
                  <button
                    onClick={() => {
                      updateState({ ...data, selectedLanguage: l })
                      setLanguage(l)
                    }}
                  >
                    {l}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ height: "15px", background: config.colors.skoHubLightColor }} />
    </header>
  )
}

export default Header
