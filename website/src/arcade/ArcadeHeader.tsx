import * as React from "react";

export function ArcadeHeader({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-12 border-b flex items-center justify-center">
      {children}
    </div>
  );
}
