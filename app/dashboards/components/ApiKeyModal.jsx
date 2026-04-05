"use client";

export default function ApiKeyModal({
  isOpen,
  onClose,
  editingKey,
  formData,
  setFormData,
  keyType,
  setKeyType,
  limitMonthlyUsage,
  setLimitMonthlyUsage,
  monthlyUsageLimit,
  setMonthlyUsageLimit,
  onSubmit,
}) {
  if (!isOpen) return null;

  const isEditing = Boolean(editingKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-2xl font-semibold text-gray-900">
          {isEditing ? "Edit API key" : "Create a new API key"}
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          {isEditing
            ? "Update the API key details."
            : "Enter a name for the new API key."}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="mb-6">
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-900">
              Key Name
            </label>
            <p className="mb-2 text-xs text-gray-500">— A unique name to identify this key</p>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Key Name"
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-900">Key Type</label>
            <p className="mb-3 text-xs text-gray-500">— Choose the environment for this key</p>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
                <input
                  type="radio"
                  name="keyType"
                  value="development"
                  checked={keyType === "development"}
                  onChange={(e) => setKeyType(e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">&lt;&gt;</span>
                    <span className="font-medium text-gray-900">Development</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Rate limited to 100 requests/minute</p>
                </div>
                {keyType === "development" && (
                  <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                )}
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-gray-200 bg-white p-4 hover:border-gray-300">
                <input
                  type="radio"
                  name="keyType"
                  value="production"
                  checked={keyType === "production"}
                  onChange={(e) => setKeyType(e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span className="font-medium text-gray-900">Production</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Rate limited to 1,000 requests/minute</p>
                </div>
                {keyType === "production" && (
                  <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                )}
              </label>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="limitMonthlyUsage"
                checked
                disabled
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="limitMonthlyUsage" className="text-sm font-medium text-gray-900">
                Limit monthly usage<span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="number"
              value="200"
              readOnly
              disabled
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700"
              aria-label="Monthly usage limit"
            />
            <p className="mt-2 text-xs text-gray-500">
              * Monthly usage is fixed at 200 requests per key and cannot be changed.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              If the combined usage of all your keys exceeds your account's allocated usage limit
              (plan, add-ons, and any pay-as-you-go limit), all requests will be rejected.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              {isEditing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
