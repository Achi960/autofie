import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, MessageSquare, LayoutGrid, LogOut, User as UserIcon, ShieldCheck, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { initialsOf } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";

export function Navbar() {
  const { user, isAdmin, isVerifiedDealer, isPendingDealer, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<"choose" | "signin" | "register">("choose");
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setProfile(null); setAvatarSrc(null); return; }
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setProfile(data ?? null);
        if (data?.avatar_url) signedUrl("avatars", data.avatar_url).then(setAvatarSrc);
        else setAvatarSrc(null);
      });
  }, [user?.id]);

  const openAuth = (s: "signin" | "register") => { setAuthStep(s); setAuthOpen(true); };

  const handleSell = () => {
    if (!user) { openAuth("signin"); return; }
    if (isVerifiedDealer) navigate({ to: "/submit-listing" });
    else navigate({ to: "/complete-dealer-profile" });
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || user?.phone || "U";

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span>Autofie</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                <Link to="/my-saved" aria-label="Saved" className="rounded-full p-2 hover:bg-white/15">
                  <Heart className="h-5 w-5" />
                </Link>
                <Link to="/messages" aria-label="Messages" className="rounded-full p-2 hover:bg-white/15">
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <button aria-label="Notifications" className="rounded-full p-2 hover:bg-white/15" onClick={() => navigate({ to: "/messages" })}>
                  <Bell className="h-5 w-5" />
                </button>
                {(isVerifiedDealer || isPendingDealer) && (
                  <Link to="/my-listings" aria-label="My listings" className="hidden sm:inline-flex rounded-full p-2 hover:bg-white/15">
                    <LayoutGrid className="h-5 w-5" />
                  </Link>
                )}
                <Button onClick={handleSell} className="ml-1 bg-success text-success-foreground hover:bg-success/90 font-semibold">SELL</Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1 rounded-full ring-2 ring-white/30 hover:ring-white/60">
                      <Avatar className="h-8 w-8">
                        {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
                        <AvatarFallback className="bg-white text-primary text-xs font-semibold">
                          {initialsOf(displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate">
                      <div className="text-sm font-medium">{displayName}</div>
                      <div className="truncate text-xs text-muted-foreground">{user.email ?? user.phone}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/dealers" })}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Admin: Dealers
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/listings" })}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Admin: Listings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => user && navigate({ to: "/user/$id", params: { id: user.id } })}>
                      <UserIcon className="mr-2 h-4 w-4" /> My profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/account-settings" })}>
                      <Settings className="mr-2 h-4 w-4" /> Account settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/my-saved" })}>
                      <Heart className="mr-2 h-4 w-4" /> Saved
                    </DropdownMenuItem>
                    {(isVerifiedDealer || isPendingDealer) && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/my-listings" })}>
                        <LayoutGrid className="mr-2 h-4 w-4" /> My listings
                      </DropdownMenuItem>
                    )}
                    {(isVerifiedDealer || isPendingDealer) && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/complete-dealer-profile" })}>
                        Edit verification
                      </DropdownMenuItem>
                    )}
                    {!isVerifiedDealer && !isPendingDealer && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/complete-dealer-profile" })}>
                        Become a dealer
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => openAuth("signin")} className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                  <UserIcon className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Sign in</span>
                </Button>
                <Button size="sm" onClick={() => openAuth("register")} className="bg-white text-primary hover:bg-white/90 font-semibold">
                  Register
                </Button>
                <Button onClick={handleSell} className="bg-success text-success-foreground hover:bg-success/90 font-semibold">SELL</Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialStep={authStep} />
    </>
  );
}
