"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

type Case = {
  id: string;
  title: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

type Document = {
  id: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
  case: {
    title: string;
    client: {
      firstName: string;
      lastName: string;
    };
  };
};

export default function Documents() {
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    caseId: "",
    file: null as File | null,
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, documentsRes] = await Promise.all([
          fetch("/api/cases"),
          fetch("/api/documents"),
        ]);

        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData);
        }

        if (documentsRes.ok) {
          const documentsData = await documentsRes.json();
          setDocuments(documentsData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.caseId) {
      setUploadError("Please select a case and file");
      return;
    }

    setUploadLoading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("caseId", uploadForm.caseId);
      formData.append("file", uploadForm.file);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newDocument = await res.json();
        setDocuments((prev) => [...prev, newDocument]);
        setShowUpload(false);
        setUploadForm({ caseId: "", file: null });
      } else {
        const data = await res.json();
        setUploadError(data.error || "Failed to upload document");
      }
    } catch (error) {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
    return "📄";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image
                className="dark:invert mr-4"
                src="/next.svg"
                alt="Next.js logo"
                width={100}
                height={20}
                priority
              />
              <h1 className="text-2xl font-bold">Lawyer Dashboard</h1>
            </div>
            <nav className="flex space-x-4">
              <a href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</a>
              <a href="/logout" className="text-red-600 hover:underline">Logout</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Document Management
            </h2>
            <button
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Upload Document
            </button>
          </div>

          {/* Documents List */}
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                All Documents ({documents.length})
              </h3>
              {documents.length === 0 ? (
                <p className="text-gray-500">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-4">
                  {documents.map((document) => (
                    <div key={document.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{getFileIcon(document.mimeType)}</span>
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white">
                              {document.filename}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Case: {document.case.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Client: {document.case.client.firstName} {document.case.client.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {document.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Upload Document</h2>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Case *</label>
                <select
                  required
                  value={uploadForm.caseId}
                  onChange={(e) => setUploadForm({ ...uploadForm, caseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Choose a case...</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.title} - {caseItem.client.firstName} {caseItem.client.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select File *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG
                </p>
              </div>

              {uploadError && (
                <div className="text-red-600 text-sm">{uploadError}</div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {uploadLoading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}