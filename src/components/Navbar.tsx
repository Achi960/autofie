import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, MessageSquare, LayoutGrid, LogOut, User as UserIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { initialsOf } from "@/lib/format";

export function Navbar() {
  const { user, isAdmin, isVerifiedDealer, isPendingDealer, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();

  const handleSell = () => {
    if (!user) { setAuthOpen(true); return; }
    if (isVerifiedDealer) navigate({ to: "/submit-listing" });
    else navigate({ to: "/complete-dealer-profile" });
  };

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
                    <button className="ml-1 rounded-full ring-2 ring-white/30 hover:ring-white/60">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-white text-primary text-xs font-semibold">
                          {initialsOf(user.phone ?? user.email ?? "U")}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{user.phone ?? user.email}</DropdownMenuLabel>
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
                    {!isVerifiedDealer && !isPendingDealer && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/complete-dealer-profile" })}>
                        Become a dealer
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
                <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)} className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
                  <UserIcon className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Sign in</span>
                </Button>
                <Button onClick={handleSell} className="bg-success text-success-foreground hover:bg-success/90">Sell</Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
