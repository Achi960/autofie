import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const REASONS = [
  "Scam or fraud",
  "Fake or misleading listing",
  "Inappropriate content",
  "Harassment or abuse",
  "Wrong category or duplicate",
  "Other",
];

type Props = {
  reportedUserId?: string | null;
  listingId?: string | null;
  variant?: "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "icon";
  label?: string;
  className?: string;
};

export function ReportButton({ reportedUserId, listingId, variant = "outline", size = "sm", label = "Report", className }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) { toast.error("Please sign in to report"); return; }
    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId ?? null,
      listing_id: listingId ?? null,
      reason,
      details: details.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Report submitted. Our team will review it.");
    setOpen(false);
    setDetails("");
  };

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <Flag className="mr-1.5 h-3.5 w-3.5" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit a report</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tell us what's wrong. Admins will review and take action.</p>
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-1">
            {REASONS.map((r) => (
              <div key={r} className="flex items-center gap-2">
                <RadioGroupItem value={r} id={`r-${r}`} />
                <Label htmlFor={`r-${r}`} className="cursor-pointer text-sm">{r}</Label>
              </div>
            ))}
          </RadioGroup>
          <Textarea aria-label="Report details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Optional: add more details…" maxLength={800} />
          <Button onClick={submit} disabled={busy} variant="destructive">{busy ? "Sending…" : "Submit report"}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
