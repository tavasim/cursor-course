"use client";

import { useState, useEffect, useCallback } from "react";
import * as apiKeysService from "@/lib/services/apiKeysService";
import { generateApiKey } from "@/lib/utils/apiKeyUtils";

/**
 * Hook for API keys list, CRUD, and search.
 * @param {function} showToast - (message, type) for notifications
 * @returns {object} apiKeys, loading, filteredKeys, searchTerm, setSearchTerm, fetchApiKeys, handleCreate, handleUpdate, handleDelete, getFormInitialState, openCreate, openEdit
 */
export function useApiKeys(showToast) {
  const FIXED_MONTHLY_LIMIT = "200";
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiKeysService.fetchApiKeys();
      setApiKeys(data);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      showToast?.("Failed to load API keys: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const filteredKeys = apiKeys.filter(
    (key) =>
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (key.description && key.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreate = useCallback(
    async (payload) => {
      await apiKeysService.createApiKey(payload);
      showToast?.("API key created successfully");
      await fetchApiKeys();
    },
    [showToast, fetchApiKeys]
  );

  const handleUpdate = useCallback(
    async (id, payload) => {
      await apiKeysService.updateApiKey(id, payload);
      showToast?.("API key updated successfully");
      await fetchApiKeys();
    },
    [showToast, fetchApiKeys]
  );

  const handleDelete = useCallback(
    async (id) => {
      await apiKeysService.deleteApiKey(id);
      showToast?.("API key deleted successfully", "delete");
      await fetchApiKeys();
    },
    [showToast, fetchApiKeys]
  );

  const getFormInitialState = useCallback((editingKey = null) => {
    if (editingKey) {
      return {
        name: editingKey.name,
        key: editingKey.key,
        description: editingKey.description || "",
        keyType: editingKey.type || "development",
        limitMonthlyUsage: true,
        monthlyUsageLimit: FIXED_MONTHLY_LIMIT,
      };
    }
    return {
      name: "",
      key: generateApiKey(),
      description: "",
      keyType: "development",
      limitMonthlyUsage: true,
      monthlyUsageLimit: FIXED_MONTHLY_LIMIT,
    };
  }, []);

  return {
    apiKeys,
    loading,
    filteredKeys,
    searchTerm,
    setSearchTerm,
    fetchApiKeys,
    handleCreate,
    handleUpdate,
    handleDelete,
    getFormInitialState,
  };
}
