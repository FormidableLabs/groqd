import * as React from "react";
import { ImSpinner9 } from "react-icons/Im";

export function ArcadeLoadingIndicator() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ImSpinner9 className="animate-spin" />
    </div>
  );
}
