# ParcelProof release checklist

## Completed MVP

- Public website: https://parcelproof.amzar1st96.chatgpt.site — public access verified through Sites; see publication.json.
- Buyer, Seller, Dispute, Evidence, and Finalized Result views implemented.
- Intelligent Contract deployed to GenLayer Studio; source and real GenVM schema recorded.
- 44 contract unit tests and 9 frontend checks passed, plus TypeScript and production build.
- 20 primary workflow/recovery writes, 6 separate synthetic-adjudication writes, and 3 signed frontend relay writes finalized successfully.
- Primary accounting conserved; no test escrow left locked or claimable in the recorded completion state.
- Submission description, reviewer steps, deployment links, logo, and proof links assembled in submission.md.

## Verification boundaries

- Studio GEN, consensus and transfers are simulated. This is not real-money settlement or a public-testnet/mainnet deployment.
- The positive carrier interpretation test uses explicitly synthetic, immutable evidence on a separate fixture-enabled deployment. Fixture mode is disabled on the application's primary instance.
- Existing signed relay tests verify actual helpers and HTTP routing, not browser UI clicks. Browser smoke evidence must be separately verified before claiming it passed.
- No security audit, authentic-shipment end-to-end validation, or external recipient-transfer receipt is claimed.

## Submission-specific checks

The target program/page is not known. Confirm it accepts Studio evidence and check its current required fields, network, topics, and any video requirement. No portal submission has been made. A production deployment additionally needs appropriate network support, a funded signing wallet, and further security review.
