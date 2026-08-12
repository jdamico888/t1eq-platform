import ContentCard from "@/components/ui/ContentCard";

type FormCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export default function FormCard({
  title,
  description,
  children,
}: FormCardProps) {
  return (
    <ContentCard>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>

      {children}
    </ContentCard>
  );
}