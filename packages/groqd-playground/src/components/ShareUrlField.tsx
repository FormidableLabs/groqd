import * as React from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Label,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@sanity/ui";
import { CopyIcon } from "@sanity/icons";

type ShareUrlFieldProps = { url: string; title: string; column?: number };

export const ShareUrlField = ({
  title,
  url,
  column = 4,
}: ShareUrlFieldProps) => {
  const ref = React.useRef<HTMLInputElement>(null);

  const handleCopyQueryUrl = async () => {
    const el = ref.current;
    if (!el) return;

    try {
      el.select();
      await navigator.clipboard.writeText(el.value);
      console.log("COPIED!"); // TODO: Toaster boy
    } catch {}
  };

  return (
    <Box padding={1} flex={1} column={column}>
      <Stack>
        <Card paddingY={2}>
          <Label muted>{title}</Label>
        </Card>
        <Flex flex={1} gap={1}>
          <Box flex={1}>
            <TextInput readOnly type="url" value={url} ref={ref} />
          </Box>
          <Tooltip
            content={
              <Box padding={2}>
                <Text>Copy to clipboard</Text>
              </Box>
            }
          >
            <Button
              aria-label="Copy to clipboard"
              type="button"
              mode="ghost"
              icon={CopyIcon}
              onClick={handleCopyQueryUrl}
            />
          </Tooltip>
        </Flex>
      </Stack>
    </Box>
  );
};
