import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  /** Label used in the "Add …" row, e.g. "model" */
  noun?: string;
}

/**
 * Searchable picker that ALSO accepts anything the user types.
 * If the typed value isn't in the list, an "Add …" row appears so
 * dealers can enter makes/models/brands we don't have yet.
 */
export function ComboBox({ value, onChange, options, placeholder = "Select", disabled, noun = "entry" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const pretty = (s: string) => s.replace(/_/g, " ");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => pretty(o).toLowerCase().includes(q));
  }, [options, query]);

  const typed = query.trim();
  const exact = options.some((o) => pretty(o).toLowerCase() === typed.toLowerCase());

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
        >
          <span className="truncate">{value ? pretty(value) : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder={`Search or type your own ${noun}…`} />
          <CommandList className="max-h-72">
            {typed && !exact && (
              <CommandGroup>
                <CommandItem value={`__add__${typed}`} onSelect={() => pick(typed)}>
                  <Plus className="mr-2 h-4 w-4 text-primary" />
                  Add “{typed}”
                </CommandItem>
              </CommandGroup>
            )}
            {filtered.length === 0 && !typed && <CommandEmpty>Nothing here yet — type to add your own.</CommandEmpty>}
            <CommandGroup>
              {filtered.map((o) => (
                <CommandItem key={o} value={o} onSelect={() => pick(o)}>
                  <Check className={cn("mr-2 h-4 w-4", value === o ? "opacity-100" : "opacity-0")} />
                  {pretty(o)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
