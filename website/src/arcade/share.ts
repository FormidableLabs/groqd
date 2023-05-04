import toast from "react-hot-toast";

export const copyToClipboard = (value: string, cb?: () => void) =>
  navigator.clipboard
    .writeText(value)
    .then(cb)
    .catch(() => null);

export const copyShareUrl = () =>
  copyToClipboard(window.location.href, () => {
    toast.success("Copied share URL to clipboard.");
  });
