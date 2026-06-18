import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState, Link } from "@tanstack/react-router";
import { Stethoscope, X, Send, Loader2, Wrench, AlertTriangle, CheckCircle2, Mic, Square } from "lucide-react";
import { diagnoseVehicle, type DiagnoseResult } from "@/lib/diagnose.functions";
import { transcribeAudio } from "@/lib/transcribe.functions";

type Lang = "english" | "twi" | "hausa";
const LANGS: { value: Lang; label: string }[] = [
  { value: "english", label: "English" },
  { value: "twi", label: "Twi" },
  { value: "hausa", label: "Hausa" },
];

type Msg =
  | { role: "bot"; kind: "text"; text: string }
  | { role: "bot"; kind: "result"; result: DiagnoseResult }
  | { role: "user"; kind: "text"; text: string };

const GREETED_KEY = "autofie_diagnose_greeted_v1";

const INTRO_MESSAGES: Msg[] = [
  { role: "bot", kind: "text", text: "👋 Hi there! I'm **AutoFie Diagnose** — your free AI car doctor." },
  { role: "bot", kind: "text", text: "Tell me what's wrong with your vehicle — a noise, warning light, smell, or anything off — and I'll suggest a likely cause, safe DIY steps, and when to see a mechanic. 🚗🔧" },
];

export function DiagnoseWidget() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(INTRO_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Lang>("english");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const diagnose = useServerFn(diagnoseVehicle);
  const transcribe = useServerFn(transcribeAudio);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // First-visit greeting bubble
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(GREETED_KEY)) return;
    const t = setTimeout(() => {
      setBubbleOpen(true);
      localStorage.setItem(GREETED_KEY, "1");
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (open) inputRef.current?.focus();
  }, [open, messages, loading]);

  // Hide entirely on the full diagnose page
  if (pathname === "/diagnose") return null;

  const openPanel = () => {
    setOpen(true);
    setBubbleOpen(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", kind: "text", text }]);
    setLoading(true);
    try {
      const result = await diagnose({
        data: { description: text, vehicleType: "unspecified", engineType: "unspecified" },
      });
      setMessages((m) => [...m, { role: "bot", kind: "result", result }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "bot", kind: "text", text: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Greeting bubble */}
      {!open && bubbleOpen && (
        <button
          onClick={openPanel}
          className="fixed bottom-24 right-5 z-40 max-w-[260px] animate-fade-in rounded-2xl rounded-br-sm border border-border bg-card p-3 text-left shadow-2xl hover:shadow-primary/20 sm:right-6"
          aria-label="Open AutoFie Diagnose"
        >
          <p className="text-sm font-semibold text-foreground">👋 Hi, I'm AutoFie Diagnose!</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Free AI car doctor. Tap to ask about any vehicle problem.
          </p>
          <span
            role="presentation"
            onClick={(e) => { e.stopPropagation(); setBubbleOpen(false); }}
            className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-secondary text-white shadow"
          >
            <X className="h-3 w-3" />
          </span>
        </button>
      )}

      {/* Floating launcher */}
      {!open && (
        <button
          onClick={openPanel}
          aria-label="Open AutoFie Diagnose chat"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition hover:scale-105 sm:right-6 sm:bottom-6"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" aria-hidden="true" />
          <Stethoscope className="relative h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="AutoFie Diagnose chat"
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-scale-in sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] sm:max-h-[600px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-secondary px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">AutoFie Diagnose</p>
                <p className="text-[11px] text-white/80">Free AI car doctor · Online</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1.5 text-white/90 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-background px-3 py-4">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                    {m.text}
                  </div>
                </div>
              ) : m.kind === "text" ? (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-foreground">
                    <BotText text={m.text} />
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[90%] space-y-2 rounded-2xl rounded-bl-sm bg-muted p-3 text-sm text-foreground">
                    <ResultBlock result={m.result} />
                  </div>
                </div>
              ),
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Diagnosing…
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer / input */}
          <div className="border-t border-border bg-card">
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2 px-3 py-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the problem…"
                aria-label="Describe your car problem"
                className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="px-4 pb-2 text-[10px] text-muted-foreground">
              For photo uploads & detailed mode →{" "}
              <Link to="/diagnose" className="font-semibold text-primary hover:underline" onClick={() => setOpen(false)}>
                full diagnosis tool
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Lightweight bold markdown for **text**
function BotText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function ResultBlock({ result }: { result: DiagnoseResult }) {
  const sev =
    result.severity === "high"
      ? { label: "Do not drive", cls: "bg-primary/15 text-primary border-primary/40" }
      : result.severity === "medium"
        ? { label: "Drive with caution", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40" }
        : { label: "Minor issue", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40" };

  return (
    <>
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${sev.cls}`}>
        <AlertTriangle className="h-3 w-3" /> {sev.label}
      </span>
      <p className="text-sm leading-relaxed text-foreground">{result.likelyCause}</p>

      {result.diySteps.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Safe DIY steps
          </p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-xs text-muted-foreground">
            {result.diySteps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}

      {result.seeMechanic && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Wrench className="h-3.5 w-3.5" /> See a mechanic
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-foreground">
            {result.mechanicReason || "This issue needs a qualified mechanic."}
          </p>
        </div>
      )}
    </>
  );
}
