"use client";

import { useState, useRef, useEffect } from "react";
import { streamChat, login, register, fetchHistory } from "@/lib/api";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
};

type AuthData = {
  access_token: string;
  user_id: string;
  email: string;
};

type Section = { title: string; body: string };

const SECTION_STYLES: Record<string, { color: string; icon: string }> = {
  "ROOT CAUSE":              { color: "#f87171", icon: "◎" },
  "DIAGNOSTIC CHECKS":       { color: "#fbbf24", icon: "◈" },
  "SAFE REMEDIATION STEPS":  { color: "#34d399", icon: "◆" },
  "PREVENTION":              { color: "#818cf8", icon: "◇" },
};

const SECTION_LABELS = Object.keys(SECTION_STYLES);

function parseSection(content: string): Section[] | null {
  // Match labels like "ROOT CAUSE:" at start of a line
  const pattern = new RegExp(
    `(${SECTION_LABELS.map((l) => l.replace(/\s/g, "\\s+")).join("|")}):?`,
    "gi"
  );

  const matches = [...content.matchAll(new RegExp(pattern.source + "[^]*?(?=" + pattern.source + "|$)", "gi"))];
  if (matches.length === 0) return null;

  return matches.map((m) => {
    const raw = m[0];
    const labelMatch = raw.match(new RegExp(`^(${SECTION_LABELS.map((l) => l.replace(/\s/g, "\\s+")).join("|")}):?`, "i"));
    const label = labelMatch ? labelMatch[0].replace(/:$/, "").trim().toUpperCase() : "INFO";
    const body = raw.slice(labelMatch ? labelMatch[0].length : 0).replace(/^[\s:]+/, "").trim();
    return { title: label, body };
  });
}

function AssistantMessage({ content, streaming }: { content: string; streaming: boolean }) {
  const sections = parseSection(content);

  if (!sections) {
    return (
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#cbd5e1", fontSize: 14 }}>
        {content || (streaming ? (
          <span style={{ color: "#475569", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: "pulse 1s infinite" }} />
            Analyzing...
          </span>
        ) : "")}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {sections.map((sec, i) => {
        const style = SECTION_STYLES[sec.title] || { color: "#818cf8", icon: "◆" };
        return (
          <div key={i}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              marginBottom: 6,
            }}>
              <span style={{ color: style.color, fontSize: 12 }}>{style.icon}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: style.color,
              }}>
                {sec.title}
              </span>
            </div>
            <div style={{
              whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 13,
              color: "#cbd5e1", paddingLeft: 16,
              borderLeft: `2px solid ${style.color}22`,
            }}>
              {sec.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      try { setAuth(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    fetchHistory()
      .then((msgs: { role: string; content: string }[]) =>
        setMessages(msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })))
      )
      .catch(() => {});
  }, [auth]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const fn = authMode === "login" ? login : register;
      const data = await fn(email, password);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("auth", JSON.stringify(data));
      setAuth(data);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  function onLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("auth");
    setAuth(null);
    setMessages([]);
  }

  async function onSend() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setIsStreaming(true);

    const next: ChatMsg[] = [
      ...messages,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ];
    setMessages(next);
    const assistantIndex = next.length - 1;
    setInput("");

    try {
      await streamChat(trimmed, (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            role: "assistant",
            content: (updated[assistantIndex]?.content || "") + chunk,
          };
          return updated;
        });
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsStreaming(false);
    }
  }

  /* ── Auth screen ── */
  if (!auth) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080b12",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "ui-monospace, 'Geist Mono', monospace",
      }}>
        <div style={{
          width: 400, background: "#0f1117",
          border: "1px solid #1e2235", borderRadius: 16, padding: 36,
        }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#6366f110", border: "1px solid #6366f130",
              borderRadius: 6, padding: "3px 10px", marginBottom: 14,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#6366f1" }}>DEVOPS COPILOT</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
              {authMode === "login" ? "Sign in to continue" : "Create your account"}
            </h1>
            <p style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>
              {authMode === "login"
                ? "Diagnose production incidents with AI-assisted triage"
                : "Start analyzing logs and errors instantly"}
            </p>
          </div>

          <form onSubmit={onAuth} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="email" placeholder="you@company.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              style={{
                background: "#080b12", border: "1px solid #1e2235",
                borderRadius: 8, padding: "10px 14px", color: "#f1f5f9",
                fontSize: 14, outline: "none", fontFamily: "inherit",
              }}
            />
            <input
              type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              style={{
                background: "#080b12", border: "1px solid #1e2235",
                borderRadius: 8, padding: "10px 14px", color: "#f1f5f9",
                fontSize: 14, outline: "none", fontFamily: "inherit",
              }}
            />
            {authError && (
              <div style={{
                background: "#ef444410", border: "1px solid #ef444430",
                borderRadius: 6, padding: "8px 12px", color: "#f87171", fontSize: 12,
              }}>
                {authError}
              </div>
            )}
            <button
              type="submit" disabled={authLoading}
              style={{
                background: "#6366f1", color: "white", border: "none",
                borderRadius: 8, padding: "11px 14px", fontSize: 14,
                fontWeight: 600, cursor: authLoading ? "not-allowed" : "pointer",
                opacity: authLoading ? 0.7 : 1, marginTop: 4,
                fontFamily: "inherit",
              }}
            >
              {authLoading ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: "#475569" }}>
            {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(null); }}
              style={{
                background: "none", border: "none", color: "#818cf8",
                cursor: "pointer", fontSize: 13, padding: 0, fontFamily: "inherit",
              }}
            >
              {authMode === "login" ? "Register" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main chat UI ── */
  return (
    <div style={{
      minHeight: "100vh", background: "#080b12",
      display: "flex", flexDirection: "column",
      fontFamily: "ui-monospace, 'Geist Mono', monospace",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid #1e2235", padding: "0 24px",
        height: 52, display: "flex", alignItems: "center",
        justifyContent: "space-between", background: "#0a0d14",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#e2e8f0" }}>
            DEVOPS COPILOT
          </span>
          <span style={{
            fontSize: 10, color: "#334155", background: "#1e2235",
            borderRadius: 4, padding: "2px 7px", marginLeft: 4,
          }}>
            v0.2.0
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#475569" }}>{auth.email}</span>
          <button
            onClick={onLogout}
            style={{
              fontSize: 11, color: "#64748b", background: "none",
              border: "1px solid #1e2235", borderRadius: 6,
              padding: "4px 10px", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "28px 24px",
        display: "flex", flexDirection: "column", gap: 20,
        maxWidth: 860, width: "100%", margin: "0 auto", boxSizing: "border-box",
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 80, color: "#334155" }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>⬡</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Paste logs or error output below
            </div>
            <div style={{ fontSize: 12, color: "#334155", maxWidth: 380, margin: "0 auto" }}>
              Get structured root cause analysis, diagnostic checks, and safe remediation steps
            </div>
            <div style={{
              marginTop: 20, display: "inline-flex", flexDirection: "column", gap: 6,
              textAlign: "left", background: "#0f1117", border: "1px solid #1e2235",
              borderRadius: 10, padding: "12px 16px", fontSize: 11, color: "#475569",
            }}>
              <span>Try pasting one of these:</span>
              <code style={{ color: "#f87171" }}>ERROR: remaining connection slots are reserved for superuser</code>
              <code style={{ color: "#fbbf24" }}>OOMKilled: container exceeded memory limit</code>
              <code style={{ color: "#34d399" }}>502 Bad Gateway: upstream connect error</code>
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: "flex", flexDirection: "column", gap: 4,
              alignItems: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
              color: "#334155", textTransform: "uppercase", padding: "0 4px",
            }}>
              {m.role === "user" ? "You" : "Copilot"}
            </div>
            <div style={{
              maxWidth: "88%",
              background: m.role === "user" ? "#0f1117" : "#0a0e1a",
              border: m.role === "user" ? "1px solid #1e2235" : "1px solid #1a2040",
              padding: "12px 16px",
              borderRadius: m.role === "user"
                ? "14px 14px 4px 14px"
                : "14px 14px 14px 4px",
              color: m.role === "user" ? "#e2e8f0" : undefined,
            }}>
              {m.role === "user" ? (
                <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6 }}>{m.content}</div>
              ) : (
                <AssistantMessage
                  content={m.content}
                  streaming={isStreaming && idx === messages.length - 1}
                />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        borderTop: "1px solid #1e2235", padding: "14px 24px 18px",
        background: "#0a0d14", flexShrink: 0,
      }}>
        {error && (
          <div style={{
            maxWidth: 860, margin: "0 auto 10px",
            background: "#ef444412", border: "1px solid #ef444430",
            borderRadius: 6, padding: "7px 12px", color: "#f87171", fontSize: 12,
          }}>
            {error}
          </div>
        )}
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste logs, stack traces, or error messages here..."
            rows={3}
            style={{
              flex: 1, background: "#0f1117",
              border: "1px solid #1e2235", borderRadius: 10,
              padding: "12px 14px", color: "#e2e8f0", fontSize: 13,
              resize: "none", fontFamily: "inherit", outline: "none",
              lineHeight: 1.6,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={isStreaming}
          />
          <button
            onClick={onSend}
            disabled={isStreaming || !input.trim()}
            style={{
              background: isStreaming || !input.trim() ? "#0f1117" : "#6366f1",
              color: isStreaming || !input.trim() ? "#334155" : "white",
              border: "1px solid",
              borderColor: isStreaming || !input.trim() ? "#1e2235" : "#6366f1",
              borderRadius: 10, padding: "12px 20px",
              fontSize: 13, fontWeight: 600,
              cursor: isStreaming || !input.trim() ? "not-allowed" : "pointer",
              minWidth: 90, fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {isStreaming ? "···" : "Analyze"}
          </button>
        </div>
        <div style={{ maxWidth: 860, margin: "8px auto 0", fontSize: 10, color: "#1e2a40" }}>
          Enter to analyze · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
