type Props = {
  title: string;
  message?: string;
  action?: React.ReactNode;
};

export default function EmptyState({
  title,
  message,
  action,
}: Props) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-black/10
        bg-white/15
        p-6
        text-black
      "
    >
      <div className="space-y-3">
        <h3 className="text-xl font-bold">
          {title}
        </h3>

        {message && (
          <p className="text-black/60">
            {message}
          </p>
        )}

        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}