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

export const CopyQueryButton = styled.button`
  all: unset;
  cursor: pointer;
  &:focus {
    box-shadow: inset 0 0 0 1px var(--card-border-color), 0 0 0 1px #fff,
      0 0 0 3px var(--card-focus-ring-color);
    border-radius: 0.1875rem;
  }
`;
