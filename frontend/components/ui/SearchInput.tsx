type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchInputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500 ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
    />
  );
}