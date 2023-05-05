export const makeDarkModeHook = (reactLike: {
  useState: <T>(initVal: T) => [val: T, setVal: (newVal: T) => void];
  useEffect: (fn: () => void, deps: unknown[]) => void;
}) => {
  const useMediaQuery = (query: string) => {
    const getMatches = (query: string): boolean => {
      // Prevents SSR issues
      if (typeof window !== "undefined") {
        return window.matchMedia(query).matches;
      }
      return false;
    };
    const [matches, setMatches] = reactLike.useState(getMatches(query));

    function handleChange() {
      setMatches(getMatches(query));
    }

    reactLike.useEffect(() => {
      const matchMedia = window.matchMedia(query);
      handleChange();
      matchMedia.addEventListener("change", handleChange);
      return () => {
        matchMedia.removeEventListener("change", handleChange);
      };
    }, [query]);

    return matches;
  };

  return () => useMediaQuery("(prefers-color-scheme: dark)");
};
