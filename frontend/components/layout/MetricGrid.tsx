import StatCard from "@/components/ui/StatCard";

type Metric = {
  title: string;

  value: string | number;

  subtitle?: string;
};

type MetricGridProps = {
  metrics: Metric[];
};

export default function MetricGrid({
  metrics,
}: MetricGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <StatCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
        />
      ))}
    </div>
  );
}