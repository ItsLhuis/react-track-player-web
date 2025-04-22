import Link from "@docusaurus/Link"

import useBaseUrl from "@docusaurus/useBaseUrl"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"

import HomepageFeatures from "@site/src/components/HomepageFeatures"

import Layout from "@theme/Layout"

type Badge = { badge: string; link: string; alt: string }
const badges: Badge[] = [
  {
    alt: "downloads",
    badge: "https://img.shields.io/npm/dw/react-track-player-web",
    link: "https://www.npmjs.com/package/react-track-player-web"
  },
  {
    alt: "npm",
    badge: "https://img.shields.io/npm/v/react-track-player-web",
    link: "https://www.npmjs.com/package/react-track-player-web"
  },
  {
    alt: "license",
    badge: "https://img.shields.io/npm/l/react-track-player-web",
    link: "https://github.com/ItsLhuis/react-track-player-web/blob/main/LICENSE"
  }
]

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()

  return (
    <header
      style={{ paddingTop: "2rem", textAlign: "center", position: "relative", overflow: "hidden" }}
    >
      <div className="container">
        <img
          src={useBaseUrl("/img/logo.svg")}
          style={{ width: 100, height: 100 }}
          className="logo"
        />
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div>
          {badges.map(({ alt, badge, link }, idx) => (
            <Link to={link} key={idx} style={{ padding: "0.25rem" }}>
              <img src={badge} alt={alt} />
            </Link>
          ))}
        </div>
        <Link
          className="button button--primary button--lg"
          to="/docs/installation"
          style={{ marginTop: "2rem" }}
        >
          Get Started
        </Link>
      </div>
    </header>
  )
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout
      title={siteConfig.title}
      description="A web-based audio player library for React applications. This library provides a simple and powerful way to play audio tracks in your web application."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  )
}
