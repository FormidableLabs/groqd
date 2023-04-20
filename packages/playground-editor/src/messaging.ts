/**
 * NOTE: Using "*" as target for postMessages. Generally, this is a no-no.
 * In this case, we don't care who embeds the editor – go to town, if you'd like.
 * The _consumer_ is responsible for validating messages coming from the editor (by checking message.origin)
 */

const IS_EMBEDDED = window.location !== window.parent.location;

export const emitInput = (
  {
    compressedRawCode,
    code,
    requestImmediateFetch,
    requestShareCopy,
  }: {
    compressedRawCode: string;
    code: string;
    requestImmediateFetch: boolean;
    requestShareCopy?: boolean;
  },
  target: string
) => {
  if (!IS_EMBEDDED) return;

  window.parent.postMessage(
    JSON.stringify({
      event: "INPUT",
      code,
      compressedRawCode,
      requestImmediateFetch,
      requestShareCopy,
    }),
    target
  );
};

export const emitError = (message: string, target: string) => {
  if (!IS_EMBEDDED) return;

  window.parent.postMessage(
    JSON.stringify({ event: "ERROR", message }),
    target
  );
};

export const emitReady = (target: string) => {
  if (!IS_EMBEDDED) return;
  window.parent.postMessage(JSON.stringify({ event: "READY" }), target);
};
