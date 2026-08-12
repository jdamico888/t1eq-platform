import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

type ListPageLayoutProps = {
  title: string;

  description?: string;

  actions?: React.ReactNode;

  filters?: React.ReactNode;

  children: React.ReactNode;
};

export default function ListPageLayout({
  title,
  description,
  actions,
  filters,
  children,
}: ListPageLayoutProps) {
  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={description}
        actions={actions}
      />

      {filters && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          {filters}
        </div>
      )}

      {children}
    </PageContainer>
  );
}