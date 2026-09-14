# ParcelProof — reviewer submission pack

Contribution type: **Project**. This repository contains a complete app and contract; it is not a contract-only submission.

Project name: **ParcelProof — Decentralized Delivery Dispute & Escrow Settlement**

Suggested primary topic: **Dispute Resolution**. Choose the closest actual commerce/escrow topic entries shown by the portal for secondary topics; do not enter invented topic IDs.

One-liner:

> Evidence-based purchase escrow where GenLayer validators review committed carrier sources and two-sided delivery disputes, with fixed refund deadlines.

Description:

> ParcelProof protects online purchase escrow and resolves delivery disputes through GenLayer. Buyers fund orders with immutable delivery terms and authorized carrier URLs; sellers accept the terms hash and mark the committed shipment as shipped. Buyers can confirm receipt or dispute delivery. Both parties submit role-restricted, hash-bound statements before a fixed evidence window closes. Validators independently fetch the agreed carrier sources and reach a structured verdict: DELIVERED, NOT_DELIVERED, LATE, or INCONCLUSIVE. Settlement follows the agreed late-delivery terms. Missing, mismatched, or unavailable evidence keeps escrow protected for bounded retries. Acceptance, shipping, and absolute dispute timeouts provide buyer refunds. The app supports wallet-backed actions and public finalized reads. The current deployment is a Studio sandbox with simulated GEN and transfers; it is not a mainnet commerce service.

How to verify:

1. Open the deployed app, enter `parcelproof-paid-001`, and read finalized state. Inspect the result and seller-beneficiary claim record.
2. Read `parcelproof-cancel-001` to inspect cancellation and buyer refund.
3. Read `parcelproof-review-002` to inspect two-sided evidence, inconclusive review/retry, and the absolute timeout refund.
4. To create a new order, select Studio test wallets. Copy the Seller address, supply a unique order ID, public carrier URLs, committed tracking/destination details, and a delivery deadline later than the acceptance plus shipping windows.
5. Fund escrow as Buyer. Switch to Seller, accept the terms, and mark shipped. Switch to Buyer and confirm receipt; switch to Seller and claim payment.
6. For a dispute, open it while available and commit statements using both roles. Wait for both delivery and evidence deadlines, resolve/retry, and invoke the timeout refund when its fixed deadline applies. Check pending transaction receipts before submitting another action.

Expected verification outcome:

> Finalized reads show the seller claim for parcelproof-paid-001, buyer refund for parcelproof-cancel-001, and protected evidence review followed by timeout refund for parcelproof-review-002. New test-wallet actions finalize with successful execution. Amount accounting is conserved. All GEN and transfer proofs are Studio simulations.

Evidence links:

- App (public; no invitation required): https://parcelproof.amzar1st96.chatgpt.site

- Repository: https://github.com/amzar1st/ParcelProof
- Studio contract explorer: https://explorer-studio.genlayer.com/address/0x3904856ea4CE6A2716A86917B566D3753064Bc68
- Deployment transaction: https://explorer-studio.genlayer.com/tx/0xb95ec192c972276af77776008a1f80448f623151e03587b60ddb13a5e0ba9532
- Contract source: https://github.com/amzar1st/ParcelProof/blob/main/contracts/parcelproof.py
- Tests: https://github.com/amzar1st/ParcelProof/blob/main/tests/test_parcelproof.py
- Live receipts and finalized orders: https://github.com/amzar1st/ParcelProof/blob/main/docs/live-proof.json
- Architecture/accounting: https://github.com/amzar1st/ParcelProof/blob/main/docs/architecture.md
- Frontend: https://github.com/amzar1st/ParcelProof/blob/main/app/page.tsx
- Logo: public/parcelproof-logo.png (512×512, under 2 MB)

Completed transaction evidence: https://github.com/amzar1st/ParcelProof/blob/main/docs/verification.md

Synthetic web/LLM consensus evidence (not real carrier evidence): https://github.com/amzar1st/ParcelProof/blob/main/docs/fixture-proof.json

No demo video has been recorded. Check the target program for any video requirement.

Public access is confirmed in [publication.json](publication.json). This pack describes the completed Studio sandbox MVP, not production settlement. The target submission page has not been supplied, so acceptance of Studio-network evidence, required topic choices, and video requirements are not verified. No portal submission has been made. Do not describe synthetic records as real carrier evidence.

Additional evidence: [completed verification](verification.md), [signed wallet/relay receipts](relay-signed-proof.json), [release checklist](release-checklist.md).
