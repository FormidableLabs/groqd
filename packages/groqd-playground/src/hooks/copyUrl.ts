import * as React from "react";
import { useToast } from "@sanity/ui";

export const useCopyUrlAndNotify = (message: string) => {
  const toast = useToast();

  return React.useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url).then(() => {
        toast.push({ title: message });
      });
    },
    [message]
  );
};
