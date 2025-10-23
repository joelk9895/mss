"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

type Case = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
};

type Appointment = {
  id: string;
  date: string;
  time: string;
  type: string;
  location?: string;
  notes?: string;
  case?: {
    title: string;
  };
  user?: {
    firstName: string;
    lastName: string;
  };
};

type Document = {
  id: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
  url: string;
  case: {
    title: string;
  };
};

type Billing = {
  id: string;
  amount: number;
  status: string;
  description: string;
  dueDate: string;
  case: {
    title: string;
  };
};

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType === 'text/plain') return '📄';
  return '📎';
}

export default function ClientDashboard() {
  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cases");

  useEffect(() => {
    const fetchClientData = async () => {
      // Get user from sessionStorage
      const userData = sessionStorage.getItem("user");
      if (!userData) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);
      if (user.userType !== "client") {
        window.location.href = "/dashboard";
        return;
      }

      setClient(user);

      try {
        // Fetch client's data in parallel
        const [casesRes, appointmentsRes, documentsRes, billingsRes] = await Promise.all([
          fetch("/api/cases?clientId=" + user.id),
          fetch("/api/appointments?clientId=" + user.id),
          fetch("/api/documents?clientId=" + user.id),
          fetch("/api/billings?clientId=" + user.id),
        ]);

        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData);
        }

        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          const formattedAppointments = appointmentsData.map((apt: any) => {
            const dateObj = new Date(apt.datetime);
            return {
              id: apt.id,
              date: dateObj.toISOString().split('T')[0],
              time: dateObj.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              }),
              type: apt.type,
              location: apt.location,
              notes: apt.notes,
              case: apt.case,
              user: apt.user,
            };
          });
          setAppointments(formattedAppointments);
        }

        if (documentsRes.ok) {
          const documentsData = await documentsRes.json();
          setDocuments(documentsData);
        }

        if (billingsRes.ok) {
          const billingsData = await billingsRes.json();
          setBillings(billingsData);
        }
      } catch (error) {
        console.error("Failed to fetch client data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading your dashboard...</div>
      </div>
    );
  }

  
if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="card p-8">
          <p className="text-lg text-center">Please log in to access your dashboard.</p>
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
              <h1 className="text-2xl font-bold">Client Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                Welcome, {client.firstName} {client.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "cases", label: "My Cases", count: cases.length },
                { id: "appointments", label: "Appointments", count: appointments.length },
                { id: "documents", label: "Documents", count: documents.length },
                { id: "billing", label: "Billing", count: billings.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "cases" && (
            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  My Cases
                </h3>
                {cases.length === 0 ? (
                  <p className="text-gray-500">No cases found.</p>
                ) : (
                  <div className="space-y-4">
                    {cases.map((caseItem) => (
                      <div key={caseItem.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium text-gray-900 dark:text-white">
                            {caseItem.title}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            caseItem.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : caseItem.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : caseItem.status === 'closed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {caseItem.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {caseItem.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {new Date(caseItem.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Upcoming Appointments
                </h3>
                {appointments.length === 0 ? (
                  <p className="text-gray-500">No upcoming appointments.</p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white">
                              {appointment.type === "client" ? "Client Appointment" : "Lawyer Appointment"}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {appointment.case ? `Case: ${appointment.case.title}` : "General Appointment"}
                            </p>
                            {appointment.user && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                With: {appointment.user.firstName} {appointment.user.lastName}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(appointment.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.time}
                            </p>
                            {appointment.location && (
                              <p className="text-sm text-gray-500">
                                {appointment.location}
                              </p>
                            )}
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Notes: {appointment.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Case Documents
                </h3>
                {documents.length === 0 ? (
                  <p className="text-gray-500">No documents available.</p>
                ) : (
                  <div className="space-y-4">
                    {documents.map((document) => (
                      <div key={document.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl">{getFileIcon(document.mimeType)}</span>
                            <div>
                              <a
                                href={document.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-md font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline"
                              >
                                {document.filename}
                              </a>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Case: {document.case.title}
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
          )}

          {activeTab === "billing" && (
            <div className="bg-white dark:bg-gray-900 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Billing & Payments
                </h3>
                {billings.length === 0 ? (
                  <p className="text-gray-500">No billing records found.</p>
                ) : (
                  <div className="space-y-4">
                    {billings.map((billing) => (
                      <div key={billing.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white">
                              ${billing.amount.toFixed(2)}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {billing.description}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Case: {billing.case.title}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              billing.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : billing.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {billing.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {new Date(billing.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}