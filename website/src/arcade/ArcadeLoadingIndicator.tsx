import * as React from "react";
import { HiOutlineCog } from "react-icons/hi";

export function ArcadeLoadingIndicator() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <HiOutlineCog className="text-lg animate-spin" />
    </div>
  );
}
