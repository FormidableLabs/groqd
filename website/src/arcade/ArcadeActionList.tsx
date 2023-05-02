import * as React from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Menu, Transition } from "@headlessui/react";

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
      <div>
        <Menu.Button className="inline-flex w-full justify-center rounded-md bg-black bg-opacity-20 px-4 py-2">
          {title}
          {/*<ChevronDownIcon*/}
          {/*  className="ml-2 -mr-1 h-5 w-5 text-violet-200 hover:text-violet-100"*/}
          {/*  aria-hidden="true"*/}
          {/*/>*/}
        </Menu.Button>
      </div>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {items.map((item) => (
            <div className="px-1 py-1 " key={item.title}>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={active ? "bg-red-300" : ""}
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

      {/*<Menu.Items>*/}
      {/*  {items.map((item) => (*/}
      {/*    <Menu.Item key={item.title}>*/}
      {/*      <span>{item.title}</span>*/}
      {/*    </Menu.Item>*/}
      {/*  ))}*/}
      {/*</Menu.Items>*/}
    </Menu>
  );
  // return (
  //   <DropdownMenu.Root>
  //     <DropdownMenu.Trigger asChild>
  //       <button className="bg-red-300" aria-label="Dataset options">
  //         {title}
  //       </button>
  //     </DropdownMenu.Trigger>
  //
  //     <DropdownMenu.Portal>
  //       <DropdownMenu.Content>

  //       </DropdownMenu.Content>
  //     </DropdownMenu.Portal>
  //   </DropdownMenu.Root>
  // );
};
