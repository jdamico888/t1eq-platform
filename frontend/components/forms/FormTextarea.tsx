type FormTextareaProps = {
  name: string;
  value?: string;
  onChange: (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;

  placeholder?: string;
  label?: string;
  rows?: number;
  required?: boolean;
};

export default function FormTextarea({
  name,
  value,
  onChange,
  placeholder,
  label,
  rows = 4,
  required = false,
}: FormTextareaProps) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm text-slate-300">
          {label}
        </label>
      )}

      <textarea
        className="min-h-[120px] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500"
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
      />
    </div>
  );
}