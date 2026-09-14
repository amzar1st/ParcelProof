# Interrupted sandbox test run

The v2 source fixed the pinned GenVM `Response.status` API and requested structured JSON from the LLM. Its seller payment and cancellation refund completed. Both dispute orders were still DISPUTED when the local test session ended; their ephemeral signing keys did not survive the runtime reset.

These deployments remain historical and are not used as completed dispute proofs. Fresh isolated sandbox instances use the same corrected source and new test wallets for the final full run. See `recovered-proof.json` for independently retrieved finalized v2 state and `verification.md` for current completed verification.
