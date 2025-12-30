"use client";

import { useState } from "react";
import { streamChat } from "@/lib/api";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSend() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setIsStreaming(true);

    // add user message
    const userMsg: ChatMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);

    // create placeholder assistant message we will stream into
    const assistantIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    setInput("");

    try {
      await streamChat(trimmed, (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          next[assistantIndex] = {
            role: "assistant",
            content: (next[assistantIndex]?.content || "") + chunk,
          };
          return next;
        });
      });
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>AI Support / DevOps Copilot</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Paste an error/log and get probable root cause + safe remediation steps.
      </p>

      <div style={{ marginTop: 20, border: "1px solid #ddd", borderRadius: 12, padding: 16, minHeight: 360 }}>
        {messages.length === 0 && (
          <div style={{ opacity: 0.7 }}>
            Try: <code>ERROR: remaining connection slots are reserved for superuser connections</code>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {m.role === "user" ? "You" : "Copilot"}
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                background: m.role === "user" ? "#f5f5f5" : "#eef6ff",
                padding: 12,
                borderRadius: 10,
              }}
            >
              {m.content || (m.role === "assistant" && isStreaming ? "Thinking…" : "")}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "crimson" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste logs / error here..."
          style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ccc" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSend();
          }}
          disabled={isStreaming}
        />
        <button
          onClick={onSend}
          disabled={isStreaming || !input.trim()}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: isStreaming ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {isStreaming ? "Streaming..." : "Send"}
        </button>
      </div>
    </main>
  );
}
