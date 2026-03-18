"use client";

import { useState, useCallback } from "react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useToast } from "@/hooks/useToast";
import CurrentPlanCard from "@/app/dashboards/components/CurrentPlanCard";
import ApiKeysSection from "@/app/dashboards/components/ApiKeysSection";
import ApiKeyModal from "@/app/dashboards/components/ApiKeyModal";
import Toast from "@/app/dashboards/components/Toast";

const initialFormState = {
  name: "",
  key: "",
  description: "",
  keyType: "development",
  limitMonthlyUsage: false,
  monthlyUsageLimit: "1000",
};

export default function DashboardsPage() {
  const { toast, showToast } = useToast();
  const {
    loading,
    filteredKeys,
    searchTerm,
    setSearchTerm,
    handleCreate,
    handleUpdate,
    handleDelete: deleteApiKey,
    getFormInitialState,
  } = useApiKeys(showToast);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [keyType, setKeyType] = useState("development");
  const [limitMonthlyUsage, setLimitMonthlyUsage] = useState(false);
  const [monthlyUsageLimit, setMonthlyUsageLimit] = useState("1000");
  const [showKey, setShowKey] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const handleOpenModal = useCallback(
    (key = null) => {
      setEditingKey(key);
      const initial = getFormInitialState(key);
      setFormData(initial);
      setKeyType(initial.keyType);
      setLimitMonthlyUsage(initial.limitMonthlyUsage);
      setMonthlyUsageLimit(initial.monthlyUsageLimit);
      setIsModalOpen(true);
    },
    [getFormInitialState]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingKey(null);
    setFormData(initialFormState);
    setKeyType("development");
    setLimitMonthlyUsage(false);
    setMonthlyUsageLimit("1000");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      showToast("Please enter a name for the API key", "error");
      return;
    }
    if (!formData.key.trim()) {
      showToast("Please enter or generate an API key", "error");
      return;
    }

    const payload = {
      name: formData.name,
      key: formData.key,
      description: formData.description || null,
      type: keyType,
      limitMonthlyUsage,
      monthlyUsageLimit,
    };

    try {
      if (editingKey) {
        await handleUpdate(editingKey.id, payload);
      } else {
        await handleCreate(payload);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving API key:", error);
      showToast("Failed to save API key: " + error.message, "error");
    }
  }, [
    formData,
    keyType,
    limitMonthlyUsage,
    monthlyUsageLimit,
    editingKey,
    handleUpdate,
    handleCreate,
    handleCloseModal,
    showToast,
  ]);

  const handleDelete = useCallback(
    async (id) => {
      if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
        return;
      }
      try {
        await deleteApiKey(id);
      } catch (error) {
        console.error("Error deleting API key:", error);
        showToast("Failed to delete API key: " + error.message, "error");
      }
    },
    [deleteApiKey, showToast]
  );

  const copyToClipboard = useCallback(
    (text, id) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast("API key copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    },
    [showToast]
  );

  const toggleShowKey = useCallback((id) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="mx-auto max-w-7xl px-8 py-8">
        <CurrentPlanCard />

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-semibold text-gray-900">API Keys</h3>
              <input
                type="search"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Key
            </button>
          </div>

          <ApiKeysSection
            loading={loading}
            filteredKeys={filteredKeys}
            showKey={showKey}
            toggleShowKey={toggleShowKey}
            onCopy={copyToClipboard}
            copiedId={copiedId}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
            onCreateClick={() => handleOpenModal()}
          />
        </div>

        <ApiKeyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingKey={editingKey}
          formData={formData}
          setFormData={setFormData}
          keyType={keyType}
          setKeyType={setKeyType}
          limitMonthlyUsage={limitMonthlyUsage}
          setLimitMonthlyUsage={setLimitMonthlyUsage}
          monthlyUsageLimit={monthlyUsageLimit}
          setMonthlyUsageLimit={setMonthlyUsageLimit}
          onSubmit={handleSubmit}
        />

        <Toast toast={toast} />
      </div>
    </div>
  );
}
