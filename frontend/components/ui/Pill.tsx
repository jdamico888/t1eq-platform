type PillProps = {
  children: React.ReactNode;

  active?: boolean;

  onClick?: () => void;
};

export default function Pill({
  children,
  active = false,
  onClick,
}: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-cyan-600 text-white"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}