import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import MonacoEditorWebpackPlugin from "monaco-editor-webpack-plugin";
import { themes as prismThemes } from "prism-react-renderer";
import { metadata } from "./src/metadata";

const config: Config = {
  title: metadata.longTitle,
  tagline: metadata.description,
  url: "https://nearform.com/",
  favicon: "img/nearform-icon.svg",
  baseUrl: process.env.VERCEL_ENV === "preview" ? "/" : "/open-source/groqd",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
        ...(process.env.VERCEL_ENV === "production" && {
          gtag: {
            trackingID: process.env.GTAG_TRACKING_ID,
            anonymizeIP: true,
          },
          googleTagManager: {
            containerId: process.env.GTM_CONTAINER_ID,
          },
        }),
      } satisfies Preset.Options,
    ],
  ],
  themes: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      {
        hashed: true,
      },
    ],
  ],
  plugins: [
    async function twPlugin() {
      return {
        name: "tailwind-plugin",
        configurePostCss(postcssOptions) {
          postcssOptions.plugins = [
            require("postcss-import"),
            require("tailwindcss"),
            require("autoprefixer"),
          ];
          return postcssOptions;
        },
      };
    },
    async function monacoPlugin() {
      return {
        name: "monaco-plugin",
        configureWebpack() {
          return {
            plugins: [
              new MonacoEditorWebpackPlugin({
                languages: ["typescript", "json"],
              }) as any,
            ],
          };
        },
      };
    },
  ],
  themeConfig: {
    metadata: [
      {
        name: "title",
        content: metadata.longTitle,
      },
      {
        name: "description",
        content: metadata.description,
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: "https://commerce.nearform.com/open-source/groqd/",
      },
      {
        property: "og:title",
        content: metadata.longTitle,
      },
      {
        property: "og:description",
        content: metadata.description,
      },
      {
        property: "og:image",
        content:
          "https://commerce.nearform.com/open-source/groqd/open-graph.png",
      },
      {
        property: "twitter:card",
        content: "summary_large_image",
      },
      {
        property: "twitter:title",
        content: metadata.longTitle,
      },
      {
        property: "twitter:description",
        content: metadata.description,
      },
      {
        property: "twitter:image",
        content:
          "https://commerce.nearform.com/open-source/groqd/open-graph.png",
      },
    ],
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    navbar: {
      title: "GROQD",
      logo: {
        alt: "Nearform logo",
        src: "img/nearform-logo-white.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "sidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://github.com/FormidableLabs/groqd",
          className: "header-github-link",
          "aria-label": "GitHub Repository",
          position: "right",
        },
      ],
    },
    footer: {
      logo: {
        alt: "Nearform logo",
        src: "img/nearform-logo-white.svg",
        href: "https://commerce.nearform.com",
        width: 100,
        height: 100,
      },
      copyright: `Copyright © ${new Date().getFullYear()} Nearform`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.okaidia,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
