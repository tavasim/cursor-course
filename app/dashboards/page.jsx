"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardsPage() {
  const [apiKeys, setApiKeys] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [formData, setFormData] = useState({ name: "", key: "", description: "" });
  const [keyType, setKeyType] = useState("development");
  const [limitMonthlyUsage, setLimitMonthlyUsage] = useState(false);
  const [monthlyUsageLimit, setMonthlyUsageLimit] = useState("1000");
  const [showKey, setShowKey] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load API keys from Supabase on mount
  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map database columns (snake_case) to component format (camelCase)
      const mappedData = data.map((key) => ({
        id: key.id,
        name: key.name,
        key: key.key,
        description: key.description,
        type: key.type,
        limitMonthlyUsage: key.limit_monthly_usage,
        monthlyUsageLimit: key.monthly_usage_limit,
        usageCount: key.usage_count || 0,
        lastUsed: key.last_used,
        createdAt: key.created_at,
        updatedAt: key.updated_at,
      }));

      setApiKeys(mappedData);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      showToast("Failed to load API keys: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `moshe-dev-${result}`;
  };

  const handleOpenModal = (key) => {
    if (key) {
      setEditingKey(key);
      setFormData({ name: key.name, key: key.key, description: key.description || "" });
      setKeyType(key.type || "development");
      setLimitMonthlyUsage(key.limitMonthlyUsage || false);
      setMonthlyUsageLimit(key.monthlyUsageLimit || "1000");
    } else {
      setEditingKey(null);
      setFormData({ name: "", key: generateApiKey(), description: "" });
      setKeyType("development");
      setLimitMonthlyUsage(false);
      setMonthlyUsageLimit("1000");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKey(null);
    setFormData({ name: "", key: "", description: "" });
    setKeyType("development");
    setLimitMonthlyUsage(false);
    setMonthlyUsageLimit("1000");
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter a name for the API key", "error");
      return;
    }

    if (!formData.key.trim()) {
      showToast("Please enter or generate an API key", "error");
      return;
    }

    try {
      if (editingKey) {
        // Update existing key
        const { data, error } = await supabase
          .from("api_keys")
          .update({
            name: formData.name,
            key: formData.key,
            description: formData.description || null,
            type: keyType,
            limit_monthly_usage: limitMonthlyUsage,
            monthly_usage_limit: limitMonthlyUsage ? parseInt(monthlyUsageLimit) : null,
          })
          .eq("id", editingKey.id)
          .select()
          .single();

        if (error) throw error;

        showToast("API key updated successfully");
      } else {
        // Create new key
        const { data, error } = await supabase
          .from("api_keys")
          .insert({
            name: formData.name,
            key: formData.key,
            description: formData.description || null,
            type: keyType,
            limit_monthly_usage: limitMonthlyUsage,
            monthly_usage_limit: limitMonthlyUsage ? parseInt(monthlyUsageLimit) : null,
            usage_count: 0,
          })
          .select()
          .single();

        if (error) throw error;

        showToast("API key created successfully");
      }

      // Refresh the list
      await fetchApiKeys();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving API key:", error);
      showToast("Failed to save API key: " + error.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      try {
        const { error } = await supabase
          .from("api_keys")
          .delete()
          .eq("id", id);

        if (error) throw error;

        showToast("API key deleted successfully", "delete");
        // Refresh the list
        await fetchApiKeys();
      } catch (error) {
        console.error("Error deleting API key:", error);
        showToast("Failed to delete API key: " + error.message, "error");
      }
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("API key copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredKeys = apiKeys.filter((key) =>
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (key.description && key.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleShowKey = (id) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="mx-auto max-w-7xl px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Pages / Overview</p>
            <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Operational
            </button>
            <div className="flex items-center gap-3">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-300"></div>
          </div>
        </div>

        {/* Announcement Banner */}
        <div className="mb-6 bg-gray-100 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            Official Tavily Agent Skills for Claude Code are now available - enabling real-time search, research, and content extraction directly in your terminal.
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="mb-8 relative overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
          {/* Background Image Effect */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-200 blur-3xl"></div>
          </div>
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">CURRENT PLAN</p>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Researcher</h2>
              </div>
              <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Manage Plan
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">API Usage</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mb-2">Monthly plan</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <p className="text-xs text-gray-600">0/1,000 Credits</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Pay as you go</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">API Keys</h3>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-600">Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="mx-auto h-12 w-12 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No API keys yet
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Get started by creating your first API key
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Create API Key
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USAGE</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KEY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OPTIONS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">{key.type || "dev"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{key.usageCount || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {showKey[key.id] ? key.key : `moshe-dev-${'*'.repeat(25)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleShowKey(key.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title={showKey[key.id] ? "Hide" : "Show"}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => copyToClipboard(key.key, key.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copy"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenModal(key)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(key.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-2 text-2xl font-semibold text-gray-900">
                Create a new API key
              </h2>
              <p className="mb-6 text-sm text-gray-600">
                Enter a name and limit for the new API key.
              </p>
              <form onSubmit={handleSubmit}>
                {/* Key Name */}
                <div className="mb-6">
                  <label
                    htmlFor="name"
                    className="mb-1 block text-sm font-medium text-gray-900"
                  >
                    Key Name
                  </label>
                  <p className="mb-2 text-xs text-gray-500">
                    — A unique name to identify this key
                  </p>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Key Name"
                    required
                  />
                </div>

                {/* Key Type */}
                <div className="mb-6">
                  <label className="mb-1 block text-sm font-medium text-gray-900">
                    Key Type
                  </label>
                  <p className="mb-3 text-xs text-gray-500">
                    — Choose the environment for this key
                  </p>
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
                        <p className="mt-1 text-sm text-gray-600">
                          Rate limited to 100 requests/minute
                        </p>
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
                          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="font-medium text-gray-900">Production</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          Rate limited to 1,000 requests/minute
                        </p>
                      </div>
                      {keyType === "production" && (
                        <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Monthly Usage Limit */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="limitMonthlyUsage"
                      checked={limitMonthlyUsage}
                      onChange={(e) => setLimitMonthlyUsage(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="limitMonthlyUsage"
                      className="text-sm font-medium text-gray-900"
                    >
                      Limit monthly usage<span className="text-red-500">*</span>
                    </label>
                  </div>
                  {limitMonthlyUsage && (
                    <input
                      type="number"
                      value={monthlyUsageLimit}
                      onChange={(e) => setMonthlyUsageLimit(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1000"
                    />
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    * If the combined usage of all your keys exceeds your account's allocated usage limit (plan, add-ons, and any pay-as-you-go limit), all requests will be rejected.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg transition-all ${
              toast.type === "error" || toast.type === "delete"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "error" ? (
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
        )}
      </div>
    </div>
  );
}
