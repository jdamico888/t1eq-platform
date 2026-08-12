type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="text-sm font-medium text-gray-500">
        {title}
      </div>

      <div className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-gray-500">
          {subtitle}
        </div>
      )}
    </div>
  );
}