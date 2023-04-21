import styled from "styled-components";
import { Box } from "@sanity/ui";

export const Root = styled.div`
  font-family: Menlo, monospace;
  font-size: 0.9em;
`;

export const Label = styled.span`
  color: #9d1fcd;
  @media (prefers-color-scheme: dark) {
    color: #d05afc;
  }
`;

export const Key = styled.span`
  color: #1e61cd;
  @media (prefers-color-scheme: dark) {
    color: #5998fc;
  }
`;
export const Value = styled.span`
  color: #967e1c;
  @media (prefers-color-scheme: dark) {
    color: #dbb931;
  }
`;

export const LineItem = styled(Box)<{
  depth: number;
  pointer?: boolean;
  hasError?: boolean;
}>`
  padding-left: ${({ depth }) => depth * DEPTH_SC}px;
  border-radius: 4px;
  cursor: ${({ pointer }) => (pointer ? "pointer" : "initial")};

  background-color: ${({ hasError }) => (hasError ? "#ffe5ea" : "initial")};

  &:hover {
    background-color: ${({ hasError }) => (hasError ? undefined : "#e7e7e7")};
  }

  @media (prefers-color-scheme: dark) {
    background-color: ${({ hasError }) => (hasError ? "#470417" : "initial")};

    &:hover {
      background-color: ${({ hasError }) => (hasError ? undefined : "#505050")};
    }
  }
`;

export const ErrorMessageText = styled.div`
  font-weight: 400;
`;

const DEPTH_SC = 15;
