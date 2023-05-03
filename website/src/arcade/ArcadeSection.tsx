import * as React from "react";

type ArcadeSectionProps = {
  title: string;
  subtitle?: string;
};

export function ArcadeSection({
  title,
  subtitle,
  children,
}: React.PropsWithChildren<ArcadeSectionProps>) {
  return (
    <div className="w-full border border-solid border-gray-200 rounded overflow-hidden flex flex-col h-full overflow-hidden">
      <div className="p-5">
        <div className="text-lg font-bold leading-none text-gray-700">
          {title}
        </div>
        {subtitle && <div className="text-gray-800">{subtitle}</div>}
      </div>
      <div className="flex-1 relative">{children}</div>
    </div>
  );
}
