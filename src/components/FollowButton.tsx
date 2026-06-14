import { useEffect, useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function FollowButton({ dealerId }: { dealerId: string }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { count: c } = await (supabase as any).from("follows")
      .select("*", { count: "exact", head: true }).eq("dealer_id", dealerId);
    setCount(c ?? 0);
    if (user && user.id !== dealerId) {
      const { data } = await (supabase as any).from("follows")
        .select("id").eq("follower_id", user.id).eq("dealer_id", dealerId).maybeSingle();
      setFollowing(!!data);
    }
  };

  useEffect(() => { load(); }, [user, dealerId]);

  if (!user || user.id === dealerId) {
    return <p className="text-xs text-muted-foreground">{count} follower{count === 1 ? "" : "s"}</p>;
  }

  const toggle = async () => {
    setLoading(true);
    if (following) {
      await (supabase as any).from("follows").delete().eq("follower_id", user.id).eq("dealer_id", dealerId);
      setFollowing(false); setCount((c) => Math.max(0, c - 1));
    } else {
      const { error } = await (supabase as any).from("follows").insert({ follower_id: user.id, dealer_id: dealerId });
      if (error) toast.error(error.message);
      else { setFollowing(true); setCount((c) => c + 1); }
    }
    setLoading(false);
  };

  return (
    <Button variant={following ? "outline" : "default"} size="sm" onClick={toggle} disabled={loading} className="w-full">
      {following ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
      {following ? "Following" : "Follow dealer"} · {count}
    </Button>
  );
}
