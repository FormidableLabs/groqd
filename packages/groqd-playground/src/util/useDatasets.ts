import * as React from "react";
import type { SanityClient } from "sanity";

export const useDatasets = (client: SanityClient) => {
  const [datasets, setDatasets] = React.useState<string[]>([]);

  React.useEffect(() => {
    const datasets$ = client.observable.datasets.list().subscribe({
      next: (result) => setDatasets(result.map((ds) => ds.name)),
    });

    return () => datasets$.unsubscribe();
  }, []);

  return datasets;
};
