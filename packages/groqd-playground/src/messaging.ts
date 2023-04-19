export const emitReset = (iframe: HTMLIFrameElement, target: string) => {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: "RESET_CODE" }),
    target
  );
};
