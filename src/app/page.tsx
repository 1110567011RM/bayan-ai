"use client";

import { FormEvent, useState } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "مرحبًا 👋 أنا NOVA. كيف أقدر أساعدك اليوم؟",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();

    if (!text || loading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "حدث خطأ أثناء إرسال الرسالة.");
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          data?.message ||
          data?.reply ||
          "لم يصل رد من NOVA.",
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع.",
      };

      setMessages((current) => [
        ...current,
        errorMessage,
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.app}>
        <header style={styles.header}>
          <div style={styles.logo}>N</div>

          <div>
            <h1 style={styles.title}>NOVA</h1>
            <p style={styles.status}>
              <span style={styles.statusDot} />
              المساعد الذكي
            </p>
          </div>
        </header>

        <div style={styles.chat}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.messageRow,
                justifyContent:
                  message.role === "user"
                    ? "flex-start"
                    : "flex-end",
              }}
            >
              <div
                style={{
                  ...styles.message,
                  ...(message.role === "user"
                    ? styles.userMessage
                    : styles.assistantMessage),
                }}
              >
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div
              style={{
                ...styles.messageRow,
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  ...styles.message,
                  ...styles.assistantMessage,
                }}
              >
                NOVA يكتب...
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={sendMessage}
          style={styles.inputArea}
        >
          <input
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            placeholder="اكتب رسالتك..."
            disabled={loading}
            style={styles.input}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              ...styles.button,
              opacity:
                loading || !input.trim() ? 0.5 : 1,
            }}
          >
            إرسال
          </button>
        </form>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    margin: 0,
    padding: "24px",
    background:
      "linear-gradient(135deg, #071f1b 0%, #0b3029 45%, #071b18 100%)",
    color: "#ffffff",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    direction: "rtl",
    boxSizing: "border-box",
  },

  app: {
    width: "100%",
    maxWidth: "1000px",
    height: "min(850px, 92vh)",
    minHeight: "600px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: "28px",
    background: "rgba(8, 29, 25, 0.96)",
    border: "1px solid rgba(255, 255, 255, 0.10)",
    boxShadow:
      "0 30px 80px rgba(0, 0, 0, 0.35)",
    backdropFilter: "blur(20px)",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "24px 28px",
    borderBottom:
      "1px solid rgba(255, 255, 255, 0.08)",
  },

  logo: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #b7f7e7, #6dd9c0)",
    color: "#07332b",
    fontSize: "25px",
    fontWeight: 800,
  },

  title: {
    margin: 0,
    fontSize: "25px",
    letterSpacing: "3px",
  },

  status: {
    margin: "4px 0 0",
    color: "#a8c8c2",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#6dd9c0",
    display: "inline-block",
  },

  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  messageRow: {
    width: "100%",
    display: "flex",
  },

  message: {
    maxWidth: "75%",
    padding: "14px 18px",
    borderRadius: "18px",
    fontSize: "15px",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  },

  userMessage: {
    background:
      "linear-gradient(135deg, #1f6255, #174b42)",
    borderBottomLeftRadius: "5px",
  },

  assistantMessage: {
    background: "#102e29",
    border:
      "1px solid rgba(255, 255, 255, 0.08)",
    borderBottomRightRadius: "5px",
  },

  inputArea: {
    display: "flex",
    gap: "10px",
    padding: "18px",
    borderTop:
      "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(4, 20, 17, 0.8)",
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: "52px",
    padding: "0 18px",
    borderRadius: "15px",
    border:
      "1px solid rgba(255, 255, 255, 0.10)",
    background: "#0b2622",
    color: "#ffffff",
    outline: "none",
    fontSize: "15px",
    direction: "rtl",
  },

  button: {
    width: "100px",
    border: "none",
    borderRadius: "15px",
    background:
      "linear-gradient(135deg, #b7f7e7, #6dd9c0)",
    color: "#07332b",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  },
};
