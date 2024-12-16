import type { ArcadeDispatch } from "../state";
import type * as PlaygroundModule from "./index";
/**
 * This returns
 * @param dispatch
 * @param shouldRunQueryImmediately
 */
export declare function createPlaygroundModule({
  dispatch,
  shouldRunQueryImmediately,
}: {
  dispatch: ArcadeDispatch;
  shouldRunQueryImmediately?: boolean;
}): typeof PlaygroundModule;
