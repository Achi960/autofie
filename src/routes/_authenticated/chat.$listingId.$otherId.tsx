import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Phone, Send, Smile, Keyboard, ShieldAlert, Ban } from "lucide-react";
import { ReportButton } from "@/components/ReportButton";
import EmojiPicker, { type EmojiClickData, Theme as EmojiTheme } from "emoji-picker-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { initialsOf } from "@/lib/format";
import { isOnline, lastSeenLabel, playMessageBeep } from "@/lib/presence";

import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/chat/$listingId/$otherId")({
  component: ChatPage,
});

type Msg = {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string | null;
  content: string | null;
  attachment_url: string | null;
  attachment_type: "image" | "audio" | null;
  attachment_duration_ms: number | null;
  created_at: string;
  read: boolean;
};

const QUICK_REPLIES = [
  "Is this available?",
  "What's your last price?",
  "Can you share the exact location?",
  "Can I come for a test drive?",
];

function ChatPage() {
  const { listingId, otherId } = Route.useParams();
  const { user } = useAuth();
  const { resolved: themeResolved } = useTheme();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [other, setOther] = useState<{ full_name: string | null; phone: string | null; avatar_url: string | null; last_seen_at: string | null; is_banned: boolean } | null>(null);
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const [listing, setListing] = useState<{ id: string; title: string; price: number; cover_photo_url: string | null } | null>(null);
  const [askPhone, setAskPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  const [, forceTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("listing_id", listingId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      if (!alive) return;
      setMessages((msgs ?? []) as unknown as Msg[]);
      await supabase.from("messages").update({ read: true })
        .eq("listing_id", listingId).eq("sender_id", otherId).eq("receiver_id", user.id).eq("read", false);

      const [{ data: prof }, { data: lst }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, avatar_url, last_seen_at, is_banned").eq("id", otherId).maybeSingle(),
        supabase.from("listings").select("id, title, price, cover_photo_url").eq("id", listingId).maybeSingle(),
      ]);
      if (!alive) return;
      setOther((prof as any) ?? { full_name: null, phone: null, avatar_url: null, last_seen_at: null, is_banned: false });
      setListing(lst ?? null);
      if ((prof as any)?.avatar_url) {
        const url = await signedUrl("avatars", (prof as any).avatar_url);
        if (alive) setOtherAvatar(url);
      }
    };
    load();

    const channel = supabase
      .channel(`chat:${listingId}:${user.id}:${otherId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `listing_id=eq.${listingId}` }, (payload) => {
        const m = payload.new as unknown as Msg;
        const involves = (m.sender_id === user.id && m.receiver_id === otherId) || (m.sender_id === otherId && m.receiver_id === user.id);
        if (!involves) return;
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        if (m.receiver_id === user.id) {
          playMessageBeep();
          supabase.from("messages").update({ read: true }).eq("id", m.id);
        }
      })
      .subscribe();

    const presenceInterval = setInterval(async () => {
      const { data } = await supabase.from("profiles").select("last_seen_at").eq("id", otherId).maybeSingle();
      if (!alive) return;
      setOther((prev) => prev ? { ...prev, last_seen_at: (data as any)?.last_seen_at ?? prev.last_seen_at } : prev);
      forceTick((n) => n + 1);
    }, 30_000);

    return () => { alive = false; supabase.removeChannel(channel); clearInterval(presenceInterval); };
  }, [user, listingId, otherId]);


  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const isSelfChat = user?.id === otherId;
  const otherBanned = !!other?.is_banned;

  const SAFETY_TRIGGERS = /(whatsapp|telegram|wa\.me|momo|mobile money|mtn|vodafone cash|airteltigo|send (the )?money|deposit|advance|pay (first|now|me)|western union|bank transfer|account number|moneygram)/i;
  const safetyAlert = SAFETY_TRIGGERS.test(text) || messages.slice(-3).some((m) => m.content && SAFETY_TRIGGERS.test(m.content));


  const sendMessage = async (opts: { body?: string; attachment?: { path: string; type: "image" | "audio"; durationMs?: number } }) => {
    if (!user || sending) return;
    const body = (opts.body ?? "").trim();
    if (!body && !opts.attachment) return;
    if (isSelfChat) { toast.error("You can't message yourself"); return; }
    if (otherBanned) { toast.error("This user has been blocked"); return; }
    setSending(true);
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: otherId,
      listing_id: listingId,
      content: body || null,
      attachment_url: opts.attachment?.path ?? null,
      attachment_type: opts.attachment?.type ?? null,
      attachment_duration_ms: opts.attachment?.durationMs ?? null,
      created_at: new Date().toISOString(),
      read: false,
    };
    setMessages((p) => [...p, optimistic]);
    setText("");
    const insertPayload: any = {
      sender_id: user.id,
      receiver_id: otherId,
      listing_id: listingId,
      content: body || null,
    };
    if (opts.attachment) {
      insertPayload.attachment_url = opts.attachment.path;
      insertPayload.attachment_type = opts.attachment.type;
      insertPayload.attachment_duration_ms = opts.attachment.durationMs ?? null;
    }
    const { data, error } = await supabase.from("messages").insert(insertPayload).select().single();
    setSending(false);
    if (error) {
      setMessages((p) => p.filter((m) => m.id !== optimistic.id));
      toast.error(error.message);
      return;
    }
    setMessages((p) => p.map((m) => m.id === optimistic.id ? (data as unknown as Msg) : m));
    inputRef.current?.focus();
  };

  const send = (body: string) => sendMessage({ body });

  const sendPleaseCallMe = async () => {
    if (!phoneInput.trim()) { toast.error("Enter your phone number"); return; }
    await send(`📞 Please call me on ${phoneInput.trim()}`);
    setAskPhone(false);
    setPhoneInput("");
  };

  const onEmojiClick = (e: EmojiClickData) => {
    setText((t) => t + e.emoji);
  };

  const toggleEmojiKeyboard = () => {
    setEmojiOpen((open) => {
      if (open) requestAnimationFrame(() => inputRef.current?.focus());
      else inputRef.current?.blur();
      return !open;
    });
  };

  const headerName = other?.full_name || "Seller";
  const groupedDate = useMemo(() => new Date().toDateString(), []);

  if (!user) return null;

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <Navbar />
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button onClick={() => navigate({ to: "/messages" })} className="rounded p-1 hover:bg-muted" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate({ to: "/user/$id", params: { id: otherId } })}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 -m-1 text-left hover:bg-muted/40"
            aria-label="View profile"
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                {otherAvatar && <AvatarImage src={otherAvatar} alt={headerName} />}
                <AvatarFallback className="bg-primary/10 text-primary">{initialsOf(headerName)}</AvatarFallback>
              </Avatar>
              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${isOnline(other?.last_seen_at) ? "bg-success" : "bg-muted-foreground"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{headerName}</p>
              <p className={`truncate text-xs ${isOnline(other?.last_seen_at) ? "text-success" : "text-muted-foreground"}`}>
                {lastSeenLabel(other?.last_seen_at)}
              </p>
            </div>
          </button>
          {other?.phone && !otherBanned && (
            <a href={`tel:${other.phone}`} className="rounded-full bg-success/10 p-2 text-success" aria-label="Call">
              <Phone className="h-5 w-5" />
            </a>
          )}
          <ReportButton reportedUserId={otherId} listingId={listingId} variant="ghost" size="sm" label="" className="px-2" />
        </div>
        {otherBanned && (
          <div className="mx-auto max-w-3xl px-4 pb-2">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <Ban className="h-4 w-4" /> This user has been blocked by AutoFie. You can no longer send messages.
            </div>
          </div>
        )}
        {listing && (
          <div className="mx-auto max-w-3xl px-4 pb-2">
            <Link to="/listing/$id" params={{ id: listing.id }} className="truncate text-xs text-muted-foreground hover:underline">
              About: {listing.title}
            </Link>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-surface">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-4">
          <div className="mx-auto rounded-full border border-warning/40 bg-warning/10 px-4 py-1.5 text-center text-xs text-warning-foreground">
            📢 Avoid paying in advance — even for delivery
          </div>
          {safetyAlert && (
            <div className="mx-auto max-w-md rounded-lg border-2 border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              <p className="flex items-center gap-1.5 font-semibold"><ShieldAlert className="h-4 w-4" /> Safety alert</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                <li>Don't send money before seeing the car in person.</li>
                <li>Meet in a public, open place during the day.</li>
                <li>Inspect the car and documents before paying anything.</li>
                <li>Keep chats here so we can help if anything goes wrong.</li>
              </ul>
            </div>
          )}
          <p className="my-2 text-center text-xs text-muted-foreground">{groupedDate}</p>

          {messages.map((m) => {
            const mine = m.sender_id === user.id;
            const hasAttach = !!m.attachment_url;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>
                  {hasAttach && (
                    <div className={m.content ? "mb-2" : ""}>
                      <AttachmentView msg={m} />
                    </div>
                  )}
                  {m.content && <p className="whitespace-pre-wrap px-1">{m.content}</p>}
                  <p className={`mt-1 px-1 text-[10px] ${mine ? "opacity-80" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t bg-card">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_REPLIES.map((q) => (
              <button key={q} onClick={() => send(q)}
                className="shrink-0 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">
                {q}
              </button>
            ))}
            <button onClick={() => setAskPhone((v) => !v)}
              className="shrink-0 rounded-full border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning-foreground hover:bg-warning/20">
              📞 Please call me
            </button>
          </div>

          {askPhone && (
            <div className="flex gap-2 rounded-lg border bg-muted/40 p-2">
              <Input
                type="tel"
                placeholder="Your phone number e.g. 024 123 4567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendPleaseCallMe(); } }}
                autoFocus
              />
              <Button onClick={sendPleaseCallMe} disabled={!phoneInput.trim()}>Send</Button>
            </div>
          )}

          {emojiOpen && (
            <div className="relative">
              <div className="absolute bottom-full left-0 z-50 mb-2">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  theme={themeResolved === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                  height={350}
                  width={320}
                  lazyLoadEmojis
                />
              </div>
            </div>
          )}

          {recording ? (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
              </span>
              <span className="flex-1 text-sm font-medium text-destructive">Recording… {formatDuration(recordSeconds * 1000)}</span>
              <Button variant="ghost" size="sm" onClick={cancelRecording}>
                <Trash2 className="mr-1 h-4 w-4" />Cancel
              </Button>
              <Button size="sm" onClick={stopRecording} disabled={recordSeconds < 1}>
                <Square className="mr-1 h-4 w-4" />Send
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); send(text); }}
              className="flex items-center gap-1"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { onPickImage(e.target.files?.[0]); e.target.value = ""; }}
              />
              <button type="button" aria-label="Emoji" onClick={() => setEmojiOpen((v) => !v)}
                className={`rounded-full p-2 hover:bg-muted ${emojiOpen ? "bg-muted text-primary" : "text-muted-foreground"}`}>
                {emojiOpen ? <X className="h-5 w-5" /> : <Smile className="h-5 w-5" />}
              </button>
              <button type="button" aria-label="Attach image" onClick={() => fileInputRef.current?.click()}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted">
                <Paperclip className="h-5 w-5" />
              </button>
              <Input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your message here"
                disabled={sending || isSelfChat || otherBanned}
                onFocus={() => setEmojiOpen(false)}
              />
              {text.trim() ? (
                <Button type="submit" disabled={!text.trim() || sending || isSelfChat || otherBanned} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" size="icon" onClick={startRecording} disabled={isSelfChat || otherBanned} aria-label="Record voice note">
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </form>
          )}

          {/* Mobile-friendly attach-photo shortcut row, visible when nothing typed */}
          {!recording && !text.trim() && (
            <p className="text-center text-[10px] text-muted-foreground">
              <ImageIcon className="mr-1 inline h-3 w-3" /> Tap the clip to send a photo · Tap mic to record a voice note
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
