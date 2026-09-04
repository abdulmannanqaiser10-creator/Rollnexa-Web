"use client";

import { useState } from "react";
import { slugify } from "@/lib/slug";

type CatalogFormProps = {
  mode: "create" | "edit";
  type: "category" | "brand";
  initial?: { id?: string; name: string; slug?: string; description?: string };
};

export function AdminCatalogForm({ mode, type, initial }: CatalogFormProps) {
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const endpoint =
      mode === "create"
        ? `/api/admin/${type === "category" ? "categories" : "brands"}`
        : `/api/admin/${type === "category" ? "categories" : "brands"}/${initial?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const body =
      type === "category"
        ? { name, slug: slug || slugify(name), description }
        : { name, slug: slug || slugify(name) };

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "Save failed.");
        return;
      }
      setMessage(mode === "create" ? "Created." : "Updated.");
      if (mode === "create") {
        setName("");
        setSlug("");
        setDescription("");
      }
    } catch (error) {
      console.error("[admin/catalog-form] failed:", error);
      setMessage("Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rn-panel space-y-3">
      <h3 className="font-display text-lg font-bold text-rn-ink">
        {mode === "create" ? `Add ${type}` : `Edit ${type}`}
      </h3>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        className="h-10 w-full rounded-lg border border-black/10 px-3 text-sm"
        required
      />
      <input
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        placeholder="Slug (optional)"
        className="h-10 w-full rounded-lg border border-black/10 px-3 text-sm"
      />
      {type === "category" ? (
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          rows={3}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      ) : null}
      <button type="submit" disabled={loading} className="rn-btn-primary disabled:opacity-60">
        {loading ? "Saving..." : mode === "create" ? "Create" : "Update"}
      </button>
      {message ? <p className="text-sm text-rn-muted">{message}</p> : null}
    </form>
  );
}
