/**
 * NOTE: Using "*" as target for postMessages. Generally, this is a no-no.
 * In this case, we don't care who embeds the editor – go to town, if you'd like.
 * The _consumer_ is responsible for validating messages coming from the editor (by checking message.origin)
 */

const IS_EMBEDDED = window.location !== window.parent.location;

export const emitInput = ({
  compressedRawCode,
  code,
  requestImmediateFetch,
  requestShareCopy,
}: {
  compressedRawCode: string;
  code: string;
  requestImmediateFetch: boolean;
  requestShareCopy?: boolean;
}) => {
  if (!IS_EMBEDDED) return;

  window.parent.postMessage(
    JSON.stringify({
      event: "INPUT",
      code,
      compressedRawCode,
      requestImmediateFetch,
      requestShareCopy,
    }),
    "*"
  );
};

export const emitError = (message: string) => {
  if (!IS_EMBEDDED) return;

  window.parent.postMessage(JSON.stringify({ event: "ERROR", message }), "*");
};

export const emitReady = () => {
  if (!IS_EMBEDDED) return;
  window.parent.postMessage(JSON.stringify({ event: "READY" }), "*");
};
