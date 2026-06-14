import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, Search } from "lucide-react";
import { CATEGORIES, type CategorySlug } from "@/lib/ghana";

interface Props {
  value: CategorySlug | "";
  onChange: (v: CategorySlug) => void;
}

export function CategoryPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = CATEGORIES.find((c) => c.slug === value);
  const filtered = CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-muted/50"
        >
          {current ? (
            <span className="flex items-center gap-3">
              <img src={current.image} alt="" width={28} height={28} loading="lazy" className="h-7 w-7 rounded object-cover" />
              <span className="font-medium">{current.label}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Pick a category</span>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base">Find category</DialogTitle>
        </DialogHeader>
        <div className="border-b p-3">
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find category..."
              className="h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => {
                onChange(c.slug as CategorySlug);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center justify-between border-b px-4 py-3 text-left hover:bg-muted/50"
            >
              <span className="flex items-center gap-3">
                <img src={c.image} alt="" width={36} height={36} loading="lazy" className="h-9 w-9 rounded object-cover" />
                <span className="text-sm font-medium">{c.label}</span>
              </span>

              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No category matches.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
