import * as React from "react";
import { RiExpandLeftRightFill, RiContractLeftRightFill } from "react-icons/ri";

import clsx from "clsx";

type ArcadeSectionProps = {
  title: string;
  subtitle?: string;
  headerRightContent?: JSX.Element;
  style?: React.CSSProperties;
  onContractSection?: () => void;
  onExpandSection?: () => void;
};

export function ArcadeSection({
  title,
  subtitle,
  headerRightContent,
  style,
  onContractSection,
  onExpandSection,
  children,
}: React.PropsWithChildren<ArcadeSectionProps>) {
  return (
    <div
      className="group border border-solid border-gray-200 dark:border-zinc-700 rounded flex flex-col h-full overflow-hidden"
      style={style}
    >
      <div className="flex ml-2 mt-2">
        <button
          className={clsx(
            "h-3.5 w-3.5 self-start flex items-center justify-center p-0",
            "rounded-full cursor-pointer border-none transition-opacity duration-150",
            "text-transparent bg-zinc-400 dark:bg-zinc-700",
            "hover:bg-green-500 focus-visible:bg-green-500 hover:text-zinc-900 focus-visible:text-zinc-900"
          )}
          onClick={onExpandSection}
        >
          <RiExpandLeftRightFill className="h-3.5 w-3.5" />
        </button>
        <button
          className={clsx(
            "ml-2 h-3.5 w-3.5 self-start flex items-center justify-center p-0",
            "rounded-full cursor-pointer border-none transition-opacity duration-150",
            "text-transparent bg-zinc-400 dark:bg-zinc-700",
            "hover:bg-yellow-500 focus-visible:bg-yellow-500 hover:text-zinc-900 focus-visible:text-zinc-900"
          )}
          onClick={onContractSection}
        >
          <RiContractLeftRightFill className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="pt-3 pl-4 pr-4 pb-4 flex items-center justify-between">
        <div>
          <div className="text-base font-bold leading-none text-gray-700 dark:text-gray-200 mb-0.5 whitespace-nowrap">
            {title}
          </div>
          {subtitle && (
            <div className="text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">
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

export function ArcadeSectionResizer({
  onMouseDrag,
  style,
}: {
  onMouseDrag?: (x: number) => void;
  style?: React.CSSProperties;
}) {
  const isDragging = React.useRef(false);
  const offset = React.useRef(0);
  const mouseDragHandler = React.useRef(onMouseDrag);
  mouseDragHandler.current = onMouseDrag;

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      mouseDragHandler.current?.(e.clientX - offset.current);
    };
    const handleMouseUp = () => {
      if (!isDragging.current) return;
      offset.current = 0;
      isDragging.current = false;
      document.body.style.userSelect = "auto";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      style={{
        // backgroundColor: "tomato ",
        width: 18,
        cursor: "col-resize",
        ...style,
      }}
      onMouseDown={(e) => {
        offset.current =
          e.clientX - e.currentTarget.getBoundingClientRect().left;
        isDragging.current = true;
        document.body.style.userSelect = "none";
      }}
    />
  );
}
