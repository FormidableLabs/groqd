import styled from "styled-components";
import { Box, Stack } from "@sanity/ui";

export const Root = styled(Box)`
  font-family: Menlo, monospace;
  font-size: 0.9em;
  position: relative;
  height: 100%;

  --border-radius: 4px;
  --error-bg-color: #ffe5ea;
  --item-hover-color: #e7e7e7;

  @media (prefers-color-scheme: dark) {
    --error-bg-color: #470417;
    --item-hover-color: #505050;
  }
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
  border-radius: var(--border-radius);
  cursor: ${({ pointer }) => (pointer ? "pointer" : "initial")};

  background-color: ${({ hasError }) =>
    hasError ? "var(--error-bg-color)" : "initial"};

  &:hover {
    background-color: ${({ hasError }) =>
      hasError ? undefined : "var(--item-hover-color)"};
  }
`;

export const CollapsibleContainer = styled(Stack)<{ hasError?: boolean }>`
  border-radius: var(--border-radius);

  background-color: ${({ hasError }) =>
    hasError ? "var(--error-bg-color)" : "initial"};
`;

export const ErrorMessageText = styled.div`
  font-weight: 400;
`;

const DEPTH_SC = 15;
