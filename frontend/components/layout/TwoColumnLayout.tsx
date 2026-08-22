type TwoColumnLayoutProps = {
  left: React.ReactNode;
  right: React.ReactNode;

  qbitId?: string;
  qbitScope?: string;
};

export default function TwoColumnLayout({
  left,
  right,
  qbitId,
  qbitScope = "global",
}: TwoColumnLayoutProps) {
  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className="grid gap-6 lg:grid-cols-[420px_1fr]"
    >
      <div
        data-t1eq-qbit-type={qbitId ? "section" : undefined}
        data-t1eq-qbit-id={qbitId ? `${qbitId}-left-column` : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      >
        {left}
      </div>

      <div
        data-t1eq-qbit-type={qbitId ? "section" : undefined}
        data-t1eq-qbit-id={qbitId ? `${qbitId}-right-column` : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      >
        {right}
      </div>
    </div>
  );
}