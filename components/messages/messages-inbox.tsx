"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import type {
  ChatMessage,
  ConversationDetail,
  ConversationListItem,
} from "@/lib/messaging/types";
import { formatMessageTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const FALLBACK =
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=200&q=60";

type MessagesInboxProps = {
  basePath: "/buyer/messages" | "/seller/messages";
  browseHref?: string;
};

export function MessagesInbox({
  basePath,
  browseHref = "/machines",
}: MessagesInboxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c");

  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [active, setActive] = useState<ConversationDetail | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);

  // Derive pane visibility from the URL — avoids syncing React state in effects.
  const mobileShowChat = Boolean(activeId);
  const displayActive =
    activeId && active?.id === activeId ? active : null;

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setListError(json?.error || "Unable to load conversations");
        return;
      }
      setConversations(json.data || []);
      setListError(null);
    } catch (error) {
      console.error("[messages] load list failed:", error);
      setListError("Unable to load conversations");
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string, silent = false) => {
    if (!silent) setChatLoading(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setChatError(json?.error || "Unable to load conversation");
        setActive(null);
        return;
      }
      setActive(json.data);
      setChatError(null);

      await fetch(`/api/conversations/${id}/read`, { method: "PATCH" });
      // Refresh unread badges in list
      const listRes = await fetch("/api/conversations");
      const listJson = await listRes.json().catch(() => null);
      if (listRes.ok) setConversations(listJson.data || []);
    } catch (error) {
      console.error("[messages] load conversation failed:", error);
      setChatError("Unable to load conversation");
    } finally {
      if (!silent) setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/conversations");
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setListError(json?.error || "Unable to load conversations");
          return;
        }
        setConversations(json.data || []);
        setListError(null);
      } catch (error) {
        if (cancelled) return;
        console.error("[messages] load list failed:", error);
        setListError("Unable to load conversations");
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;

    let cancelled = false;

    async function run() {
      setChatLoading(true);
      try {
        const res = await fetch(`/api/conversations/${activeId}`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setChatError(json?.error || "Unable to load conversation");
          setActive(null);
          return;
        }
        setActive(json.data);
        setChatError(null);

        await fetch(`/api/conversations/${activeId}/read`, { method: "PATCH" });
        if (cancelled) return;

        const listRes = await fetch("/api/conversations");
        const listJson = await listRes.json().catch(() => null);
        if (!cancelled && listRes.ok) {
          setConversations(listJson.data || []);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("[messages] load conversation failed:", error);
        setChatError("Unable to load conversation");
      } finally {
        if (!cancelled) setChatLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    pollRef.current = window.setInterval(() => {
      void loadConversation(activeId, true);
      void loadList();
    }, 8000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [activeId, loadConversation, loadList]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayActive?.messages.length]);

  function openConversation(id: string) {
    router.push(`${basePath}?c=${id}`);
  }

  function backToList() {
    router.push(basePath);
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || sending) return;
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    setChatError(null);
    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setChatError(json?.error || "Unable to send message");
        return;
      }

      const message = json.data as ChatMessage;
      setDraft("");
      setActive((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, message],
              updatedAt: message.createdAt,
            }
          : prev
      );
      await loadList();
    } catch (error) {
      console.error("[messages] send failed:", error);
      setChatError("Unable to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const emptyList = !listLoading && conversations.length === 0;

  const headerMachine = useMemo(
    () => displayActive?.machine,
    [displayActive?.machine]
  );

  return (
    <div className="flex h-[min(720px,calc(100dvh-10rem))] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:flex-row">
      {/* Conversation list */}
      <aside
        className={cn(
          "flex w-full flex-col border-black/5 lg:w-80 lg:border-r",
          mobileShowChat ? "hidden lg:flex" : "flex"
        )}
      >
        <div className="border-b border-black/5 px-4 py-4">
          <h2 className="font-display text-lg font-bold text-rn-ink">Messages</h2>
          <p className="text-xs text-rn-muted">Buyer ↔ Seller conversations</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-black/5" />
              ))}
            </div>
          ) : listError ? (
            <p className="p-4 text-sm text-red-600">{listError}</p>
          ) : emptyList ? (
            <div className="p-6 text-center">
              <MessageSquare className="mx-auto size-8 text-rn-muted" />
              <p className="mt-3 text-sm font-semibold text-rn-ink">
                No conversations yet
              </p>
              <p className="mt-1 text-xs text-rn-muted">
                Contact a seller about a machine to start chatting.
              </p>
              <Link
                href={browseHref}
                className="mt-4 inline-flex h-10 items-center rounded-lg bg-rn-gold px-4 text-sm font-bold text-rn-ink"
              >
                Browse Machines
              </Link>
            </div>
          ) : (
            <ul>
              {conversations.map((c) => {
                const selected = c.id === activeId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => openConversation(c.id)}
                      aria-label={`Open conversation about ${c.machine.title}`}
                      className={cn(
                        "flex w-full gap-3 border-b border-black/5 px-4 py-3 text-left transition hover:bg-rn-surface",
                        selected && "bg-rn-gold/10"
                      )}
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-rn-surface">
                        <Image
                          src={c.machine.imageUrl || FALLBACK}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-rn-ink">
                            {c.machine.title}
                          </span>
                          {c.unreadCount > 0 ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rn-gold px-1.5 text-[10px] font-bold text-rn-ink">
                              {c.unreadCount}
                            </span>
                          ) : null}
                        </span>
                        <span className="block truncate text-xs text-rn-muted">
                          {c.otherParticipant.name}
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-rn-ink/70">
                            {c.lastMessage?.content || "No messages yet"}
                          </span>
                          <span className="shrink-0 text-[10px] text-rn-muted">
                            {c.lastMessage
                              ? formatMessageTime(c.lastMessage.createdAt)
                              : formatMessageTime(c.updatedAt)}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <section
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          mobileShowChat ? "flex" : "hidden lg:flex"
        )}
      >
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="size-10 text-rn-muted" />
            <p className="mt-3 font-display text-lg font-bold text-rn-ink">
              Select a conversation
            </p>
            <p className="mt-1 max-w-sm text-sm text-rn-muted">
              Choose a thread from the list to view messages and reply.
            </p>
          </div>
        ) : chatLoading && !displayActive ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-rn-gold" />
          </div>
        ) : chatError && !displayActive ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <p className="text-sm text-red-600">{chatError}</p>
          </div>
        ) : displayActive ? (
          <>
            <header className="flex items-center gap-3 border-b border-black/5 px-3 py-3 sm:px-4">
              <button
                type="button"
                onClick={backToList}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-black/10 lg:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="size-4" />
              </button>
              <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-rn-surface">
                <Image
                  src={headerMachine?.imageUrl || FALLBACK}
                  alt={headerMachine?.title || "Machine"}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-rn-ink">
                  {headerMachine?.title}
                </p>
                <p className="truncate text-xs text-rn-muted">
                  {displayActive.otherParticipant.name}
                  {headerMachine?.available === false
                    ? " · Listing unavailable"
                    : ""}
                </p>
              </div>
              {headerMachine?.available ? (
                <Link
                  href={`/machines/${headerMachine.slug}`}
                  className="hidden h-9 shrink-0 items-center rounded-lg border border-black/10 px-3 text-xs font-semibold text-rn-ink sm:inline-flex"
                >
                  View Machine
                </Link>
              ) : null}
            </header>

            {headerMachine ? (
              <div className="hidden border-b border-black/5 bg-rn-surface/60 px-4 py-2 text-xs text-rn-muted sm:flex sm:items-center sm:gap-3">
                <span>
                  {headerMachine.brandName} · {headerMachine.categoryName}
                </span>
                <span className="font-semibold text-rn-ink">
                  {headerMachine.priceLabel}
                </span>
                {headerMachine.location ? (
                  <span>{headerMachine.location}</span>
                ) : null}
              </div>
            ) : null}

            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
              {displayActive.messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-rn-muted">
                  Start the conversation by sending a message.
                </p>
              ) : (
                displayActive.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.isMine ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[70%]",
                        m.isMine
                          ? "rounded-br-md bg-rn-ink text-white"
                          : "rounded-bl-md bg-rn-surface text-rn-ink"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {m.content}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          m.isMine ? "text-white/60" : "text-rn-muted"
                        )}
                      >
                        {formatMessageTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {chatError ? (
              <p className="px-4 text-xs text-red-600" role="alert">
                {chatError}
              </p>
            ) : null}

            <form
              onSubmit={onSend}
              className="flex items-end gap-2 border-t border-black/5 p-3 sm:p-4"
            >
              <label htmlFor="chat-message" className="sr-only">
                Type a message
              </label>
              <textarea
                id="chat-message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={1}
                maxLength={4000}
                placeholder="Type a message..."
                className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-black/10 bg-rn-surface px-3 py-2.5 text-sm outline-none focus:border-rn-gold"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send message"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-rn-gold px-4 text-sm font-bold text-rn-ink disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {sending ? "Sending..." : "Send"}
                </span>
              </button>
            </form>
          </>
        ) : null}
      </section>
    </div>
  );
}
