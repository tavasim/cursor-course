"use client";

import { useEffect, useState, useRef } from "react";

const DURATION_MS = 4000;
const EVENT_NAME = "show-notification";

/**
 * Trigger a global notification popup. Import and call from any component.
 * @param {string} message - Message to display
 * @param {"success" | "error"} type - Green (success) or red (error) popup
 */
export function showNotification(message, type = "success") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { message, type } })
    );
  }
}

export default function Notification() {
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleShow = (e) => {
      const { message, type } = e.detail || {};
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setNotification({
        show: true,
        message: message || "",
        type: type || "success",
      });
      timeoutRef.current = setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, DURATION_MS);
    };

    window.addEventListener(EVENT_NAME, handleShow);
    return () => {
      window.removeEventListener(EVENT_NAME, handleShow);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!notification.show) return null;

  const isError = notification.type === "error";

  return (
    <div
      className={`fixed bottom-4 right-4 z-[100] rounded-lg px-4 py-3 shadow-lg transition-all flex items-center gap-2 ${
        isError ? "bg-red-500 text-white" : "bg-green-500 text-white"
      }`}
    >
      {isError ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      <span className="text-sm font-medium">{notification.message}</span>
    </div>
  );
}
