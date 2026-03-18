"use client";

import { useState, useCallback } from "react";

const DEFAULT_DURATION_MS = 3000;

/**
 * Hook for toast notifications.
 * @param {number} [duration=DEFAULT_DURATION_MS]
 * @returns {{ toast: object, showToast: (message: string, type?: 'success'|'error'|'delete') => void }}
 */
export function useToast(duration = DEFAULT_DURATION_MS) {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = useCallback(
    (message, type = "success") => {
      setToast({ show: true, message, type });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false, type: "success" }));
      }, duration);
    },
    [duration]
  );

  return { toast, showToast };
}
