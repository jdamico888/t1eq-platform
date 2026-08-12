type SeparatorProps = {
  className?: string;
};

export default function Separator({
  className = "",
}: SeparatorProps) {
  return (
    <div
      className={`h-px w-full bg-white/10 ${className}`}
    />
  );
}