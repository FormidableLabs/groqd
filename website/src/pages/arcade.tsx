import * as React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";

export default function ArcadePage() {
  return (
    <BrowserOnly fallback={<div>Loading...</div>}>
      {() => {
        const { Arcade } = require("@site/src/arcade/Arcade");
        return <Arcade />;
      }}
    </BrowserOnly>
  );
}
