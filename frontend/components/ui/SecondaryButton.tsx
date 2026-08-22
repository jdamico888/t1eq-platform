type SecondaryButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
};

export default function SecondaryButton({
  children,
  type = "button",
  onClick,
  className = "",
}: SecondaryButtonProps) {
  return (
    <button data-t1eq-action-button="true"
      type={type}
      onClick={onClick}
      className={`rounded-xl border border-white/10 px-4 py-3 transition hover:bg-white/10 ${className}`}
    >
      {children}
    </button>
  );
}