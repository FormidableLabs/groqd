let targetUrl = "";
const getTargetUrl = () => {
  if (!targetUrl) {
    const params = new URLSearchParams(window.location.search);
    targetUrl = params.get("host") || "";
  }

  return targetUrl;
};

const IS_EMBEDDED = window.location !== window.parent.location;

export const emitQuery = (query: string) => {
  if (!IS_EMBEDDED) return;

  window.parent.postMessage(
    JSON.stringify({ event: "QUERY", query }),
    getTargetUrl()
  );
};

export const emitError = (message: string) => {
  if (!IS_EMBEDDED) return;

  window.parent.postMessage(
    JSON.stringify({ event: "ERROR", message }),
    getTargetUrl()
  );
};
