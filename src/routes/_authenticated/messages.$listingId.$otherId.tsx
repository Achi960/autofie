import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { formatGHS, initialsOf } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/$listingId/$otherId")({
  component: Thread,
});

type Msg = { id: string; sender_id: string; receiver_id: string; content: string; created_at: string; listing_id: string | null; read: boolean };

function Thread() {
  const { listingId, otherId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [listing, setListing] = useState<any | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [other, setOther] = useState<any | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const realListingId = listingId === "none" ? null : listingId;
  const canSend = !!listing && (listing.status === "approved" || listing.user_id === user?.id);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (realListingId) {
        const { data } = await supabase.from("listings").select("id, title, price, status, cover_photo_url, user_id").eq("id", realListingId).maybeSingle();
        setListing(data);
        if (data?.cover_photo_url) signedUrl("listing-photos", data.cover_photo_url).then(setCover);
      }
      const { data: p } = await supabase.from("profiles").select("id, full_name").eq("id", otherId).maybeSingle();
      setOther(p);

      let q = supabase.from("messages").select("*").or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`).order("created_at");
      if (realListingId) q = q.eq("listing_id", realListingId);
      const { data: m } = await q;
      setMsgs((m as Msg[]) ?? []);
      // mark unread received messages as read
      await supabase.from("messages").update({ read: true }).eq("receiver_id", user.id).eq("sender_id", otherId).eq("read", false);
    })();
  }, [user, otherId, realListingId]);

  // realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`thread-${user.id}-${otherId}-${realListingId ?? "none"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        const matchPair = (m.sender_id === user.id && m.receiver_id === otherId) || (m.sender_id === otherId && m.receiver_id === user.id);
        const matchListing = (m.listing_id ?? null) === realListingId;
        if (matchPair && matchListing) {
          setMsgs((arr) => arr.some((x) => x.id === m.id) ? arr : [...arr, m]);
          if (m.receiver_id === user.id) supabase.from("messages").update({ read: true }).eq("id", m.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, otherId, realListingId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    if (!user || !text.trim()) return;
    if (!canSend) { toast.error("This listing is closed"); return; }
    setSending(true);
    const content = text.trim().slice(0, 2000);
    const { error, data } = await supabase.from("messages").insert({
      sender_id: user.id, receiver_id: otherId, listing_id: realListingId, content,
    }).select().single();
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
    setMsgs((arr) => [...arr, data as Msg]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4">
        <div className="flex items-center gap-3 border-b pb-3">
          <button onClick={() => navigate({ to: "/messages" })} aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
          <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary text-xs">{initialsOf(other?.full_name)}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{other?.full_name ?? "User"}</p>
            {listing && (
              <Link to="/listing/$id" params={{ id: listing.id }} className="flex items-center gap-2 text-xs text-muted-foreground hover:underline">
                {cover && <img src={cover} alt="" className="h-5 w-7 rounded object-cover" />}
                <span className="truncate">{listing.title} · {formatGHS(listing.price)}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-2">
          {msgs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Say hi 👋</p>
          ) : msgs.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {canSend ? (
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t pt-3">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" maxLength={2000} />
            <Button type="submit" disabled={sending || !text.trim()}><Send className="h-4 w-4" /></Button>
          </form>
        ) : (
          <p className="border-t pt-3 text-center text-xs text-muted-foreground">
            This listing is no longer active — you can't send new messages.
          </p>
        )}
      </div>
    </div>
  );
}
