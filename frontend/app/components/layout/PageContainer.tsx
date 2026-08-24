type Props = {
  children: React.ReactNode;

  qbitId?: string;
  qbitScope?: string;
};

export default function PageContainer({
  children,
  qbitId,
  qbitScope = "global",
}: Props) {
  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className="
        min-h-screen
        p-6
        space-y-6
      "
    >
      {children}
    </div>
  );
}