import ContentCard from "@/components/ui/ContentCard";

type FormCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;

  qbitId?: string;
  qbitScope?: string;
};

export default function FormCard({
  title,
  description,
  children,
  qbitId,
  qbitScope = "global",
}: FormCardProps) {
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
        <div
          data-t1eq-qbit-type={qbitId ? "section" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-header` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className="mb-6"
        >
          <h2
            data-t1eq-qbit-type={qbitId ? "text" : undefined}
            data-t1eq-qbit-id={qbitId ? `${qbitId}-title` : undefined}
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            className="text-2xl font-semibold"
          >
            {title}
          </h2>

          {description && (
            <p
              data-t1eq-qbit-type={qbitId ? "text" : undefined}
              data-t1eq-qbit-id={
                qbitId ? `${qbitId}-description` : undefined
              }
              data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
              className="mt-1 text-sm text-slate-400"
            >
              {description}
            </p>
          )}
        </div>

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