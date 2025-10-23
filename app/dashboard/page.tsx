"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

  type Case = {
    id: string;
    title: string;
    status: "active" | "pending" | "closed";
    client: Client;
    appointments?: Array<{
      id: string;
      datetime: string;
      location: string | null;
    }>;
  };export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    notes: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, casesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/cases?include=appointments"),
        ]);

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData);
        }

        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusChange = async (caseId: string, newStatus: Case['status']) => {
    if (!caseId || typeof caseId !== 'string') {
      console.error('Invalid case ID:', caseId);
      alert('Error: Invalid case ID');
      return;
    }
    
    setStatusLoading(caseId);
    
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        setCases(prevCases => 
          prevCases.map(c => 
            c.id === caseId ? { ...c, status: newStatus } : c
          )
        );
      } else {
        console.error('Error updating case status:', data.error);
        alert(data.error || 'Failed to update case status');
        // Revert the select to the previous value
        const currentCase = cases.find(c => c.id === caseId);
        if (currentCase) {
          const selectElement = document.querySelector(`select[data-case-id="${caseId}"]`) as HTMLSelectElement;
          if (selectElement) {
            selectElement.value = currentCase.status;
          }
        }
      }
    } catch (error) {
      console.error('Error updating case status:', error);
      alert('Failed to update case status. Please try again.');
    } finally {
      setStatusLoading(null);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientForm),
      });

      if (res.ok) {
        const newClient = await res.json();
        setClients((prev) => [...prev, newClient]);
        setShowAddClient(false);
        setClientForm({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phone: "",
          notes: "",
        });
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to add client");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-black">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-black">MSS Legal</h1>
                <span className="text-xs text-zinc-400">Dashboard</span>
              </div>
            </div>
            <nav className="flex gap-8">
              <button
                onClick={() => (window.location.href = "/")}
                className="text-sm text-zinc-600 hover:text-black transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => (window.location.href = "/logout")}
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Clients & Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clients Section */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:border-zinc-300 transition-colors">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-black">Clients</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {clients.length} total
                  </p>
                </div>
                <button
                  onClick={() => setShowAddClient(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Client
                </button>
              </div>

              <div className="relative">
                {clients.length === 0 ? (
                  <p className="text-zinc-400 text-sm">No clients yet.</p>
                ) : (
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
                    <ul className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent hover:scrollbar-thumb-zinc-300 pr-2">
                      {clients.map((client) => (
                        <li key={client.id} className="py-4 first:pt-0">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-zinc-600">
                                {client.firstName[0]}{client.lastName[0]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-black truncate">
                                {client.firstName} {client.lastName}
                              </p>
                              <p className="text-sm text-zinc-400 truncate">
                                {client.email}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Cases Section */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 hover:border-zinc-300 transition-colors">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-black">Cases</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  {cases.length} total
                </p>
              </div>

              <div className="relative">
                {cases.length === 0 ? (
                  <p className="text-zinc-400 text-sm">No cases yet.</p>
                ) : (
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
                    <ul className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent hover:scrollbar-thumb-zinc-300 pr-2">
                      {cases.map((caseItem) => (
                        <li key={caseItem.id} className="py-4 first:pt-0">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-black truncate">
                                {caseItem.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-sm text-zinc-400 truncate">
                                  {caseItem.client.firstName} {caseItem.client.lastName}
                                </p>
                                {caseItem.appointments?.some(apt => isValidUrl(apt.location || '')) && (
                                  <button
                                    onClick={() => {
                                      const apt = caseItem.appointments?.find(a => isValidUrl(a.location || ''));
                                      if (apt?.location) window.open(apt.location, '_blank');
                                    }}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                  >
                                    Join Meeting
                                  </button>
                                )}
                              </div>
                            </div>
                            <select
                              value={caseItem.status}
                              onChange={(e) => handleStatusChange(caseItem.id, e.target.value as Case['status'])}
                              disabled={statusLoading === caseItem.id}
                              data-case-id={caseItem.id}
                              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap appearance-none cursor-pointer
                                ${statusLoading === caseItem.id ? 'opacity-50' : ''}
                                ${caseItem.status === "active"
                                  ? "bg-blue-50 text-blue-600"
                                  : caseItem.status === "pending"
                                  ? "bg-zinc-100 text-zinc-600"
                                  : "bg-zinc-50 text-zinc-500"
                                }`}
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-black mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => (window.location.href = "/cases/new")}
                className="px-6 py-4 bg-black text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
              >
                New Case
              </button>
              <button
                onClick={() => (window.location.href = "/appointments/new")}
                className="px-6 py-4 bg-white border border-zinc-200 text-black text-sm font-medium rounded-xl hover:border-zinc-300 transition-colors"
              >
                Schedule Appointment
              </button>
              <button
                onClick={() => (window.location.href = "/documents")}
                className="px-6 py-4 bg-white border border-zinc-200 text-black text-sm font-medium rounded-xl hover:border-zinc-300 transition-colors"
              >
                Manage Documents
              </button>
              <button
                onClick={() => (window.location.href = "/billings")}
                className="px-6 py-4 bg-white border border-zinc-200 text-black text-sm font-medium rounded-xl hover:border-zinc-300 transition-colors"
              >
                View Billings
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl w-full  p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-black">Add New Client</h2>
              <button
                onClick={() => setShowAddClient(false)}
                className="text-zinc-400 hover:text-black transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={clientForm.firstName}
                    onChange={(e) =>
                      setClientForm({ ...clientForm, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-black placeholder-zinc-400 focus:outline-none focus:border-blue-600 transition-colors"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={clientForm.lastName}
                    onChange={(e) =>
                      setClientForm({ ...clientForm, lastName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-black placeholder-zinc-400 focus:outline-none focus:border-blue-600 transition-colors"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={clientForm.email}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-black placeholder-zinc-400 focus:outline-none focus:border-blue-600 transition-colors"
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={clientForm.password}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-black placeholder-zinc-400 focus:outline-none focus:border-blue-600 transition-colors"
                  placeholder="Create a password"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={clientForm.phone}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, phone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-black placeholder-zinc-400 focus:outline-none focus:border-blue-600 transition-colors"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Notes (Optional)</label>
                <textarea
                  value={clientForm.notes}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, notes: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-black placeholder-zinc-400 focus:outline-none focus:border-blue-600 transition-colors resize-none"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>

              {formError && (
                <div className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="flex-1 px-6 py-3 bg-white border border-zinc-200 text-black text-sm font-medium rounded-lg hover:border-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {formLoading ? "Adding..." : "Add Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}