import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import ContentCard from "@/components/ui/ContentCard";

type ListPageLayoutProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;

  qbitId?: string;
  qbitScope?: string;
};

export default function ListPageLayout({
  title,
  description,
  actions,
  filters,
  children,
  qbitId,
  qbitScope = "global",
}: ListPageLayoutProps) {
  return (
    <PageContainer
      padded={false}
      qbitId={qbitId ? `${qbitId}-page-container` : undefined}
      qbitScope={qbitScope}
    >
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        qbitId={qbitId ? `${qbitId}-page-header` : undefined}
        qbitScope={qbitScope}
      />

      {filters && (
        <ContentCard
          qbitId={qbitId ? `${qbitId}-filters-card` : undefined}
          qbitScope={qbitScope}
          className="p-4"
        >
          <div
            data-t1eq-qbit-type={qbitId ? "section" : undefined}
            data-t1eq-qbit-id={
              qbitId ? `${qbitId}-filters-content` : undefined
            }
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          >
            {filters}
          </div>
        </ContentCard>
      )}

      <div
        data-t1eq-qbit-type={qbitId ? "section" : undefined}
        data-t1eq-qbit-id={qbitId ? `${qbitId}-content` : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      >
        {children}
      </div>
    </PageContainer>
  );
}