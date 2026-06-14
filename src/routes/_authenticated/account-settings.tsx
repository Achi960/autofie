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

export const Route = createFileRoute("/_authenticated/account-settings")({
  component: AccountSettings,
});

function AccountSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("first_name, last_name, phone, avatar_url, full_name").eq("id", user.id).maybeSingle();
      setFirstName(data?.first_name ?? "");
      setLastName(data?.last_name ?? "");
      setPhone(data?.phone ?? "");
      setAvatarPath(data?.avatar_url ?? null);
      if (data?.avatar_url) setAvatarSrc(await signedUrl("avatars", data.avatar_url));
      setLoading(false);
    })();
  }, [user?.id]);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      await uploadFile("avatars", path, file);
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      setAvatarPath(path);
      const url = await signedUrl("avatars", path);
      setAvatarSrc(url);
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!user) return;
    if (!firstName.trim() || !lastName.trim()) { toast.error("First and last name required"); return; }
    setSaving(true);
    const full = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { error } = await supabase.from("profiles").update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: full,
      phone: phone.trim() || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-muted-foreground">Loading…</div>
    </div>
  );

  const displayName = `${firstName} ${lastName}`.trim() || user?.email || "U";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update your profile information and photo.</p>

        <div className="mt-6 space-y-6 rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {initialsOf(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                {avatarPath ? "Change photo" : "Upload photo"}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">JPG or PNG, max 5MB.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-1.5"><Label>Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} />
            </div>
          </div>

          <div className="space-y-1.5"><Label>Phone</Label>
            <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="+233…" />
          </div>

          <div className="space-y-1.5"><Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">Contact support to change your email.</p>
          </div>

          <Button onClick={save} disabled={saving} size="lg" className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
