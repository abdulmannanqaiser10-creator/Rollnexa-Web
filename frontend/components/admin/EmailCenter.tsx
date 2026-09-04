"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_TYPES = [
  { value: "welcome", label: "Welcome Email" },
  { value: "verification", label: "Email Verification" },
  { value: "reset", label: "Password Reset" },
  { value: "announcement", label: "Admin Announcement" },
];

export function EmailCenter() {
  const [type, setType] = useState("welcome");
  const [recipient, setRecipient] = useState("");
  const [title, setTitle] = useState("Rollnexa update");
  const [description, setDescription] = useState("A new announcement is on the way.");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const previewUrl = useMemo(() => {
    if (!recipient) return null;
    return `/api/admin/emails/preview?type=${type}&to=${encodeURIComponent(recipient)}`;
  }, [recipient, type]);

  async function handleSend() {
    setLoading(true);
    setStatus(null);

    try {
      const payload = {
        type,
        to: recipient,
        title,
        description,
      };

      const response = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus(result?.error || "Unable to send email");
        return;
      }
      setStatus(result?.message || "Email request accepted");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Email Center</p>
        <h2 className="mt-1 text-xl font-semibold text-stone-900">Preview and send transactional emails</h2>
        <p className="mt-2 text-sm text-stone-600">Admins can preview templates and issue announcement emails without leaving the console.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email-type">Email type</Label>
          <select
            id="email-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-10 w-full rounded-lg border border-stone-300 px-3 text-sm"
          >
            {EMAIL_TYPES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient email</Label>
          <Input id="recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="admin@example.com" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Announcement title</Label>
          <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Important update" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Announcement description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-28 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={handleSend} disabled={loading || !recipient}>
          {loading ? "Sending..." : "Send preview / announcement"}
        </Button>
        {previewUrl ? (
          <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-amber-600">
            Open preview
          </a>
        ) : null}
      </div>

      {status ? <p className="mt-4 text-sm text-stone-600">{status}</p> : null}
    </div>
  );
}
