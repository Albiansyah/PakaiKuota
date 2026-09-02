export async function createQrisTransaction({ amount, orderId }: { amount: number; orderId: string }) {
  const apiKey = process.env.PAKASIR_API_KEY
  const slug = process.env.PAKASIR_SLUG
  if (!apiKey || !slug) {
    throw new Error("PAKASIR_API_KEY or PAKASIR_SLUG not set")
  }

  const url = `https://api.pakasir.com/transactioncreate/qris`
  const payload = {
    amount,
    order_id: orderId,
    slug,
    // optional: description, customer details, etc.
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pakasir error ${res.status}: ${err}`)
  }

  const data = await res.json()
  // Pakasir returns payment_url (QR code) and transaction id
  return { paymentUrl: data.payment_url, pakasirTxId: data.id }
}
