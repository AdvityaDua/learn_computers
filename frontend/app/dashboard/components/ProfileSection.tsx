"use client";

import React, { useEffect, useState } from "react";
import type { UserData } from "./types";
import { API_BASE } from "./types";

interface ProfileSectionProps {
  user: UserData | null;
  onUpdate: (u: UserData) => void;
}

export default function ProfileSection({ user, onUpdate }: ProfileSectionProps) {
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(user?.fullName || "");
  }, [user?.fullName]);

  const updateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
        body: JSON.stringify({ fullName }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const data = (await res.json()) as UserData;
      onUpdate(data);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8">
      <div className="panel rounded-3xl p-6 md:p-8">
        <h2 className="text-2xl font-black">Profile Settings</h2>
        <p className="theme-muted mt-1 text-sm">
          Keep your profile updated for personalized insights.
        </p>

        <form className="mt-6 space-y-4" onSubmit={updateName}>
          <div>
            <label className="theme-muted mb-1 block text-sm font-semibold">
              Email
            </label>
            <input
              className="input-theme opacity-70"
              value={user?.email || ""}
              disabled
            />
          </div>
          <div>
            <label className="theme-muted mb-1 block text-sm font-semibold">
              Full Name
            </label>
            <input
              className="input-theme"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
          {message && (
            <p className="text-sm font-semibold text-green-600">{message}</p>
          )}
          <button
            className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
