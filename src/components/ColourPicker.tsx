import { CAR_COLOURS } from "@/lib/ghana";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ColourPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select colour" /></SelectTrigger>
      <SelectContent className="max-h-72">
        {CAR_COLOURS.map((c) => (
          <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
