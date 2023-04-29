import { MODELS } from "@site/src/arcade/models";
import { BaseQuery } from "groqd";

type Params = Record<string, string | number>;
type State = {
  activeModel: keyof typeof MODELS;
  query: BaseQuery<any>;
  params?: Params;
  inputParseError?: Error;
};

type Action =
  | { type: "SET_ACTIVE_MODEL"; payload: keyof typeof MODELS }
  | {
      type: "INPUT_EVAL_SUCCESS";
      payload: { query: BaseQuery<any>; params?: Params };
    };

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_ACTIVE_MODEL":
      return { ...state, activeModel: action.payload };
    case "INPUT_EVAL_SUCCESS":
      return {
        ...state,
        query: action.payload.query,
        params: action.payload.params,
        inputParseError: undefined,
      };
    default:
      return state;
  }
};
