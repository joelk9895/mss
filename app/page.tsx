"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

type ClientView = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default function Home() {
  const [clients, setClients] = useState<ClientView[] | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(data))
      .catch(() => setClients([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newClient = await res.json();
      setClients((prev) => (prev ? [...prev, newClient] : [newClient]));
      setForm({ firstName: "", lastName: "", email: "" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="w-full">
          <h2 className="mb-4 text-lg font-semibold">Clients</h2>
          <form onSubmit={handleSubmit} className="mb-6 rounded border p-4">
            <div className="mb-2">
              <input
                type="text"
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
                className="border p-1 mr-2"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
                className="border p-1 mr-2"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="border p-1 mr-2"
              />
              <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">
                Add Client
              </button>
            </div>
          </form>
          <div className="mb-6 rounded border p-4">
            {!clients ? (
              <div>Loading clients...</div>
            ) : clients.length === 0 ? (
              <div>No clients yet.</div>
            ) : (
              <ul>
                {clients.map((c) => (
                  <li key={c.id} className="py-1">
                    {c.firstName} {c.lastName} — {c.email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="/register"
          >
            Register
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="/login"
          >
            Login
          </a>
        </div>
      </main>
    </div>
  );
}
