"use client";

type Tab = {
  label: string;
  value: string;
};

type TabBarProps = {
  tabs: Tab[];

  activeTab: string;

  onChange: (
    value: string
  ) => void;
};

export default function TabBar({
  tabs,
  activeTab,
  onChange,
}: TabBarProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl">
      {tabs.map((tab) => {
        const isActive =
          tab.value === activeTab;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() =>
              onChange(
                tab.value
              )
            }
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "bg-cyan-600 text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}