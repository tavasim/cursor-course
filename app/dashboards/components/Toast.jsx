export default function Toast({ toast }) {
  if (!toast?.show) return null;

  const isError = toast.type === "error" || toast.type === "delete";

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg transition-all ${
        isError ? "bg-red-500 text-white" : "bg-green-500 text-white"
      }`}
    >
      <div className="flex items-center gap-2">
        {isError ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
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
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
