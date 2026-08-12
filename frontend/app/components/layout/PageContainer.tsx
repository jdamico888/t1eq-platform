type Props = {
  children: React.ReactNode;
};

export default function PageContainer({
  children,
}: Props) {
  return (
    <div
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