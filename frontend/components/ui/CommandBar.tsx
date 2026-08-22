"use client";

type CommandBarProps = {
  left?: React.ReactNode;

  center?: React.ReactNode;

  right?: React.ReactNode;
};

export default function CommandBar({
  left,
  center,
  right,
}: CommandBarProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        {left}
      </div>

      {center && (
        <div className="flex flex-1 justify-center">
          {center}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {right}
      </div>
    </div>
  );
}