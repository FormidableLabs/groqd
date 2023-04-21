export const emitReset = (iframe: HTMLIFrameElement, target: string) => {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: "RESET_CODE" }),
    target
  );
};

export const emitInit = (
  source: MessageEventSource,
  target: string,
  payload: { code?: string; origin: string }
) => {
  source.postMessage(JSON.stringify({ event: "INIT", ...payload }), {
    targetOrigin: target,
  });
};
