import styled from "styled-components";
import { Box } from "@sanity/ui";

export const ErrorLineItem = styled(Box)`
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #e7e7e7;
  }

  @media (prefers-color-scheme: dark) {
    &:hover {
      background-color: #505050;
    }
  }
`;
