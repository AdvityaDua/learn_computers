"use client";

import React, { useRef, useState } from "react";
import { Camera, Mail, Phone, Save, Sparkles, Users } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { SectionHeader } from "../section-header";
import { useAuth } from "../../context/auth-context";
import { useAsync } from "../../lib/use-async";
import { getMyTeachers, updateProfile } from "../../lib/data";
import { resolveAssetUrl } from "../../lib/asset-url";

export function ProfileSection() {
  const { profile, refreshProfile } = useAuth();
  const { data: teachers } = useAsync(() => getMyTeachers(), []);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!profile) return null;

  const handleFileChange = (file: File | null) => {
    setPendingFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      if (pendingFile) {
        const formData = new FormData();
        formData.append("fullName", fullName);
        formData.append("phone", phone);
        formData.append("image", pendingFile);
        await updateProfile(formData);
      } else {
        await updateProfile({ fullName, phone });
      }
      await refreshProfile();
      setPendingFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeader title="My Profile" subtitle="Keep your details up to date." />

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-5">
          <div className="relative">
            <Avatar name={fullName || profile.fullName} src={preview ?? resolveAssetUrl(profile.profileImage)} size={72} />
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Change photo"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-primary text-white shadow-[var(--shadow-card)]"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold">{profile.fullName}</p>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-warning">
              <Sparkles size={14} /> {profile.points} points earned
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-md border border-border bg-surface px-3.5 text-[15px] outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-muted">
              <Mail size={14} /> Email
            </span>
            <input
              value={profile.email}
              disabled
              className="h-11 rounded-md border border-border bg-surface-soft px-3.5 text-[15px] text-muted outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Phone size={14} /> Phone
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="h-11 rounded-md border border-border bg-surface px-3.5 text-[15px] outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} isLoading={saving}>
            <Save size={16} /> Save changes
          </Button>
          {saved ? <span className="text-sm font-semibold text-success">Saved!</span> : null}
        </div>
      </Card>

      {teachers && teachers.length > 0 ? (
        <Card className="mt-4 p-6">
          <p className="mb-3 flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold">
            <Users size={18} /> My Teacher{teachers.length > 1 ? "s" : ""}
          </p>
          <div className="flex flex-col gap-3">
            {teachers.map((t) => (
              <div key={t._id} className="flex items-center gap-3">
                <Avatar name={t.fullName} src={resolveAssetUrl(t.profileImage)} size={36} />
                <div>
                  <p className="text-sm font-semibold">{t.fullName}</p>
                  <p className="text-xs text-muted">{t.email}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="mt-4 flex justify-center">
        <Badge tone="primary">Class {profile.classIds?.[0]?.replace("Class ", "") ?? "-"}</Badge>
      </div>
    </div>
  );
}
