import React from "react";
import Layout from "@theme/Layout";
import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live";
import * as groqd from "groqd";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import prettier from "prettier/standalone";
import parserGroq from "prettier-plugin-groq";

function groqdFormatter(text) {
  return prettier.format(text, {
    parser: "groq-parse",
    plugins: [parserGroq],
  });
}

const scope = { groqd, groqdFormatter };

const code = `/**
 * GROQD VISUALIZER
 * use log() to see formatted groq output
 */
const { q } = groqd;

const query = q('*')
  .filter('type == "pokemon"')
  .grab({
    id: q.string(),
    name: q.string(),
  });

log(query);
`;

function transformCode(code) {
  return `
    const logs = []
    const log = (v) => logs.push(v)
    const createQuery = () => {${code}}
    const query = createQuery()
    render(
      <pre>{logs.map(query => (
          <pre>{groqdFormatter(query.query)}</pre>
        ))}</pre>
    )
  `;
}

export default function Playground() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="Playground" description="See how GROQD queries are formed">
      <LiveProvider
        code={code}
        scope={scope}
        noInline
        theme={siteConfig.themeConfig.prism.theme}
        transformCode={transformCode}
      >
        <div className="workspace">
          <LiveEditor className="editor" />
          <LivePreview className="preview" />
        </div>
      </LiveProvider>
    </Layout>
  );
}
