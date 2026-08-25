type PageContainerProps = {
  children: React.ReactNode;

  /**
   * Whether this container supplies the page's own frame.
   *
   * There used to be two PageContainers — this one and a copy under
   * app/components/layout — and the only difference between them was that
   * the copy added `min-h-screen p-6`. Pages that render straight into
   * <main> need that frame; pages that go through ListPageLayout are
   * already inside a padded card and would get a doubled gutter from it.
   */
  padded?: boolean;

  qbitId?: string;
  qbitScope?: string;
};

export default function PageContainer({
  children,
  padded = true,
  qbitId,
  qbitScope = "global",
}: PageContainerProps) {
  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId || undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={padded ? "min-h-screen space-y-6 p-6" : "space-y-6"}
    >
      {children}
    </div>
  );
}
