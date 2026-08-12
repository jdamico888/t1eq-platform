import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

type FormPageLayoutProps = {
  title: string;

  description?: string;

  actions?: React.ReactNode;

  children: React.ReactNode;
};

export default function FormPageLayout({
  title,
  description,
  actions,
  children,
}: FormPageLayoutProps) {
  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={description}
        actions={actions}
      />

      {children}
    </PageContainer>
  );
}