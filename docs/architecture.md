# State and accounting

| State | Allowed transition | Escrow recovery |
|---|---|---|
| OPEN | Seller accepts the terms hash; buyer cancels | Either party resolves acceptance timeout; buyer claims |
| ACCEPTED | Seller marks the exact committed reference shipped | Either party resolves shipping timeout; buyer claims |
| SHIPPED | Buyer confirms; either party disputes | Either party resolves the absolute timeout; buyer claims |
| DISPUTED | Roles commit statements before evidence closes; adjudication after both evidence/delivery deadlines | Either party resolves absolute timeout |
| EVIDENCE_REVIEW | At most five resolution attempts; no deadline extension | Either party resolves absolute timeout |
| SETTLED | Only designated buyer/seller beneficiary claims | Claimable amount remains until claim |
| CLAIMED | Terminal; transfer has been emitted | No second claim |

Acceptance/shipping windows each range from 60 seconds to 7 days. The delivery deadline must exceed creation + acceptance + shipping and be within one year. Evidence challenge ranges from 60 seconds to 7 days; retry duration ranges from 60 seconds to 14 days.

The absolute deadline is `delivery_deadline + 2 * challenge_seconds + retry_seconds`. A dispute can open only before `delivery_deadline + challenge_seconds`, and evidence closes at opening + challenge duration. The second challenge allowance guarantees a late-opened dispute still has its full immutable evidence window and retry period. No evidence upload, retry or verdict extends the absolute deadline.

Amounts use native GEN in integer wei. At every successful transition:

`total_deposited = total_locked + total_claimable + total_emitted`

Settlement moves a whole order from locked to claimable; claim emits an external finalized transfer and moves claimable to emitted. Transfer emission errors revert. An emitted transfer is not a successful recipient receipt, and Studio does not provide real EVM settlement.

The GenLayer protocol's own appeal/finality windows are separate from the application's evidence window. The frontend waits for protocol FINALIZED before showing a successful result.
