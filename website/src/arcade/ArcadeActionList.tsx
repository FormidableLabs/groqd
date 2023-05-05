import * as React from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Menu, Transition } from "@headlessui/react";
import { HiChevronDown } from "react-icons/hi";
import clsx from "clsx";

type ArcadeActionListProps<T> = {
  title: string;
  items: { title: string; value: T }[];
  onSelectItem(item: T): void;
};

export const ArcadeActionList = <T,>({
  title,
  items,
  onSelectItem,
}: ArcadeActionListProps<T>) => {
  return (
    <Menu as="div" className="relative inline-block">
      {({ open }) => (
        <React.Fragment>
          <Menu.Button
            className={clsx(
              "inline-flex w-full justify-center items-center rounded-md bg-black px-4 py-2 border-none cursor-pointer",
              "hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors duration-150",
              "text-base font-bold text-gray-700 dark:text-gray-200",
              open ? "bg-gray-50 dark:bg-zinc-800" : "bg-transparent"
            )}
          >
            {title}
            <HiChevronDown className="ml-2" aria-hidden="true" />
          </Menu.Button>

          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-black shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col gap-0.5 p-2 z-[2]">
              {items.map((item) => (
                <div className="" key={item.title}>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          "w-full p-2 border-none rounded-md",
                          "text-left text-sm text-gray-800 dark:text-gray-50 cursor-pointer",
                          "hover:bg-gray-50 dark:hover:bg-zinc-800",
                          active ? "bg-gray-50" : "bg-transparent"
                        )}
                        onClick={() => onSelectItem(item.value)}
                      >
                        {item.title}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              ))}
            </Menu.Items>
          </Transition>
        </React.Fragment>
      )}
    </Menu>
  );
};
