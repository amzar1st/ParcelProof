# ParcelProof — Decentralized Delivery Dispute & Escrow Settlement

ParcelProof is a **GenLayer Project**: an Intelligent Contract plus a wallet-connected application for purchase escrow, shipping, delivery confirmation, two-sided disputes, and deadline-based refunds.

## Deployment

- Website: [ParcelProof](https://parcelproof.amzar1st96.chatgpt.site) — public; no invitation required.

- Network: **GenLayer Studio sandbox / studionet (61999)**
- Contract: [`0x3904856ea4CE6A2716A86917B566D3753064Bc68`](https://explorer-studio.genlayer.com/address/0x3904856ea4CE6A2716A86917B566D3753064Bc68)
- Deployment: [`0xb95ec192c972276af77776008a1f80448f623151e03587b60ddb13a5e0ba9532`](https://explorer-studio.genlayer.com/tx/0xb95ec192c972276af77776008a1f80448f623151e03587b60ddb13a5e0ba9532)
- Canonical source: [`contracts/parcelproof.py`](contracts/parcelproof.py)
- Source fetched from the deployed contract: [`docs/deployed-source.py`](docs/deployed-source.py), verified identical after trimming whitespace.

**Studio balances, consensus and transfers are simulated.** This is a working sandbox application, not a mainnet commerce service or proof of real carrier delivery. External transfer emission is separately distinguished from recipient receipt.

## Workflow

`create_order` → `accept_order` → `mark_shipped` → `confirm_delivery` or `open_dispute` → party evidence → `resolve_dispute` → beneficiary claim.

`DELIVERED` pays the seller. `NOT_DELIVERED` refunds the buyer. `LATE` follows immutable agreed terms. `INCONCLUSIVE` enters `EVIDENCE_REVIEW`, keeping escrow locked for at most five attempts and an absolute deadline. A disagreement in strict-equivalence consensus reverts the transaction and leaves the prior contract state intact.

All locked states have a deterministic refund path: acceptance expiry, shipping expiry, or the absolute final deadline. Either party can invoke `resolve_timeout`, and only the buyer can claim the resulting refund. An unaccepted order can also be cancelled by the buyer.

## Evidence boundaries

Only exact allowlisted UPS, FedEx, DHL and USPS hostnames are accepted; suffix lookalikes, credentials, ports, fragments and non-HTTPS URLs are rejected. Two exact URLs and optional response SHA256 commitments become immutable order terms.

Each fetched source must identify the exact tracking reference. At least one source must contain the agreed **public destination hint**, whose SHA256 is committed by the buyer and accepted by the seller. Use an already-public city/postcode or equivalent carrier-visible detail, not an unpublished full delivery address. The LLM must independently interpret the same fetched sources, cite only those URLs, and agree to the same category, delivery timestamp and citations. Positive delivery requires an explicit carrier delivery time; deterministic checks reject timestamps before shipping, after transaction time, or inconsistent with the delivery deadline.

Carrier pages requiring login, JavaScript-only private data, CAPTCHAs, or unavailable destination information may be inconclusive. The app does not claim to authenticate private carrier APIs, photos, or off-platform screenshots. Party statements are hash-bound, append-only, role-restricted public allegations; they cannot expand authoritative sources. Only four statements per party may be added before the fixed evidence window closes.

A constructor-only fixture mode can pin synthetic evidence to one repository commit for testing. It is **disabled on this deployed instance**. It is never presented as real carrier evidence.

## App

Buyer, Seller, Dispute, Evidence and Finalized Result views expose the mapped write workflow. Public reads use `LATEST_FINAL`. Browser-wallet signing and tab-local Studio test wallets are supported. Test-wallet keys stay in the tab's session storage; only simulated funds are supplied by the Studio faucet. Never use these test wallets for valuable assets.

Writes use pinned `genlayer-js` **1.1.8** and its supported `writeContract` gas-estimation path. The app waits for `FINALIZED` and verifies successful execution. A stored pending hash blocks another write until the user checks its receipt. Read errors clear the order; no seeded order fallback exists.

## Verification

[Successful GitHub verification](https://github.com/amzar1st/ParcelProof/actions/runs/34853002663): 44 contract tests, 9 frontend checks, TypeScript, production build, and 28 Chromium desktop/mobile smoke checks passed. [Permanent browser result](docs/browser-verification.json). Browser smoke checks use a local preview; signed transaction verification is recorded separately.

[Completed live verification](docs/verification.md): 20 primary workflow/recovery writes, 6 separate synthetic-evidence writes, and 3 signed frontend relay writes finalized successfully. A separate short-window test finalized with a rollback for late evidence; its protected escrow was subsequently refunded.

```bash
python -m unittest discover -s tests -v
node scripts/test-frontend.cjs
node node_modules/typescript/bin/tsc --noEmit
node scripts/run-framework.mjs build
```

44 contract unit tests and 9 frontend checks cover authorization, committed terms, hostname validation, deadline boundaries, evidence immutability, outages and hash failures, retry limits, late-delivery terms, payout/refund authorization, double claims, rollback on transfer-emission failure and amount conservation. Unit tests use a clearly identified GenLayer double, not live validator consensus.

`docs/contract-schema.json` was generated by the real Studio GenVM. `scripts/live-smoke.mjs` executes signed transactions against the deployed instance and checkpoints receipts in `docs/live-proof.json`. Its wallet secrets remain in ignored `.sites-runtime/`; they are never committed. See the proof's completion flag and transaction receipts for actual live coverage.

## Development

The app uses React, Vinext, the provided Shadcn tab/select primitives, and GenLayerJS. `lib/deployment.json` selects the deployed contract. A same-origin RPC relay forwards only a bounded allowlist of methods to the fixed Studio endpoint; it holds no wallet keys and cannot send arbitrary HTTP requests.

Use Node 22.13 or later and pnpm 11.25.0:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vinext. The contract is already deployed; the app reads the primary address in `lib/deployment.json`. Use the Studio test-wallet button for simulated buyer/seller actions.

Install the lockfile using the declared pnpm version. The deployment source repository contains the full app and contract; generated builds and secrets are excluded from Git.

## Submission materials

[Reviewer submission pack](docs/submission.md) and [release checklist](docs/release-checklist.md). The website is public. The deployed network is Studio; eligibility for a particular program must be checked against that program's requirements. No portal submission has been made.
