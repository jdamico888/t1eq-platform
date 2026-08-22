import ContentCard from "@/components/ui/ContentCard";
import SectionHeader from "@/components/ui/SectionHeader";

type TableCardProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;

  qbitId?: string;
  qbitScope?: string;
};

export default function TableCard({
  title,
  description,
  actions,
  children,
  qbitId,
  qbitScope = "global",
}: TableCardProps) {
  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId ? `${qbitId}-wrapper` : undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
    >
      <ContentCard
        qbitId={qbitId ? `${qbitId}-card` : undefined}
        qbitScope={qbitScope}
      >
        <SectionHeader
          title={title}
          description={description}
          actions={actions}
          qbitId={qbitId ? `${qbitId}-header` : undefined}
          qbitScope={qbitScope}
        />

        <div
          data-t1eq-qbit-type={qbitId ? "section" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-body` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
        >
          {children}
        </div>
      </ContentCard>
    </div>
  );
}