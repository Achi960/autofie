import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Star, MessageSquare, Pencil, Trash2, Share2, Reply, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { initialsOf } from "@/lib/format";
import { signedUrl } from "@/lib/storage";
import { toast } from "sonner";
import { notifyAdminWhatsapp } from "@/lib/admin-notify.functions";

export type ReviewRow = {
  id: string;
  dealer_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

type Reviewer = { id: string; full_name: string | null; avatar_url: string | null };

type Props = {
  dealerId: string;
  dealerName: string;
  /** Render only the aggregate summary (used in the profile header). */
  summaryOnly?: boolean;
  /** Auto-open the write form (used by /review/$id shareable link). */
  autoOpen?: boolean;
  onLoaded?: (info: { count: number; average: number }) => void;
};

function Stars({ value, onChange, size = 18 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" role={onChange ? "radiogroup" : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const Cmp = onChange ? "button" : "span";
        return (
          <Cmp
            key={n}
            type={onChange ? "button" : undefined}
            onClick={onChange ? () => onChange(n) : undefined}
            aria-label={onChange ? `${n} star${n === 1 ? "" : "s"}` : undefined}
            className={onChange ? "transition hover:scale-110" : ""}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}
            />
          </Cmp>
        );
      })}
    </div>
  );
}

export function ReviewsSection({ dealerId, dealerName, summaryOnly, autoOpen, onLoaded }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [reviewers, setReviewers] = useState<Record<string, Reviewer & { avatarSrc?: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(!!autoOpen);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<{ id: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const isSelf = user?.id === dealerId;
  const myReview = user ? rows.find((r) => r.reviewer_id === user.id) ?? null : null;

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("reviews")
      .select("*")
      .eq("dealer_id", dealerId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const list = (data as ReviewRow[]) ?? [];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.reviewer_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids);
      const map: Record<string, Reviewer & { avatarSrc?: string | null }> = {};
      for (const p of (profs as Reviewer[]) ?? []) {
        map[p.id] = { ...p, avatarSrc: null };
        if (p.avatar_url) signedUrl("avatars", p.avatar_url).then((u) => {
          setReviewers((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] ?? p), avatarSrc: u } }));
        });
      }
      setReviewers(map);
    }
    setLoading(false);
    const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
    onLoaded?.({ count: list.length, average: avg });
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [dealerId]);

  useEffect(() => {
    if (myReview && formOpen && !editingId) {
      setRating(myReview.rating);
      setComment(myReview.comment);
      setEditingId(myReview.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myReview?.id, formOpen]);

  const submit = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (isSelf) { toast.error("You can't review yourself"); return; }
    if (rating < 1) { toast.error("Pick a rating"); return; }
    setBusy(true);
    const payload = { dealer_id: dealerId, reviewer_id: user.id, rating, comment: comment.trim() };
    const { error } = await (supabase as any)
      .from("reviews")
      .upsert(payload, { onConflict: "dealer_id,reviewer_id" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Review updated" : "Review posted");
    if (!editingId) {
      notifyAdminWhatsapp({
        data: { message: `⭐ New review (${rating}★) for ${dealerName} on AutoFie\n\n"${comment.slice(0, 200)}"\n\nView: ${window.location.origin}/user/${dealerId}` },
      }).catch(() => {});
    }
    setFormOpen(false);
    setEditingId(null);
    setRating(0);
    setComment("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete your review?")) return;
    const { error } = await (supabase as any).from("reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Review removed");
    setEditingId(null);
    setRating(0);
    setComment("");
    load();
  };

  const sendReply = async () => {
    if (!replyDraft) return;
    setBusy(true);
    const { error } = await (supabase as any)
      .from("reviews")
      .update({ reply: replyDraft.text.trim() || null, replied_at: new Date().toISOString() })
      .eq("id", replyDraft.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setReplyDraft(null);
    load();
  };

  const share = async () => {
    const url = `${window.location.origin}/review/${dealerId}`;
    try {
      if (navigator.share) await navigator.share({ title: `Review ${dealerName} on AutoFie`, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch { /* user cancelled */ }
  };

  const count = rows.length;
  const average = count ? rows.reduce((s, r) => s + r.rating, 0) / count : 0;

  if (summaryOnly) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Stars value={average} size={14} />
        <span className="font-medium text-foreground">{count ? average.toFixed(1) : "—"}</span>
        <span className="text-muted-foreground">({count} review{count === 1 ? "" : "s"})</span>
      </div>
    );
  }

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Reviews & ratings</h2>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <Stars value={average} size={16} />
            <span className="font-semibold text-foreground">{count ? average.toFixed(1) : "—"}</span>
            <span className="text-muted-foreground">({count} review{count === 1 ? "" : "s"})</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={share}>
            <Share2 className="mr-1.5 h-4 w-4" />Share
          </Button>
          {!isSelf && (
            <Button size="sm" onClick={() => { if (!user) { navigate({ to: "/auth" }); return; } setFormOpen((v) => !v); }}>
              <MessageSquare className="mr-1.5 h-4 w-4" />
              {myReview ? "Edit your review" : "Write a review"}
            </Button>
          )}
        </div>
      </header>

      {formOpen && !isSelf && (
        <div className="space-y-3 border-b bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Your rating</span>
            <Stars value={rating} onChange={setRating} />
          </div>
          <Textarea
            placeholder={`Tell other buyers what your experience with ${dealerName} was like…`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <div className="flex flex-wrap justify-end gap-2">
            {editingId && (
              <Button variant="ghost" size="sm" onClick={() => remove(editingId)} className="text-destructive">
                <Trash2 className="mr-1.5 h-4 w-4" />Delete
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { setFormOpen(false); setEditingId(null); }}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={busy}>{editingId ? "Save changes" : "Post review"}</Button>
          </div>
        </div>
      )}

      <div className="divide-y">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading reviews…</p>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <Star className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium text-foreground">No reviews yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSelf ? "Share your profile so buyers can leave a review." : `Be the first to review ${dealerName}.`}
            </p>
          </div>
        ) : (
          rows.map((r) => {
            const rev = reviewers[r.reviewer_id];
            const name = rev?.full_name || "User";
            const isMine = user?.id === r.reviewer_id;
            const edited = r.updated_at && r.created_at && r.updated_at !== r.created_at;
            return (
              <article key={r.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Link to="/user/$id" params={{ id: r.reviewer_id }}>
                    <Avatar className="h-10 w-10">
                      {rev?.avatarSrc && <AvatarImage src={rev.avatarSrc} alt={name} />}
                      <AvatarFallback className="bg-primary/10 text-primary">{initialsOf(name)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link to="/user/$id" params={{ id: r.reviewer_id }} className="font-semibold text-foreground hover:underline">
                          {name}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2">
                          <Stars value={r.rating} size={14} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                            {edited ? " · edited" : ""}
                          </span>
                        </div>
                      </div>
                      {isMine && (
                        <Button variant="ghost" size="sm" onClick={() => { setFormOpen(true); setEditingId(r.id); setRating(r.rating); setComment(r.comment); }}>
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />Edit
                        </Button>
                      )}
                    </div>
                    {r.comment && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{r.comment}</p>}

                    {/* Reply */}
                    {(r.reply || (isSelf && !replyDraft)) && r.reply && (
                      <div className="mt-3 rounded-lg border-l-2 border-primary/60 bg-muted/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-primary">Response from {dealerName}</p>
                          {isSelf && (
                            <Button variant="ghost" size="sm" onClick={() => setReplyDraft({ id: r.id, text: r.reply ?? "" })}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{r.reply}</p>
                      </div>
                    )}

                    {replyDraft?.id === r.id ? (
                      <div className="mt-3 space-y-2">
                        <Textarea rows={3} value={replyDraft.text} onChange={(e) => setReplyDraft({ id: r.id, text: e.target.value })} placeholder="Write a public reply…" />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setReplyDraft(null)}><X className="mr-1 h-4 w-4" />Cancel</Button>
                          <Button size="sm" onClick={sendReply} disabled={busy}><Check className="mr-1 h-4 w-4" />Save reply</Button>
                        </div>
                      </div>
                    ) : (
                      isSelf && !r.reply && (
                        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setReplyDraft({ id: r.id, text: "" })}>
                          <Reply className="mr-1.5 h-4 w-4" />Reply
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
