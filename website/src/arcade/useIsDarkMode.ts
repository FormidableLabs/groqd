import * as React from "react";
import { makeDarkModeHook } from "../../../shared/util/makeDarkModeHook";

export const useIsDarkMode = makeDarkModeHook({
  useState: React.useState,
  useEffect: React.useEffect,
});
