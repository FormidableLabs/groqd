import * as React from "react";
import { BaseQuery } from "groqd";
import { ARCADE_STORAGE_KEYS } from "@site/src/arcade/consts";
import { q } from "groqd";

export type GroqdQueryParams = Record<string, string | number>;
export type State = {
  query: BaseQuery<any>;
  params?: GroqdQueryParams;
  inputParseError?: Error;
  isExecutingQuery: boolean;
  rawResponse?: unknown;
  parsedResponse?: unknown;
  fetchParseError?: unknown;
  errorPaths?: Map<string, string>;
};

export const defaultState: State = {
  query: q(""),
  isExecutingQuery: false,
};

export type Action =
  | {
      type: "INPUT_EVAL_SUCCESS";
      payload: { query: BaseQuery<any>; params?: GroqdQueryParams };
    }
  | {
      type: "START_QUERY_EXEC";
    }
  | { type: "RAW_RESPONSE_RECEIVED"; payload: { rawResponse: unknown } }
  | {
      type: "PARSE_SUCCESS";
      payload: { parsedResponse: unknown };
    }
  | {
      type: "PARSE_FAILURE";
      payload: { fetchParseError: unknown; errorPaths?: Map<string, string> };
    };

export type ArcadeDispatch = React.Dispatch<Action>;

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "INPUT_EVAL_SUCCESS":
      return {
        ...state,
        query: action.payload.query,
        params: action.payload.params,
        inputParseError: undefined,
      };
    case "START_QUERY_EXEC":
      return { ...state, isExecutingQuery: true };
    case "RAW_RESPONSE_RECEIVED":
      return { ...state, rawResponse: action.payload.rawResponse };
    case "PARSE_SUCCESS":
      return {
        ...state,
        isExecutingQuery: false,
        parsedResponse: action.payload.parsedResponse,
        fetchParseError: undefined,
        errorPaths: undefined,
      };
    case "PARSE_FAILURE":
      return {
        ...state,
        isExecutingQuery: false,
        fetchParseError: action.payload.fetchParseError,
        errorPaths: action.payload.errorPaths,
      };
    default:
      return state;
  }
};

// URL helpers
const url = new URL(window.location.href);
const qp = url.searchParams;
const LOCAL_STORAGE_PREFIX = "__groqd_arcade_";
export const setStorageValue = (
  key: ValueOf<typeof ARCADE_STORAGE_KEYS>,
  value: string
) => {
  qp.set(key, value);
  window.history.replaceState(null, "", url);
  localStorage.setItem(LOCAL_STORAGE_PREFIX + key, value);
};

export const getStorageValue = (key: ValueOf<typeof ARCADE_STORAGE_KEYS>) => {
  try {
    return (
      new URL(window.location.href).searchParams.get(key) ||
      localStorage.getItem(LOCAL_STORAGE_PREFIX + key) ||
      ""
    );
  } catch {
    return "";
  }
};

type ValueOf<T> = T[keyof T];
