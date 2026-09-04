"use client";

import { useState } from "react";

type AdminUserActionsProps = {
  userId: string;
  role: "BUYER" | "SELLER" | "ADMIN";
  accountStatus: "ACTIVE" | "BLOCKED" | "SUSPENDED";
  isSelf: boolean;
};

export function AdminUserActions({
  userId,
  role,
  accountStatus,
  isSelf,
}: AdminUserActionsProps) {
  const [status, setStatus] = useState(accountStatus);
  const [userRole, setUserRole] = useState(role);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(updates: {
    accountStatus?: typeof status;
    role?: typeof userRole;
  }) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "Update failed.");
        return;
      }
      if (updates.accountStatus) setStatus(updates.accountStatus);
      if (updates.role) setUserRole(updates.role);
      setMessage("Updated.");
    } catch (error) {
      console.error("[admin/user-actions] failed:", error);
      setMessage("Update failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        disabled={loading || isSelf}
        onChange={(event) =>
          save({ accountStatus: event.target.value as typeof status })
        }
        className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs"
      >
        <option value="ACTIVE">Active</option>
        <option value="BLOCKED">Blocked</option>
        <option value="SUSPENDED">Suspended</option>
      </select>
      <select
        value={userRole}
        disabled={loading || isSelf || role === "ADMIN"}
        onChange={(event) => save({ role: event.target.value as typeof userRole })}
        className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs"
      >
        <option value="BUYER">Buyer</option>
        <option value="SELLER">Seller</option>
        <option value="ADMIN">Admin</option>
      </select>
      {message ? <span className="text-xs text-rn-muted">{message}</span> : null}
    </div>
  );
}
