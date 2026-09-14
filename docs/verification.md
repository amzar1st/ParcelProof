# Completed live verification

Completed 2026-09-14T13:45:21.409Z. Studio GEN, consensus and transfers are simulated; this is not mainnet commerce settlement.

## Primary deployment

Contract: [0x3904856ea4CE6A2716A86917B566D3753064Bc68](https://explorer-studio.genlayer.com/address/0x3904856ea4CE6A2716A86917B566D3753064Bc68). Synthetic evidence is disabled on this instance.

20 signed workflow writes finalized successfully, covering seller payment, cancellation/refund, two-sided evidence, inconclusive resolution/retry, and fixed-deadline refund.

| Order | Final state | Verdict | Beneficiary |
|---|---|---|---|
| parcelproof-paid-001 | CLAIMED | DELIVERED | 0x7c7e7b4bb465a007550355d848fe4a9c075349a9 |
| parcelproof-cancel-001 | CLAIMED | CANCELLED | 0x178451009dc56ee9d5a788408b908654638dc49b |
| parcelproof-review-002 | CLAIMED | TIMEOUT_REFUND | 0x178451009dc56ee9d5a788408b908654638dc49b |
| parcelproof-review-001 | CLAIMED | TIMEOUT_REFUND | 0x178451009dc56ee9d5a788408b908654638dc49b |

Accounting: `{"claimable":"0","deposited":"4000000000000001","emitted":"4000000000000001","fixture_commit":"","locked":"0"}`. No test escrow remains locked or claimable on this primary instance.

## Separate synthetic adjudication test

Instance [0x6edcA7d140C15D5e8DAF4f6b5aEAc64a5bCF5F11](https://explorer-studio.genlayer.com/address/0x6edcA7d140C15D5e8DAF4f6b5aEAc64a5bCF5F11) pins [an immutable synthetic record](https://raw.githubusercontent.com/amzar1st/ParcelProof/a5c33883a77420bb1fdd5b836d318fc97dd9bdb4/fixtures/delivered.json). It is NOT a real shipment or authentic carrier proof. The application stays connected to the primary instance.

Order `parcelproof-synthetic-delivered-001` resolved DELIVERED through real Studio web fetching, structured LLM interpretation and validator consensus, then finalized the seller claim. 6 signed workflow writes and the deployment succeeded.

## Finalized transactions

| Scope | Action | Explorer |
|---|---|---|
| Primary | paid/create | [0xd8fd74497f…](https://explorer-studio.genlayer.com/tx/0xd8fd74497f44dd1974ba0c2fe7576c0e5e6cd88f7f47063386ffe4c330becdcd) |
| Primary | paid/accept | [0x8c0fb93891…](https://explorer-studio.genlayer.com/tx/0x8c0fb93891212ba3910790d8eab8287cd365355cf2d9034629299ee5146ffa9e) |
| Primary | paid/ship | [0xa1ebfda723…](https://explorer-studio.genlayer.com/tx/0xa1ebfda723962415a8683ba25ae41fe5f746dfb3e4b4a83820e98e5cc09a59b0) |
| Primary | paid/confirm | [0x43edba9cfa…](https://explorer-studio.genlayer.com/tx/0x43edba9cfa20c6556c30c7209e7af0b7641b239afaadcc3cefe4790f1266cc6c) |
| Primary | paid/claim | [0xfe0e8fd6ec…](https://explorer-studio.genlayer.com/tx/0xfe0e8fd6eccf45a97c6ee8526edfcfdf8d58a1f304b56e281001dd00214ef8a0) |
| Primary | cancel/create | [0x11384c21cd…](https://explorer-studio.genlayer.com/tx/0x11384c21cd4f6d43e0e59652db36d91301e15c044059428bc86a58e4472c7df1) |
| Primary | cancel/cancel | [0x508815125b…](https://explorer-studio.genlayer.com/tx/0x508815125b4606701abddeef79390984a3eedc889087dacb070a32c97f1f677b) |
| Primary | cancel/refund | [0xc6f85810a0…](https://explorer-studio.genlayer.com/tx/0xc6f85810a05fc7f7e5aa4e0b98c72710498c1791c9206f9f425990ab7cf3e797) |
| Primary | dispute/create | [0x19407d41d2…](https://explorer-studio.genlayer.com/tx/0x19407d41d206f78fba9d3cfa556131f1e4edea294a0da1d545daec8b6234196e) |
| Primary | dispute/accept | [0x8c05523410…](https://explorer-studio.genlayer.com/tx/0x8c05523410eabb83da3e14ce0135d11c5beedb82a336178490056490ca909ce4) |
| Primary | dispute/ship | [0x3ccef5d7f3…](https://explorer-studio.genlayer.com/tx/0x3ccef5d7f3be25c76c94e481c078f96447f85937fc07bf3cc57212dd884178a7) |
| Primary | dispute/open | [0xbae90e015a…](https://explorer-studio.genlayer.com/tx/0xbae90e015a883fa2e52b5e5ced5f33629f6f06d40232b8b31f5c09d57ee7cb96) |
| Primary | dispute/seller-evidence | [0x103fb3fe5c…](https://explorer-studio.genlayer.com/tx/0x103fb3fe5c6b7b55f46e2def3cefa04ae206868417a5394a69f585f6f036318f) |
| Primary | dispute/buyer-evidence | [0x3eac8a2b3a…](https://explorer-studio.genlayer.com/tx/0x3eac8a2b3a6cfcc72552f575e94aef30d101b5bf91d5f0168e293f7dcbe7f200) |
| Primary | dispute/resolve | [0x52dc5fa789…](https://explorer-studio.genlayer.com/tx/0x52dc5fa7898ff12cddf3276afb513de031268c60ccc4289e1238ceff71015ed2) |
| Primary | dispute/retry | [0x564267da9c…](https://explorer-studio.genlayer.com/tx/0x564267da9c6c85b69cad0cc7f39921c1d0748967050f27b4860a12a5f3cc36c3) |
| Primary | dispute/timeout | [0x6e7eb8f669…](https://explorer-studio.genlayer.com/tx/0x6e7eb8f6697b8bab663ba565038031ceacebafa964333cd4ea46e7c4590836e3) |
| Primary | dispute/refund | [0x7888f5b527…](https://explorer-studio.genlayer.com/tx/0x7888f5b527d16fce0c1c40f4a54a8ccb3db85a0da6c65907b7954a1cef3f6131) |
| Primary | short-window/timeout | [0x12d00941e6…](https://explorer-studio.genlayer.com/tx/0x12d00941e6ce1b5b18e5a81982a75aedce707883083f6cc3b00d85fb59fbfba5) |
| Primary | short-window/refund | [0x11c4e20a32…](https://explorer-studio.genlayer.com/tx/0x11c4e20a327bf13f43e24d692b0e6a8beb885b887ed96299919de4aea0503fff) |
| Synthetic | create | [0x9466fe9af6…](https://explorer-studio.genlayer.com/tx/0x9466fe9af68460025f038ceff3bbecc186fc881097b7e7d3aca3640049f989b3) |
| Synthetic | accept | [0xd877f55af5…](https://explorer-studio.genlayer.com/tx/0xd877f55af564210f64eab79c18bc94e5f5922447f4d0adfb3218eb90202d103f) |
| Synthetic | ship | [0x0bafdc509d…](https://explorer-studio.genlayer.com/tx/0x0bafdc509d81ced30ae9febf29b3fe66ba32c4cfb07d8da6e5e3fb41a3ed205b) |
| Synthetic | open-dispute | [0x74f5d2c192…](https://explorer-studio.genlayer.com/tx/0x74f5d2c1929edebd8a8fb559dc9ffeb5465cf94747b7301c215d31621c586320) |
| Synthetic | resolve | [0x3aae788bc2…](https://explorer-studio.genlayer.com/tx/0x3aae788bc2cfc507a05428360b993279aca14d1a67a5906f337a238eca9fb42c) |
| Synthetic | claim | [0x3b48a1ee88…](https://explorer-studio.genlayer.com/tx/0x3b48a1ee88084421517a46bc50f2fde2968bda54d6b32496ee0be30710861790) |
| Signed relay | create_order | [0xf59b501ee5…](https://explorer-studio.genlayer.com/tx/0xf59b501ee519a6920afa48c94cff1d48fc7ab993f61e37eee0a8920c1e530950) |
| Signed relay | cancel_order | [0xdcbf3219c1…](https://explorer-studio.genlayer.com/tx/0xdcbf3219c10f637c2f123f8c724782e54e4076b5f0829a89ba84e4f5386f0a06) |
| Signed relay | claim_buyer_refund | [0xea60a62a86…](https://explorer-studio.genlayer.com/tx/0xea60a62a8622a576e8991bc869481c18ce12a2a88848c8780627b4bdbf443c01) |

## Signed frontend relay check

The actual frontend helpers signed Create / Cancel / Refund via a local Node HTTP server running the application RPC route. All 3 writes finalized successfully, and a public read confirmed order `parcelproof-relay-1789393120632` was CLAIMED. Its one simulated wei is included in the primary accounting above. This verifies the wallet helpers and relay, not browser UI interaction.

## Local checks

44 contract unit tests, 9 frontend checks, TypeScript and the production build passed. The read-only Node HTTP relay test also rejects unauthorized RPC methods. Neither relay check is browser UI testing.

Raw evidence: [primary](live-proof.json), [synthetic](fixture-proof.json), [signed relay](relay-signed-proof.json), [read-only relay](relay-verification.json), [pinned runtime compatibility](runtime-compatibility.json). Interrupted and superseded deployments are historical, not current settlement proofs.

## Completed browser and CI verification

[GitHub run](https://github.com/amzar1st/ParcelProof/actions/runs/34853002663) passed on source revision `a6b9f2ec666cec424b57cdf2d9dbc8f78f400d6f`: 44 contract tests, 9 frontend checks, TypeScript, the production build, and 28 Chromium smoke checks at 1440×1000 and 390×844. The local-preview browser checks cover five tabs, actual Studio finalized reads, failed-read stale-state clearing, missing-wallet errors, test-wallet controls, source download, and horizontal overflow. See [permanent JSON proof](browser-verification.json).

Faucet responses are mocked only to exercise wallet-selector UI. No signed browser transactions or extension-wallet signing are claimed; actual signed helper/relay workflows are proved separately. Screenshots are available in the run's browser-evidence artifact (retention 30 days); the JSON proof remains in this repository. The first run clicked the SSR button before client startup; waiting for network idle fixed the test race without changing application code.
