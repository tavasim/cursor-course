export default function CurrentPlanCard() {
  return (
    <div className="mb-8 relative overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-200 blur-3xl"></div>
      </div>

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">CURRENT PLAN</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Dandi API</h2>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Manage Plan
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">API Usage</span>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mb-2">Monthly plan</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: "0%" }}></div>
            </div>
            <p className="text-xs text-gray-600">0/1,000 Credits</p>
          </div>
        </div>
      </div>
    </div>
  );
}
