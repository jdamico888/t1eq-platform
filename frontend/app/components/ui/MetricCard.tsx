import Card from "./Card";

type MetricCardProps = {
  label: string;
  value: string | number;
  subvalue?: string | number;
  className?: string;
  hoverable?: boolean;
};

export default function MetricCard({
  label,
  value,
  subvalue,
  className = "",
  hoverable = false,
}: MetricCardProps) {
  return (
    <Card
      hoverable={hoverable}
      className={`text-black ${className}`}
    >
      <div className="space-y-2">
        <div className="text-sm font-semibold uppercase tracking-wide text-black/60">
          {label}
        </div>

        <div className="text-4xl font-black leading-tight">
          {value}
        </div>

        {subvalue !== undefined && (
          <div className="text-sm font-medium text-black/70">
            {subvalue}
          </div>
        )}
      </div>
    </Card>
  );
}