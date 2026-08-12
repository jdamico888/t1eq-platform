type PrimaryButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
};

export default function PrimaryButton({
  children,
  type = "button",
  onClick,
  className = "",
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-xl bg-cyan-600 px-4 py-3 font-medium transition hover:bg-cyan-500 ${className}`}
    >
      {children}
    </button>
  );
}