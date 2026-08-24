import Card from "./Card";

type MetricCardProps = {
  label: string;
  value: string | number;
  subvalue?: string | number;
  className?: string;
  hoverable?: boolean;

  qbitId?: string;
  qbitScope?: string;
};

export default function MetricCard({
  label,
  value,
  subvalue,
  className = "",
  hoverable = false,
  qbitId,
  qbitScope = "global",
}: MetricCardProps) {
  return (
    <Card
      hoverable={hoverable}
      qbitId={qbitId}
      qbitScope={qbitScope}
      className={`text-black ${className}`}
    >
      <div className="space-y-2">
        <div
          data-t1eq-qbit-type={qbitId ? "text" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-label` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className="text-sm font-semibold uppercase tracking-wide text-black/60"
        >
          {label}
        </div>

        <div
          data-t1eq-qbit-type={qbitId ? "text" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-value` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className="text-4xl font-black leading-tight"
        >
          {value}
        </div>

        {subvalue !== undefined && (
          <div
            data-t1eq-qbit-type={qbitId ? "text" : undefined}
            data-t1eq-qbit-id={qbitId ? `${qbitId}-subvalue` : undefined}
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            className="text-sm font-medium text-black/70"
          >
            {subvalue}
          </div>
        )}
      </div>
    </Card>
  );
}