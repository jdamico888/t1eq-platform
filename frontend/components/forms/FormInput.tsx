type FormInputProps = {
  name: string;
  value?: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;

  placeholder?: string;
  label?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function FormInput({
  name,
  value,
  onChange,
  placeholder,
  label,
  type = "text",
  required = false,
  disabled = false,
}: FormInputProps) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm text-slate-300">
          {label}
        </label>
      )}

      <input
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500 disabled:opacity-50"
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}