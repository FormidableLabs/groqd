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

/**
 * Using "*" as postMessage target is generally a no-no.
 * For our "READY" event, we can't reliably know the cross-origin parent, so we'll emit to everyone.
 * On the consuming side, we'll do an origin check – and then respond to the event with the origin to use in follow-up messages.
 *
 * This message payload contains no useful information, so no biggy if it's intercepted.
 * The postMessage listener also checks that responders to this message are the parent window,
 *   so this message will only be responded to from an embedding window.
 */
export const emitReady = () => {
  if (!IS_EMBEDDED) return;
  window.parent.postMessage(JSON.stringify({ event: "READY" }), "*");
};
