type TwoColumnLayoutProps = {
  left: React.ReactNode;
  right: React.ReactNode;
};

export default function TwoColumnLayout({
  left,
  right,
}: TwoColumnLayoutProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <div>{left}</div>

      <div>{right}</div>
    </div>
  );
}