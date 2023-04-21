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
import { useCopyDataAndNotify } from "../hooks/copyDataToClipboard";

type ShareUrlFieldProps = {
  url: string;
  title: string;
  column?: number;
  notificationMessage?: string;
};

export const ShareUrlField = ({
  title,
  url,
  column = 4,
  notificationMessage = "Copied URL to clipboard!",
}: ShareUrlFieldProps) => {
  const copyUrl = useCopyDataAndNotify(notificationMessage);
  const handleCopyUrl = () => copyUrl(url);

  return (
    <Box padding={1} flex={1} column={column}>
      <Stack>
        <Card paddingY={2}>
          <Label muted>{title}</Label>
        </Card>
        <Flex flex={1} gap={1}>
          <Box flex={1}>
            <TextInput readOnly type="url" value={url} />
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
              onClick={handleCopyUrl}
            />
          </Tooltip>
        </Flex>
      </Stack>
    </Box>
  );
};
