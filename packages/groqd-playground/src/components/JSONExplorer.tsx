import * as React from "react";
import { Box, Button, Stack } from "@sanity/ui";
import {
  CollapsibleContainer,
  ErrorMessageText,
  Key,
  Label,
  LineItem,
  Root,
  Value,
} from "./JSONExplorer.styled";
import { CopyIcon } from "@sanity/icons";
import { useCopyDataAndNotify } from "../util/copyDataToClipboard";
import {
  addToPath,
  formatPrimitiveData,
  isObject,
} from "../../../../shared/util/jsonExplorerUtils";

type JSONExplorerDisplayProps = {
  data: unknown;
  prefix?: string;
  highlightedPaths?: Map<string, string>;
  currentPath?: string;
};

export const JSONExplorer = (props: JSONExplorerDisplayProps) => {
  const copyUrl = useCopyDataAndNotify("Copied JSON to clipboard!");
  const handleCopy = () => {
    try {
      copyUrl(JSON.stringify(props.data, null, 2));
    } catch {}
  };

  return (
    <Root flex={1}>
      <Box
        padding={3}
        style={{ position: "absolute", inset: 0 }}
        overflow="auto"
      >
        <JSONExplorerDisplay {...props} />
      </Box>
      <Box style={{ position: "absolute", bottom: 0, right: 0 }} padding={3}>
        <Button
          aria-label="Copy to clipboard"
          type="button"
          mode="ghost"
          icon={CopyIcon}
          text="Copy to clipboard"
          onClick={handleCopy}
        />
      </Box>
    </Root>
  );
};

const JSONExplorerDisplay = ({
  data,
  prefix,
  highlightedPaths,
  currentPath = "",
}: JSONExplorerDisplayProps) => {
  const prefixDisplay = prefix !== undefined ? <Key>{prefix}: </Key> : null;
  const errorMessage = highlightedPaths && highlightedPaths.get(currentPath);
  const depth = currentPath === "" ? 0 : currentPath?.split(".").length || 0;

  // Arrays
  if (Array.isArray(data)) {
    return (
      <Collapsible
        depth={depth}
        title={
          <React.Fragment>
            {prefixDisplay}
            <Label>[...] {data.length} items</Label>
          </React.Fragment>
        }
        errorMessage={errorMessage}
        id={`json-item-${currentPath}`}
      >
        <Stack space={2}>
          {data.map((dat, i) => (
            <JSONExplorerDisplay
              data={dat}
              key={i}
              prefix={String(i)}
              currentPath={addToPath(currentPath, String(i))}
              highlightedPaths={highlightedPaths}
            />
          ))}
        </Stack>
      </Collapsible>
    );
  }

  // Objects
  if (isObject(data)) {
    return (
      <Collapsible
        depth={depth}
        title={
          <React.Fragment>
            {prefixDisplay}
            <Label>
              {`{...}`} {Object.keys(data).length} properties
            </Label>
          </React.Fragment>
        }
        errorMessage={errorMessage}
        id={`json-item-${currentPath}`}
      >
        <Stack space={2}>
          {Object.entries(data).map(([key, dat]) => (
            <JSONExplorerDisplay
              data={dat}
              key={key}
              prefix={key}
              currentPath={addToPath(currentPath, key)}
              highlightedPaths={highlightedPaths}
            />
          ))}
        </Stack>
      </Collapsible>
    );
  }

  // Primitive leafs
  return (
    <LineItem
      paddingY={1}
      depth={depth}
      hasError={!!errorMessage}
      id={`json-item-${currentPath}`}
    >
      <Stack space={1}>
        {errorMessage && <ErrorMessageText>{errorMessage}</ErrorMessageText>}
        <div>
          {prefixDisplay}
          <Value>{formatPrimitiveData(data)}</Value>{" "}
        </div>
      </Stack>
    </LineItem>
  );
};

const Collapsible = ({
  title,
  depth,
  children,
  errorMessage,
  id,
}: React.PropsWithChildren<{
  title: JSX.Element;
  depth: number;
  errorMessage?: string;
  id?: string;
}>) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <CollapsibleContainer space={2} id={id} hasError={!!errorMessage}>
      <LineItem
        paddingY={1}
        depth={depth}
        onClick={() => setIsExpanded((v) => !v)}
        pointer
      >
        <Stack space={1}>
          {errorMessage && <ErrorMessageText>{errorMessage}</ErrorMessageText>}
          <Box>{title}</Box>
        </Stack>
      </LineItem>
      <div style={{ height: isExpanded ? "auto" : 0, overflow: "hidden" }}>
        {children}
      </div>
    </CollapsibleContainer>
  );
};
