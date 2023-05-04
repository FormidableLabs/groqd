import * as React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { HiOutlineCog } from "react-icons/hi";

export default function ArcadePage() {
  return (
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
  );
}
