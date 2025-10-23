"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const user = await res.json();
        // Store user info in sessionStorage for now
        sessionStorage.setItem("user", JSON.stringify(user));
        // Redirect based on user type
        if (user.userType === "client") {
          router.push("/client-dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="card w-full max-w-4xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-500">MSS</h1>
          <p className="text-sm text-zinc-500 mt-1">Legal Management System</p>
        </div>

        <div className="w-full">
          <h2 className="text-xl font-medium text-center mb-8">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Don't have an account?{" "}
              <a href="/register" className="text-blue-500 hover:text-blue-600">
                Create an account
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}