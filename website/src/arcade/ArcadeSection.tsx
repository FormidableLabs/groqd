import * as React from "react";

type ArcadeSectionProps = {
  title: string;
  subtitle?: string;
  headerRightContent?: JSX.Element;
};

export function ArcadeSection({
  title,
  subtitle,
  headerRightContent,
  children,
}: React.PropsWithChildren<ArcadeSectionProps>) {
  return (
    <div className="w-full border border-solid border-gray-200 dark:border-gray-700 rounded overflow-hidden flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="text-base font-bold leading-none text-gray-700 dark:text-gray-200 mb-0.5">
            {title}
          </div>
          {subtitle && (
            <div className="text-gray-800 dark:text-gray-100 text-sm">
              {subtitle}
            </div>
          )}
        </div>
        {headerRightContent}
      </div>
      <div className="flex-1 relative">{children}</div>
    </div>
  );
}
