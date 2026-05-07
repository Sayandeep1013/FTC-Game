"use client";

import { useState } from "react";
import { updateUsername } from "@/lib/auth/profile-actions";

export function ProfileForm({ currentUsername }: { currentUsername: string }) {
  const [username, setUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const result = await updateUsername(username);
    setSaving(false);
    if (result.error) {
      setMsg({ type: "err", text: result.error });
    } else {
      setMsg({ type: "ok", text: "Username updated!" });
    }
  }

  return (
    <div className="panel-brutal">
      <div className="px-4 py-2 border-b-2 border-black bg-grey-light">
        <p className="text-[10px] font-bold uppercase tracking-widest text-grey-dark">Edit Username</p>
      </div>
      <div className="px-5 py-5">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-grey-dark mb-2">
          Username
        </label>
        <input
          className="input-brutal mb-1"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === "Enter" && save()}
          maxLength={30}
          placeholder="your_username"
        />
        <p className="text-[10px] text-grey-mid mb-4">Letters, numbers, underscores only. Unique.</p>

        {msg && (
          <p className={`text-xs font-bold px-3 py-2 border border-black mb-3 ${
            msg.type === "ok" ? "bg-grey-light" : "bg-grey-light"
          }`}>
            {msg.type === "ok" ? "✓ " : "✗ "}{msg.text}
          </p>
        )}

        <button
          className="btn-brutal btn-primary w-full"
          onClick={save}
          disabled={saving || username === currentUsername}
        >
          {saving ? "Saving..." : "Save Username"}
        </button>
      </div>
    </div>
  );
}
