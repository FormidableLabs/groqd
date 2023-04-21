import * as React from "react";
import { GroqdPlaygroundProps } from "./types";
import { ToastProvider } from "@sanity/ui";
import GroqdPlayground from "./components/Playground";

export default function GroqdPlaygroundWrapper(props: GroqdPlaygroundProps) {
  return (
    <ToastProvider>
      <GroqdPlayground {...props} />
    </ToastProvider>
  );
}
