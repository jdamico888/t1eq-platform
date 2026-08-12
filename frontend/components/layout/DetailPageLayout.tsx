import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

type DetailPageLayoutProps = {
  title: string;

  description?: string;

  actions?: React.ReactNode;

  sidebar?: React.ReactNode;

  children: React.ReactNode;
};

export default function DetailPageLayout({
  title,
  description,
  actions,
  sidebar,
  children,
}: DetailPageLayoutProps) {
  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={description}
        actions={actions}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {children}
        </div>

        {sidebar && (
          <div className="space-y-6">
            {sidebar}
          </div>
        )}
      </div>
    </PageContainer>
  );
}