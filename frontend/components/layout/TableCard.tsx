import ContentCard from "@/components/ui/ContentCard";
import SectionHeader from "@/components/ui/SectionHeader";

type TableCardProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export default function TableCard({
  title,
  description,
  actions,
  children,
}: TableCardProps) {
  return (
    <ContentCard>
      <SectionHeader
        title={title}
        description={description}
        actions={actions}
      />

      {children}
    </ContentCard>
  );
}