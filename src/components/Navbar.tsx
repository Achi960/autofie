import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, MessageSquare, LayoutGrid, LogOut, User as UserIcon, ShieldCheck, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { initialsOf } from "@/lib/format";
import { signedUrl } from "@/lib/storage";

export function Navbar() {
  const { user, profile, isAdmin, isVerifiedDealer, isPendingDealer, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<"choose" | "register">("choose");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    if (profile?.avatar_url) {
      signedUrl("avatars", profile.avatar_url).then((u) => { if (alive) setAvatarUrl(u); });
    } else setAvatarUrl(null);
    return () => { alive = false; };
  }, [profile?.avatar_url]);

  const handleSell = () => {
    if (!user) { setAuthStep("choose"); setAuthOpen(true); return; }
    if (isVerifiedDealer) navigate({ to: "/submit-listing" });
    else navigate({ to: "/complete-dealer-profile" });
  };

  const openRegister = () => { setAuthStep("register"); setAuthOpen(true); };
  const openSignIn = () => { setAuthStep("choose"); setAuthOpen(true); };

  const displayName = profile?.full_name || user?.email || "U";

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
                <Link to="/my-saved" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                    <Heart className="h-4 w-4" />
                    <span className="hidden md:inline">Saved</span>
                  </Button>
                </Link>
                <Link to="/messages" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden md:inline">Messages</span>
                  </Button>
                </Link>
                {(isVerifiedDealer || isPendingDealer) && (
                  <Link to="/my-listings">
                    <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden md:inline">My listings</span>
                    </Button>
                  </Link>
                )}
                <Button onClick={handleSell} className="bg-success text-success-foreground hover:bg-success/90">Sell</Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1 rounded-full ring-2 ring-white/30 hover:ring-white/60" aria-label="Account">
                      <Avatar className="h-8 w-8">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                        <AvatarFallback className="bg-white text-primary text-xs font-semibold">
                          {initialsOf(displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{profile?.full_name || user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/account" })}>
                      <SettingsIcon className="mr-2 h-4 w-4" /> Account & profile picture
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/dealers" })}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Admin: Dealers
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate({ to: "/admin/listings" })}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Admin: Listings
                        </DropdownMenuItem>
                      </>
                    )}
                    {!isVerifiedDealer && !isPendingDealer && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/complete-dealer-profile" })}>
                        Become a dealer
                      </DropdownMenuItem>
                    )}
                    {(isVerifiedDealer || isPendingDealer) && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/my-listings/closed" })}>
                        Closed listings
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate({ to: "/my-saved" })}>
                      <Heart className="mr-2 h-4 w-4" /> Saved
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={openSignIn} className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                  <UserIcon className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Sign in</span>
                </Button>
                <Button variant="outline" size="sm" onClick={openRegister} className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                  Register
                </Button>
                <Button onClick={handleSell} className="bg-success text-success-foreground hover:bg-success/90">Sell</Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialStep={authStep} />
    </>
  );
}
