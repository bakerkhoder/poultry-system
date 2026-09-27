// Allocates ledger payments (from paymentsApi, excluding loan repayments)
// across invoices oldest-to-newest, on top of each invoice's own stored
// `paid`. Returns a map of invoiceId -> effective paid amount, for display
// only — it never mutates the invoices or writes anything back.
export function allocateInvoicePayments(invoices, payments) {
  let pool = payments
    .filter((p) => !p.loanId) // loan repayments never settle invoices
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const sorted = [...invoices].sort((a, b) =>
    a.date === b.date
      ? (a.createdAt || "").localeCompare(b.createdAt || "")
      : a.date.localeCompare(b.date)
  );

  const effectivePaidById = {};
  for (const inv of sorted) {
    const total = inv.total || 0;
    const stored = inv.paid || 0;
    const needed = Math.max(0, total - stored);
    const taken = Math.min(needed, pool);
    pool -= taken;
    effectivePaidById[inv.id] = stored + taken;
  }
  return effectivePaidById;
}