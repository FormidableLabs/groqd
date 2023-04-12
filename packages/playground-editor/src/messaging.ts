let targetUrl!: string;
const getTargetUrl = () => {
  if (!targetUrl) {
    const params = new URLSearchParams(window.location.search);
    targetUrl = params.get("host") || "";
  }

  return targetUrl;
};

export const emitQuery = (query: string) => {
  window.parent.postMessage(
    JSON.stringify({ event: "QUERY", query }),
    getTargetUrl()
  );
};

export const emitError = (message: string) => {
  window.parent.postMessage(
    JSON.stringify({ event: "ERROR", message }),
    getTargetUrl()
  );
};
