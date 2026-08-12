type LoadingStateProps = {
  title?: string;
};

export default function LoadingState({
  title = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-16 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />

        <span className="text-slate-300">
          {title}
        </span>
      </div>
    </div>
  );
}