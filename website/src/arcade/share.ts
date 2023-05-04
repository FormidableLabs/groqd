export const copyToClipboard = (value: string, cb?: () => void) =>
  navigator.clipboard
    .writeText(value)
    .then(cb)
    .catch(() => null);

export const copyShareUrl = () =>
  copyToClipboard(window.location.href, () => {
    alert("Copied share URL to clipboard");
  });
