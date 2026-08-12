"use client";

type SearchInputProps = {
  value?: string;

  onChange: (
    value: string
  ) => void;

  placeholder?: string;
};

export default function SearchInput({
  value = "",
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 pr-10 outline-none transition focus:border-cyan-500"
      />

      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
        🔍
      </div>
    </div>
  );
}