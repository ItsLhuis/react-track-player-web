import type * as Preset from "@docusaurus/preset-classic"
import type { Config } from "@docusaurus/types"
import { themes as prismThemes } from "prism-react-renderer"

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "React Track Player Web",
  tagline: "A web-based audio player library for React applications",
  favicon: "img/favicon.ico",
  // Set the production url of your site here
  url: "https://itslhuis.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/react-track-player-web/",
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "ItsLhuis", // Usually your GitHub org/user name.
  projectName: "react-track-player-web", // Usually your repo name.
  trailingSlash: false,
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"]
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/ItsLhuis/react-track-player-web/tree/main/docs/"
        },
        theme: {
          customCss: "./src/css/custom.css"
        }
      } satisfies Preset.Options
    ]
  ],
  themeConfig: {
    navbar: {
      hideOnScroll: true,
      title: "React Track Player Web",
      logo: {
        alt: "React Track Player Web Logo",
        src: "img/logo.svg"
      },
      items: [
        {
          type: "doc",
          docId: "introduction",
          position: "left",
          label: "Introduction"
        },
        {
          href: "https://github.com/ItsLhuis/react-track-player-web",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository"
        }
      ]
    },
    footer: {
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Introduction",
              to: "/docs/"
            },
            {
              label: "Getting Started",
              to: "/docs/installation"
            },
            {
              label: "API Reference",
              to: "/docs/api/events"
            }
          ]
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/ItsLhuis/react-track-player-web"
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} React Track Player Web. All rights reserved.`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula
    }
  } satisfies Preset.ThemeConfig
}

export default config
