import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

export function EmailInput({
  id = "email",
  label,
  value,
  onChange,
  placeholder = "naam@voorbeeld.nl",
  required = false,
}: EmailInputProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-zinc-400">
        {label}
      </Label>
      <Input
        id={id}
        type="email"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="bg-zinc-900/50 border-zinc-800/50 text-white placeholder:text-zinc-600 focus:border-[#2A9D8F]/50 focus:ring-[#2A9D8F]/50 transition-colors duration-200"
        required={required}
      />
    </div>
  );
} 