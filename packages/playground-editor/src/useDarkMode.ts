import * as React from "react";

const useMediaQuery = (query: string) => {
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };
  const [matches, setMatches] = React.useState(getMatches(query));

  function handleChange() {
    setMatches(getMatches(query));
  }

  React.useEffect(() => {
    const matchMedia = window.matchMedia(query);
    handleChange();
    matchMedia.addEventListener("change", handleChange);
    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
};

export const useIsDarkMode = () =>
  useMediaQuery("(prefers-color-scheme: dark)");
