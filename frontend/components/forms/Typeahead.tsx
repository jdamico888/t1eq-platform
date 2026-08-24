"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type TypeaheadOption<TData = unknown> = {
  id: string;
  label: string;
  sublabel?: string;
  data?: TData;
};

type TypeaheadTheme = "light" | "dark";

type TypeaheadProps<TData = unknown> = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: TypeaheadOption<TData>) => void;
  onBlur?: () => void;

  options: TypeaheadOption<TData>[];

  label?: string;
  placeholder?: string;

  noMatchHint?: string;

  minChars?: number;
  maxSuggestions?: number;

  qbitId?: string;
  qbitScope?: string;

  theme?: TypeaheadTheme;

  disabled?: boolean;
  required?: boolean;

  className?: string;
  inputClassName?: string;
};

const THEME_CLASSES: Record<
  TypeaheadTheme,
  {
    label: string;
    input: string;
    dropdown: string;
    option: string;
    optionHighlighted: string;
    sublabel: string;
    hint: string;
  }
> = {
  light: {
    label: "mb-1 block text-sm font-medium text-black",
    input:
      "w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50",
    dropdown:
      "absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg",
    option: "text-black hover:bg-zinc-100",
    optionHighlighted: "bg-zinc-100",
    sublabel: "text-black/50",
    hint: "mt-1 text-xs text-black/50",
  },
  dark: {
    label: "text-xs font-semibold uppercase tracking-wide text-white/50",
    input:
      "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-50",
    dropdown:
      "absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-lg",
    option: "text-white hover:bg-white/10",
    optionHighlighted: "bg-white/10",
    sublabel: "text-white/50",
    hint: "mt-1 text-xs text-white/50",
  },
};

export function filterTypeaheadOptions<TData>(
  options: TypeaheadOption<TData>[],
  query: string,
  maxResults = 8
): TypeaheadOption<TData>[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const matches = options.filter((option) => {
    return (
      option.label.toLowerCase().includes(normalizedQuery) ||
      Boolean(option.sublabel?.toLowerCase().includes(normalizedQuery))
    );
  });

  matches.sort((left, right) => {
    const leftStartsWith = left.label.toLowerCase().startsWith(normalizedQuery);
    const rightStartsWith = right.label.toLowerCase().startsWith(normalizedQuery);

    if (leftStartsWith !== rightStartsWith) {
      return leftStartsWith ? -1 : 1;
    }

    return left.label.localeCompare(right.label);
  });

  return matches.slice(0, maxResults);
}

export function findExactTypeaheadMatch<TData>(
  options: TypeaheadOption<TData>[],
  query: string
): TypeaheadOption<TData> | undefined {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return undefined;
  }

  return options.find(
    (option) => option.label.trim().toLowerCase() === normalizedQuery
  );
}

export default function Typeahead<TData = unknown>({
  value,
  onChange,
  onSelect,
  onBlur,
  options,
  label,
  placeholder = "Start typing...",
  noMatchHint,
  minChars = 1,
  maxSuggestions = 8,
  qbitId,
  qbitScope = "global",
  theme = "light",
  disabled = false,
  required = false,
  className = "",
  inputClassName = "",
}: TypeaheadProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const themeClasses = THEME_CLASSES[theme];

  const suggestions = useMemo(() => {
    if (value.trim().length < minChars) {
      return [];
    }

    return filterTypeaheadOptions(options, value, maxSuggestions);
  }, [options, value, minChars, maxSuggestions]);

  const hasExactMatch = useMemo(() => {
    return Boolean(findExactTypeaheadMatch(options, value));
  }, [options, value]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  function selectOption(option: TypeaheadOption<TData>) {
    onChange(option.label);
    onSelect?.(option);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length
      );
      return;
    }

    if (event.key === "Enter") {
      const highlighted = suggestions[highlightedIndex];

      if (highlighted) {
        event.preventDefault();
        selectOption(highlighted);
      }

      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const showDropdown = isOpen && suggestions.length > 0;

  const showNoMatchHint =
    Boolean(noMatchHint) &&
    value.trim().length >= minChars &&
    !hasExactMatch &&
    suggestions.length === 0;

  return (
    <label
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId ? `${qbitId}-wrapper` : undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={`relative block ${className}`}
    >
      {label && (
        <span
          data-t1eq-qbit-type={qbitId ? "text" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-label` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className={themeClasses.label}
        >
          {label}
        </span>
      )}

      <input data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={qbitId || undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
        type="text"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
          }, 150);

          onBlur?.();
        }}
        onKeyDown={handleKeyDown}
        className={`${themeClasses.input} ${label ? "mt-1" : ""} ${inputClassName}`}
      />

      {showNoMatchHint && (
        <p
          data-t1eq-qbit-type={qbitId ? "text" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-no-match-hint` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className={themeClasses.hint}
        >
          {noMatchHint}
        </p>
      )}

      {showDropdown && (
        <div
          data-t1eq-qbit-type={qbitId ? "section" : undefined}
          data-t1eq-qbit-id={qbitId ? `${qbitId}-suggestions` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className={themeClasses.dropdown}
        >
          {suggestions.map((option, index) => (
            <button data-t1eq-action-button="true"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id={
                qbitId ? `${qbitId}-suggestion-${option.id}` : undefined
              }
              data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
              key={option.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                selectOption(option);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`block w-full px-3 py-2 text-left text-sm transition ${
                themeClasses.option
              } ${index === highlightedIndex ? themeClasses.optionHighlighted : ""}`}
            >
              <div className="font-semibold">{option.label}</div>

              {option.sublabel && (
                <div className={`text-xs ${themeClasses.sublabel}`}>
                  {option.sublabel}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
