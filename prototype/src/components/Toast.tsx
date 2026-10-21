import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  onClear: () => void;
}

/**
 * 轻提示。
 */
export function Toast({ message, onClear }: ToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(onClear, 2200);
    return () => window.clearTimeout(timer);
  }, [message, onClear]);

  if (!message) {
    return null;
  }

  return <div className="toast">{message}</div>;
}
