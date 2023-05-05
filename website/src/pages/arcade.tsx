import * as React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { HiOutlineCog } from "react-icons/hi";

export default function ArcadePage() {
  return (
    <BrowserOnly
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-zinc-900">
          <HiOutlineCog className="text-3xl animate-spin text-gray-900 dark:text-gray-100" />
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
