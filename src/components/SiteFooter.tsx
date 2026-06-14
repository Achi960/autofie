import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Facebook, Instagram, Youtube, Twitter, ShieldCheck } from "lucide-react";

/**
 * SiteFooter — branded footer with a stylised Kumasi skyline silhouette.
 * Skyline is an original SVG drawn in our brand navy (--secondary) sitting on
 * the page background, then a navy footer slab with gold (--primary) accents.
 */
export function SiteFooter() {
  return (
    <footer className="mt-16">
      {/* Skyline band */}
      <div className="relative w-full overflow-hidden bg-background">
        <KumasiSkyline />
      </div>

      {/* Footer slab */}
      <div className="bg-secondary text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold">A</span>
                <span className="text-lg font-extrabold tracking-tight">AutoFie</span>
              </div>
              <p className="mt-3 text-sm text-white/75">
                Ghana's verified vehicle marketplace. Built in Kumasi, trusted across all 16 regions.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Ghana Card verified dealers
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Company</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link to="/about" className="text-white/85 hover:text-white">About us</Link></li>
                <li><Link to="/contact" className="text-white/85 hover:text-white">Contact us</Link></li>
                <li><Link to="/safety-tips" className="text-white/85 hover:text-white">Safety tips</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Legal</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link to="/terms" className="text-white/85 hover:text-white">Terms &amp; Conditions</Link></li>
                <li><Link to="/privacy" className="text-white/85 hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Reach us */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Reach us</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li className="flex items-start gap-2 text-white/85">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href="mailto:autofieghana@gmail.com" className="hover:text-white break-all">autofieghana@gmail.com</a>
                </li>
                <li className="flex items-start gap-2 text-white/85">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Headquartered in Kumasi, Ashanti Region, Ghana</span>
                </li>
              </ul>
              <div className="mt-5 flex items-center gap-3">
                <a aria-label="Facebook" href="#" className="rounded-full bg-white/10 p-2 hover:bg-primary hover:text-primary-foreground"><Facebook className="h-4 w-4" /></a>
                <a aria-label="Instagram" href="#" className="rounded-full bg-white/10 p-2 hover:bg-primary hover:text-primary-foreground"><Instagram className="h-4 w-4" /></a>
                <a aria-label="YouTube" href="#" className="rounded-full bg-white/10 p-2 hover:bg-primary hover:text-primary-foreground"><Youtube className="h-4 w-4" /></a>
                <a aria-label="Twitter" href="#" className="rounded-full bg-white/10 p-2 hover:bg-primary hover:text-primary-foreground"><Twitter className="h-4 w-4" /></a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
            <p className="text-xs text-white/70">© {new Date().getFullYear()} AutoFie Ghana. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span aria-hidden className="inline-block h-3 w-5 overflow-hidden rounded-sm">
                <span className="flex h-full w-full flex-col">
                  <span className="h-1/3 bg-[#CE1126]" />
                  <span className="relative h-1/3 bg-[#FCD116]">
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[6px] leading-none text-black">★</span>
                  </span>
                  <span className="h-1/3 bg-[#006B3F]" />
                </span>
              </span>
              <span>Made with pride in Ghana</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Stylised, original Kumasi-inspired skyline silhouette.
 * References landmarks like Kejetia dome, Manhyia, the Central Mosque minaret and
 * Cultural Centre arches — drawn as abstract shapes (not traced) so it is brand-owned.
 */
function KumasiSkyline() {
  return (
    <svg
      role="img"
      aria-label="Kumasi skyline silhouette"
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      className="block h-32 w-full sm:h-44 md:h-52"
    >
      <defs>
        <linearGradient id="afSkyFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--secondary)" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Soft glow / sun behind */}
      <circle cx="1080" cy="90" r="44" fill="var(--primary)" opacity="0.22" />
      <circle cx="1080" cy="90" r="22" fill="var(--primary)" opacity="0.45" />

      {/* Skyline path — original abstract silhouette */}
      <path
        fill="url(#afSkyFill)"
        d="
          M0,220 L0,170
          L40,170 L40,150 L70,150 L70,170 L95,170 L95,130 L120,130 L120,170
          L150,170 L150,110 L165,90 L180,110 L180,170
          L210,170 L210,140 L240,140 L250,120 L260,140 L290,140 L290,170
          L320,170 L320,100 L335,100 L335,80 L355,80 L355,100 L370,100 L370,170
          L400,170 L400,130 L430,130 L430,150 L455,150 L455,90 L470,90 L470,150 L495,150 L495,170
          L525,170 L525,120 L545,120 L545,100 L575,100 L575,120 L595,120 L595,170
          L620,170 L620,140 L660,140 L660,110
          C660,90 680,80 700,80 C720,80 740,90 740,110
          L740,170 L770,170 L770,90 L790,90 L790,70 L810,70 L810,90 L830,90 L830,170
          L860,170 L860,120 L885,120 L890,100 L895,120 L920,120 L920,170
          L950,170 L950,80 L965,80 L965,30 L975,30 L975,80 L1000,80 L1000,170
          L1030,170 L1030,140
          C1030,120 1055,110 1080,110 C1105,110 1130,120 1130,140
          L1130,170 L1160,170 L1160,90 L1170,90 L1170,60 L1185,60 L1185,90 L1200,90 L1200,170
          L1230,170 L1230,130 L1260,130 L1260,150 L1290,150 L1290,170
          L1320,170 L1320,120 L1345,120 L1345,100 L1365,100 L1365,120 L1395,120 L1395,170
          L1440,170 L1440,220 Z
        "
      />

      {/* Minaret + flag detail (mosque tower) */}
      <line x1="165" y1="90" x2="165" y2="55" stroke="var(--secondary)" strokeWidth="2" />
      <circle cx="165" cy="50" r="4" fill="var(--secondary)" />
      <line x1="700" y1="80" x2="700" y2="50" stroke="var(--secondary)" strokeWidth="2" />
      <circle cx="700" cy="46" r="4" fill="var(--primary)" />
      <line x1="970" y1="30" x2="970" y2="10" stroke="var(--secondary)" strokeWidth="2" />
      <circle cx="970" cy="8" r="3" fill="var(--primary)" />
    </svg>
  );
}
