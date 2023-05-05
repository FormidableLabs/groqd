import * as React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { HiOutlineCog } from "react-icons/hi";
import Head from "@docusaurus/Head";

export default function ArcadePage() {
  return (
    <React.Fragment>
      <Head>
        <title>GROQD Arcade</title>
        <meta
          name="description"
          content="Write and test GROQD queries against custom datasets."
        />
        <meta
          name="keywords"
          content="groqd, sanity, arcade, query, groq, typescript"
        />
      </Head>
      <BrowserOnly
        fallback={
          <div className="fixed inset-0 flex items-center justify-center">
            <HiOutlineCog className="text-3xl animate-spin" />
          </div>
        }
      >
        {() => {
          const { Arcade } = require("@site/src/arcade/Arcade");
          return <Arcade />;
        }}
      </BrowserOnly>
    </React.Fragment>
  );
}
