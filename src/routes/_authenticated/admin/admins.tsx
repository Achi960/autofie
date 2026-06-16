import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/admins")({
  component: AdminAdmins,
});

type AdminRow = {
  user_id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  granted_at: string | null;
};

function AdminAdmins() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Admins only");
      navigate({ to: "/" });
    }
  }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    const { data, error } = await supabase.rpc("list_admins");
    if (error) { toast.error(error.message); return; }
    setAdmins((data ?? []) as AdminRow[]);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const addAdmin = async () => {
    const id = identifier.trim();
    if (!id) { toast.error("Enter an email or phone"); return; }
    setBusy(true);
    try {
      const { data: matches, error } = await supabase.rpc("find_user_by_identifier", { _identifier: id });
      if (error) throw error;
      const found = (matches ?? [])[0] as AdminRow | undefined;
      if (!found) {
        toast.error("No registered user found with that email or phone");
        return;
      }
      const { error: insErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: found.user_id, role: "admin" as const }, { onConflict: "user_id,role" });
      if (insErr) throw insErr;

      await supabase.from("user_notifications").insert({
        user_id: found.user_id,
        type: "admin_grant",
        title: "You're now an admin",
        message: "An administrator has granted you admin access on AutoFie. You can now manage dealers and listings.",
        link: "/admin/dealers",
        actor_id: user?.id ?? null,
      });

      toast.success(`${found.full_name || found.email || "User"} is now an admin`);
      setIdentifier("");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add admin");
    } finally {
      setBusy(false);
    }
  };

  const removeAdmin = async (row: AdminRow) => {
    if (row.user_id === user?.id) { toast.error("You can't remove yourself"); return; }
    if (!confirm(`Remove admin access from ${row.full_name || row.email || "this user"}?`)) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", row.user_id)
      .eq("role", "admin");
    if (error) { toast.error(error.message); return; }
    toast.success("Admin access removed");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold">Admin · Administrators</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grant admin access to other registered users by their email or phone number. They become admin instantly and receive an in-app notification.
        </p>

        <div className="mt-5 rounded-xl border bg-card p-4">
          <label className="text-sm font-medium">Add a new admin</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="user@example.com or +233..."
              onKeyDown={(e) => { if (e.key === "Enter") addAdmin(); }}
            />
            <Button onClick={addAdmin} disabled={busy}>
              <UserPlus className="mr-2 h-4 w-4" /> {busy ? "Adding…" : "Make admin"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">The person must already have an AutoFie account.</p>
        </div>

        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Current admins ({admins.length})</h2>
          {admins.length === 0 && <p className="text-sm text-muted-foreground">No admins yet.</p>}
          {admins.map((a) => (
            <div key={a.user_id} className="flex items-center justify-between rounded-lg border bg-card p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="truncate font-medium">{a.full_name || a.email || a.phone || a.user_id}</p>
                  {a.user_id === user?.id && <Badge variant="outline" className="text-xs">You</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">{a.email ?? "—"} {a.phone ? `· ${a.phone}` : ""}</p>
              </div>
              {a.user_id !== user?.id && (
                <Button size="sm" variant="outline" onClick={() => removeAdmin(a)} className="border-destructive/40 text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
