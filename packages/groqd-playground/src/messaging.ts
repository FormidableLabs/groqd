export const emitReset = (iframe: HTMLIFrameElement, target: string) => {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: "RESET_CODE" }),
    target
  );
};

export const emitInit = (
  iframe: HTMLIFrameElement,
  target: string,
  payload: { code?: string }
) => {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: "INIT", code: payload.code }),
    target
  );
};
