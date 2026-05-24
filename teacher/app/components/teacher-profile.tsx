"use client";

import React, { useEffect, useRef, useState } from "react";
import { User, Camera, Mail, Phone, Building2, BookOpen, Lock, Save, AlertCircle, CheckCircle, Award, Info } from "lucide-react";
import { apiFetch, getUser, saveSession, getToken, API_BASE_URL } from "../lib/api";
import { COLORS } from "../lib/constants";

type ProfileData = {
  _id: string;
  fullName: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  role: string;
  school: { _id: string; name: string; code: string } | null;
  classes: { _id: string; name: string; grade: number }[];
  points: number;
};

type DlgState = { type: "error" | "success"; title: string; message: string } | null;

/* ── Inline Status Banner ─────────────────────────────────────── */
function Banner({ state, onClose }: { state: DlgState; onClose: () => void }) {
  if (!state) return null;
  const isErr = state.type === "error";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "0.75rem",
      padding: "0.875rem 1rem", borderRadius: "0.625rem",
      background: isErr ? COLORS.dangerSoft : COLORS.successSoft,
      border: `1px solid ${isErr ? COLORS.danger : COLORS.success}`,
      marginBottom: "1.25rem",
    }}>
      {isErr
        ? <AlertCircle size={18} color={COLORS.danger} style={{ flexShrink: 0, marginTop: 1 }} />
        : <CheckCircle size={18} color={COLORS.success} style={{ flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: isErr ? COLORS.danger : COLORS.success }}>{state.title}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>{state.message}</div>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0 2px" }}>x</button>
    </div>
  );
}

/* ── Field ────────────────────────────────────────────────────── */
function Field({ label, icon: Icon, value, onChange, type = "text", readOnly = false, placeholder = "" }: {
  label: string; icon: React.ElementType; value: string;
  onChange?: (v: string) => void; type?: string; readOnly?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.375rem" }}>
        <Icon size={11} /> {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange && onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "0.625rem 0.75rem",
            borderRadius: "0.5rem", border: `1px solid var(--border)`,
            background: readOnly ? "var(--surface-soft)" : "var(--surface)",
            color: readOnly ? "var(--muted)" : "var(--foreground)",
            fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
            paddingRight: readOnly ? "2.25rem" : "0.75rem",
            cursor: readOnly ? "not-allowed" : "text",
          }}
        />
        {readOnly && (
          <Lock size={13} color="var(--muted)" style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
        )}
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export function TeacherProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<DlgState>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch("/users/teacher/dashboard")
      .then((d: any) => {
        const t = d.teacher;
        setProfile({
          _id: t._id,
          fullName: t.fullName,
          email: t.email,
          phone: t.phone ?? null,
          profileImage: t.profileImage ?? null,
          role: "Teacher",
          school: d.school ?? null,
          classes: d.classes ?? [],
          points: t.points ?? 0,
        });
        setFullName(t.fullName);
        setPhone(t.phone ?? "");
        if (t.profileImage) {
          setImagePreview(`${API_BASE_URL.replace("/api", "")}${t.profileImage}`);
        }
      })
      .catch(() => setBanner({ type: "error", title: "Load Failed", message: "Could not load profile data." }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setBanner({ type: "error", title: "Name Required", message: "Full name cannot be empty." });
      return;
    }
    setSaving(true);
    try {
      if (imageFile && profile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        fd.append("fullName", fullName.trim());
        if (phone.trim()) fd.append("phone", phone.trim());
        if (password.trim()) fd.append("password", password.trim());
        await fetch(`${API_BASE_URL}/users/profile`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd,
        }).then(r => { if (!r.ok) throw new Error("Upload failed"); return r.json(); });
      } else {
        const body: Record<string, string> = { fullName: fullName.trim() };
        if (phone.trim()) body.phone = phone.trim();
        if (password.trim()) body.password = password.trim();
        await apiFetch("/users/profile", { method: "PATCH", body: JSON.stringify(body) });
      }

      // Update cached user
      const raw = localStorage.getItem("teacherUser");
      if (raw) {
        const u = JSON.parse(raw);
        u.fullName = fullName.trim();
        saveSession(getToken(), u);
      }

      setPassword("");
      setImageFile(null);
      setBanner({ type: "success", title: "Profile Updated", message: "Your profile has been saved successfully." });
    } catch (err: any) {
      setBanner({ type: "error", title: "Save Failed", message: err.message || "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
        <div style={{ width: 28, height: 28, border: `3px solid var(--border)`, borderTopColor: COLORS.accent, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!profile) {
    return <div style={{ padding: "2rem", color: "var(--muted)" }}>Profile data unavailable.</div>;
  }

  const initials = profile.fullName.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", animation: "slideUp 0.3s ease-out" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", background: "var(--surface)", padding: "1.25rem 1.5rem", borderRadius: "0.875rem", border: "1px solid var(--border)" }}>
        <div style={{ width: 42, height: 42, borderRadius: "0.75rem", background: COLORS.accentSoft, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={22} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em" }}>My Profile</h2>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Manage your personal details and account settings</p>
        </div>
      </div>

      <Banner state={banner} onClose={() => setBanner(null)} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.25rem", alignItems: "start" }}>
        {/* Left — avatar + read-only info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Avatar card */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div
              style={{ position: "relative", width: 88, height: 88, borderRadius: 24, overflow: "hidden", background: COLORS.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${COLORS.accent}30` }}
              onClick={() => imageRef.current?.click()}
            >
              {imagePreview
                ? <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: "2rem", fontWeight: 900, color: COLORS.accentText }}>{initials}</span>}
              <div
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
              >
                <Camera size={22} color="#fff" />
              </div>
            </div>
            <input ref={imageRef} type="file" accept="image/jpeg,image/png" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--foreground)" }}>{profile.fullName}</div>
              <div style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: 2 }}>Teacher</div>
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--muted)", textAlign: "center" }}>
              Click avatar to change photo<br /><span style={{ fontSize: "0.625rem" }}>JPG or PNG, max 5MB</span>
            </div>
          </div>

          {/* School & Classes */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>School &amp; Classes</div>
            {profile.school && (
              <div>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Building2 size={11} /> School
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--foreground)" }}>{profile.school.name}</div>
                <div style={{ fontSize: "0.625rem", color: "var(--muted)", marginTop: 1 }}>{profile.school.code}</div>
              </div>
            )}
            {profile.classes.length > 0 && (
              <div>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <BookOpen size={11} /> Assigned Classes
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {profile.classes.map(c => (
                    <span key={c._id} style={{ fontSize: "0.6875rem", fontWeight: 600, color: COLORS.accent, background: COLORS.accentSoft, padding: "0.2rem 0.5rem", borderRadius: "0.25rem", border: `1px solid ${COLORS.accentSoftBorder}` }}>
                      {c.name}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: "0.625rem", color: "var(--muted)", marginTop: 6 }}>Class assignments are managed by the administrator</div>
              </div>
            )}
          </div>
        </div>

        {/* Right — edit form */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", overflow: "hidden" }}>
          <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--foreground)" }}>Edit Profile</div>
            <div style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: 2 }}>Update your name, phone, or password below</div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.125rem" }}>
              <Field label="Email Address" icon={Mail} value={profile.email} readOnly />
              <Field label="Role" icon={User} value="Teacher" readOnly />

              <div style={{ height: 1, background: "var(--border)" }} />

              <Field label="Full Name" icon={User} value={fullName} onChange={setFullName} placeholder="Your full name" />
              <Field label="Phone Number" icon={Phone} value={phone} onChange={setPhone} placeholder="Optional contact number" />
              <Field label="New Password" icon={Lock} value={password} onChange={setPassword} type="password" placeholder="Leave blank to keep current" />
            </div>

            <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface-soft)", padding: "0.875rem 1.5rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={saving}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", background: COLORS.accent, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5625rem 1.25rem", fontWeight: 700, fontSize: "0.8125rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Points Explanation Panel */}
      <div style={{ marginTop: "1.25rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem", background: COLORS.accentSoft }}>
          <Award size={18} color={COLORS.accent} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--foreground)" }}>How Students Earn Points</div>
            <div style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: 1 }}>Reference guide for teachers — award points transparently</div>
          </div>
        </div>
        <div style={{ padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {[
            { label: "Completing a Lesson", desc: "Students earn points when all items in a lesson (videos, quizzes, assignments, activities) are completed.", color: COLORS.success },
            { label: "Quiz Scores", desc: "Points are awarded based on the score achieved on each quiz attempt. Higher scores yield more points.", color: COLORS.info },
            { label: "Approved Submissions", desc: "When you review and approve an assignment or activity submission, you manually set the points awarded for that work.", color: COLORS.accent },
            { label: "Teacher Bonus Points", desc: "You can award or deduct bonus points from the Leaderboard panel at any time. Always provide a reason for transparency.", color: COLORS.warning },
          ].map(item => (
            <div key={item.label} style={{ padding: "0.875rem", borderRadius: "0.625rem", background: "var(--surface-soft)", border: `1px solid var(--border)`, display: "flex", gap: "0.75rem" }}>
              <div style={{ width: 8, borderRadius: 4, background: item.color, flexShrink: 0, alignSelf: "stretch" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.55 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "0.875rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--surface-soft)", display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
          <Info size={14} color={COLORS.info} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.5 }}>
            Points are cumulative and visible to students on the Leaderboard. All manual point adjustments you make are recorded with your stated reason.
          </span>
        </div>
      </div>
    </div>
  );
}
