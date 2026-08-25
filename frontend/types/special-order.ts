/**
 * Special-order parts: the one thing an appointment needs that a repair
 * order does not.
 *
 * A part the shop does not stock has to be bought in for the job, and the
 * shop is out of pocket for it from the moment it is ordered. So the
 * customer pays up front, before it is ordered — which means an
 * appointment can carry parts charges, and a live status on them, without
 * ever becoming a repair order.
 *
 * The chain separates the three things that actually go wrong and get
 * asked about on the phone: has the customer paid, have we ordered it, and
 * has it turned up.
 */
export type SpecialOrderStatus =
  /** Priced for the customer, nothing asked for yet. */
  | "Quoted"
  /** A prepayment invoice has gone out. */
  | "Awaiting Prepayment"
  /** The customer has paid. It can be ordered. */
  | "Paid"
  /** Ordered from the supplier. */
  | "Ordered"
  /** Arrived at the shop. */
  | "Received"
  /** Set aside and ready for the appointment. */
  | "Ready";

export const specialOrderStatuses: SpecialOrderStatus[] = [
  "Quoted",
  "Awaiting Prepayment",
  "Paid",
  "Ordered",
  "Received",
  "Ready",
];

/**
 * What each status means to whoever is looking at the appointment, in the
 * words they would use on the phone.
 */
export const specialOrderStatusDescriptions: Record<
  SpecialOrderStatus,
  string
> = {
  Quoted: "Priced for the customer. Nothing has been asked for yet.",
  "Awaiting Prepayment":
    "A prepayment invoice has gone out. Waiting on the customer.",
  Paid: "The customer has paid. This part can be ordered.",
  Ordered: "Ordered from the supplier. Waiting on delivery.",
  Received: "Arrived at the shop.",
  Ready: "Set aside and ready for the appointment.",
};

/** Statuses at which the customer's money has already been taken. */
export const paidSpecialOrderStatuses: SpecialOrderStatus[] = [
  "Paid",
  "Ordered",
  "Received",
  "Ready",
];

export function isPaidSpecialOrderStatus(
  status: SpecialOrderStatus | undefined
): boolean {
  return Boolean(status && paidSpecialOrderStatuses.includes(status));
}
