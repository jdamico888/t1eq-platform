export const formatCurrency = (value: number | undefined | null) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value ?? 0);
};

export const formatDate = (value?: string | null) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export const formatPercent = (value: number | undefined | null) => {
  return `${(value ?? 0).toFixed(2)}%`;
};