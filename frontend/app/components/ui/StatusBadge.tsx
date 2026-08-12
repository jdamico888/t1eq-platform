import {
  StatusTone,
} from "../../utils/status-tone";

type Props = {
  label: string;
  tone?: StatusTone;
};

export default function StatusBadge({
  label,
  tone = "neutral",
}: Props) {
  const toneClasses: Record<StatusTone, string> = {
    neutral:
      "bg-white/25 text-black border-black/10",

    success:
      "bg-green-500/20 text-green-900 border-green-500/30",

    warning:
      "bg-yellow-500/20 text-yellow-900 border-yellow-500/30",

    danger:
      "bg-red-500/20 text-red-900 border-red-500/30",

    info:
      "bg-blue-500/20 text-blue-900 border-blue-500/30",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-3
        py-1
        text-sm
        font-semibold
        ${toneClasses[tone]}
      `}
    >
      {label}
    </span>
  );
}