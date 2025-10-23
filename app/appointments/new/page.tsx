"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  client: Client;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export default function NewAppointment() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [appointmentForm, setAppointmentForm] = useState({
    type: "client",
    caseId: "",
    clientId: "",
    userId: "",
    datetime: "",
    location: "",
    notes: "",
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientsRes, casesRes, usersRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/cases"),
          fetch("/api/users"),
        ]);

        if (!clientsRes.ok || !casesRes.ok || !usersRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [clientsData, casesData, usersData] = await Promise.all([
          clientsRes.json(),
          casesRes.json(),
          usersRes.json(),
        ]);

        setClients(clientsData);
        setCases(casesData);
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const appointmentData: any = {
        datetime: appointmentForm.datetime,
        location: appointmentForm.location || undefined,
        notes: appointmentForm.notes || undefined,
        type: appointmentForm.type,
      };

      if (appointmentForm.type === "client") {
        if (appointmentForm.caseId) {
          appointmentData.caseId = appointmentForm.caseId;
        } else if (appointmentForm.clientId) {
          appointmentData.clientId = appointmentForm.clientId;
        } else {
          setFormError("Please select a case or client for client appointments");
          setFormLoading(false);
          return;
        }
      } else if (appointmentForm.type === "lawyer") {
        if (!appointmentForm.userId) {
          setFormError("Please select a lawyer for lawyer appointments");
          setFormLoading(false);
          return;
        }
        appointmentData.userId = appointmentForm.userId;
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to create appointment");
      }
    } catch (error) {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setAppointmentForm({
      ...appointmentForm,
      type,
      caseId: "",
      clientId: "",
      userId: "",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-red-600">
          Error loading appointments: {error.message}
        </div>
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
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Schedule New Appointment
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Appointment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Appointment Type *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="client"
                        checked={appointmentForm.type === "client"}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className="mr-2"
                      />
                      Client Appointment
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="lawyer"
                        checked={appointmentForm.type === "lawyer"}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className="mr-2"
                      />
                      Lawyer Appointment
                    </label>
                  </div>
                </div>

                {/* Client Appointment Fields */}
                {appointmentForm.type === "client" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Case (Optional - for case-specific appointments)
                      </label>
                      <select
                        value={appointmentForm.caseId}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, caseId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Select a case (optional)...</option>
                        {cases.map((caseItem) => (
                          <option key={caseItem.id} value={caseItem.id}>
                            {caseItem.title} - {caseItem.client.firstName} {caseItem.client.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!appointmentForm.caseId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Or Select Client *
                        </label>
                        <select
                          required={!appointmentForm.caseId}
                          value={appointmentForm.clientId}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, clientId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Choose a client...</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.firstName} {client.lastName} - {client.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Lawyer Appointment Fields */}
                {appointmentForm.type === "lawyer" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Lawyer *
                    </label>
                    <select
                      required
                      value={appointmentForm.userId}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Choose a lawyer...</option>
                      {users.filter(user => user.role === "lawyer").map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} - {user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date and Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={appointmentForm.datetime}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, datetime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={appointmentForm.location}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Office address, virtual meeting link, etc."
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Additional notes or agenda items"
                  />
                </div>

                {formError && (
                  <div className="text-red-600 text-sm">{formError}</div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                  >
                    {formLoading ? "Scheduling..." : "Schedule Appointment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}