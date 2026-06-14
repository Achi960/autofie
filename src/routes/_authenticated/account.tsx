import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl, uploadFile } from "@/lib/storage";
import { initialsOf } from "@/lib/format";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
});

function AccountPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setFirst(profile.first_name || "");
    setLast(profile.last_name || "");
    setPhone(profile.phone || "");
    if (profile.avatar_url) {
      signedUrl("avatars", profile.avatar_url).then(setAvatarUrl);
    } else setAvatarUrl(null);
  }, [profile]);

  const onPickAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      await uploadFile("avatars", path, file);
      const { error } = await supabase.from("profiles").update({ avatar_url: path } as any).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile picture updated");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const full_name = [first, last].filter(Boolean).join(" ").trim() || null;
    const { error } = await supabase.from("profiles").update({
      first_name: first || null,
      last_name: last || null,
      full_name,
      phone: phone || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Saved");
  };

  const display = profile?.full_name || user?.email || "U";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-bold">My account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile picture, name and phone number.</p>

        <div className="mt-6 flex items-center gap-4 rounded-xl border bg-card p-5">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={display} />}
              <AvatarFallback className="bg-primary/10 text-primary text-lg">{initialsOf(display)}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow"
              aria-label="Change picture"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickAvatar(f); }} />
          </div>
          <div>
            <p className="font-semibold">{display}</p>
            <p className="text-xs text-muted-foreground">JPG or PNG, max 5 MB</p>
          </div>
        </div>

        <div className="mt-4 space-y-4 rounded-xl border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>First name</Label><Input value={first} onChange={(e) => setFirst(e.target.value)} maxLength={50} /></div>
            <div className="space-y-1.5"><Label>Last name</Label><Input value={last} onChange={(e) => setLast(e.target.value)} maxLength={50} /></div>
          </div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} /></div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
