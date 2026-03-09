import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "info") => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback(
        {
            info: (msg) => addToast(msg, "info"),
            success: (msg) => addToast(msg, "success"),
            error: (msg) => addToast(msg, "error"),
            warning: (msg) => addToast(msg, "warning"),
        },
        [addToast]
    );

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

const typeStyles = {
    info: {
        border: "border-blue-400/40",
        text: "text-blue-300",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        ),
    },
    success: {
        border: "border-green-400/40",
        text: "text-green-300",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        ),
    },
    error: {
        border: "border-red-400/40",
        text: "text-red-300",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l2 2m-2-2l-2-2m0 8a9 9 0 110-18 9 9 0 010 18z"
            />
        ),
    },
    warning: {
        border: "border-yellow-400/40",
        text: "text-yellow-300",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
            />
        ),
    },
};

function ToastItem({ toast, onClose }) {
    const style = typeStyles[toast.type] || typeStyles.info;

    return (
        <div
            role="alert"
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border ${style.border} backdrop-blur-xl bg-white/10 shadow-lg animate-slide-in-right min-w-[280px] max-w-[400px]`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className={`h-5 w-5 shrink-0 stroke-current ${style.text}`}
            >
                {style.icon}
            </svg>
            <span className={`text-sm flex-1 ${style.text}`}>{toast.message}</span>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors shrink-0"
                aria-label="close"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
