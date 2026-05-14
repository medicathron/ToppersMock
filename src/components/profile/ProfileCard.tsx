"use client";
import { useState } from "react";
import ProfileEditForm from "./ProfileEditForm";

interface Profile {
  firstname: string;
  surname: string;
  phone: string;
  faculty: string;
  dept: string;
  aimedScore: number;
}

interface Props {
  profile: Profile;
  matric: string;
}

export default function ProfileCard({ profile, matric }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}
      className="p-6 mb-6"
    >
      {editing ? (
        <>
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ color: "var(--dark)", fontWeight: 700, fontSize: 16 }}>Edit Profile</h2>
          </div>
          <ProfileEditForm profile={profile} onCancel={() => setEditing(false)} />
        </>
      ) : (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 26, lineHeight: 1.2 }}>
              {profile.surname} {profile.firstname}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 14 }} className="mt-0.5">Matric: {matric}</p>
            <p style={{ color: "var(--muted)", fontSize: 13 }} className="mt-0.5">
              {profile.dept} · {profile.faculty}
            </p>
            <p style={{ color: "var(--muted)", fontSize: 12 }} className="mt-0.5">
              {profile.phone}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>Target Score</p>
              <p style={{ color: "var(--orange)", fontWeight: 700, fontSize: 28 }}>{profile.aimedScore}%</p>
            </div>
            <button
              onClick={() => setEditing(true)}
              style={{
                border: "1px solid var(--border)", borderRadius: 8,
                color: "var(--dark)", fontSize: 13,
              }}
              className="px-4 py-1.5 font-medium hover:bg-orange-pale transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
