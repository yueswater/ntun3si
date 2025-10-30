import { useEffect } from "react";

/**
 * AppAlert Component
 * type = info | success | error | warning
 * Disappear after 3 seconds
 */
export default function AppAlert({ type = "info", message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  const icons = {
    info: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    success: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    error: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 14l2-2m0 0l2-2m-2 2l2 2m-2-2l-2-2m0 8a9 9 0 110-18 9 9 0 010 18z"
      />
    ),
    warning: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
      />
    ),
  };

  return (
    <div
      role="alert"
      className={`alert alert-${type} fixed top-4 right-4 w-fit shadow-lg z-50`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="h-6 w-6 shrink-0 stroke-current"
      >
        {icons[type]}
      </svg>
      <span>{message}</span>
    </div>
  );
}
