export function calculateSubtotal(
  values: number[]
): number {
  return values.reduce(
    (total, value) => total + value,
    0
  );
}

export function calculateTax(
  subtotal: number,
  taxRatePercent: number
): number {
  return subtotal * (taxRatePercent / 100);
}

export function calculateTotal(
  subtotal: number,
  taxAmount: number
): number {
  return subtotal + taxAmount;
}

export function calculateLaborAmount(
  laborHours: number,
  laborRate: number
): number {
  return laborHours * laborRate;
}

export function calculateMarginPercent(
  cost: number,
  sell: number
): number {
  if (sell === 0) return 0;

  return ((sell - cost) / sell) * 100;
}

export function calculateMarkupPercent(
  cost: number,
  sell: number
): number {
  if (cost === 0) return 0;

  return ((sell - cost) / cost) * 100;
}