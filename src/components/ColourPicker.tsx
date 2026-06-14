import { CAR_COLOURS } from "@/lib/ghana";

export function ColourPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
      {CAR_COLOURS.map((c) => {
        const selected = value === c.name;
        return (
          <button
            key={c.name}
            type="button"
            onClick={() => onChange(c.name)}
            title={c.name}
            className={`flex flex-col items-center gap-1 rounded-md border p-1.5 transition ${
              selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
            }`}
          >
            <span
              className="h-7 w-7 rounded-full border border-black/10"
              style={{ background: c.hex }}
            />
            <span className="truncate text-[10px] leading-tight text-foreground">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
