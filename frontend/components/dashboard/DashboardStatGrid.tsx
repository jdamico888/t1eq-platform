import StatCard from "@/components/ui/StatCard";

type DashboardStat = {
  title: string;
  value: string | number;
  subtitle?: string;
};

type DashboardStatGridProps = {
  stats: DashboardStat[];
};

export default function DashboardStatGrid({
  stats,
}: DashboardStatGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
        />
      ))}
    </div>
  );
}