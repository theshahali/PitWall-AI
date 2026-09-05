Pitwall AI is an autonomous on-chain Formula 1 prediction syndicate powered by GenLayer GenVM. It ingests live Polymarket odds, telemetry micro-splits, weather radar, and FIA penalty bulletins. Using GenLayer multi-validator LLM consensus, it computes fair win probabilities, identifies alpha edges, locks collateral, and executes conditional wagers with zero mock data.

HIGHLIGHTS FOR REVIEWERS:
1. Live GenLayer Contract: 0x3f6E2Bb5cbe483F937B7bd0D325bc39b11d77656 on GenLayer Studio RPC (Tx: 0x4b293f5ec4e5bd0a45898a0678e6db337abdd418370d709ca05bff6c84fd7c12).
2. 100% Autonomous Fail-Closed AI Resolution: Multi-validator AI consensus scrapes official FIA race classification bulletins via gl.nondet.web.render with zero fabricated fallbacks.
3. Real On-Chain Execution: Faucet, wagers, resolutions, and claims emit real transactions with mined receipts on GenLayer Studio.
4. Dual Settlement: Native GenLayer Syndicate Vault + EVM Gnosis CTF Vault with [ERR_UNDERFUNDED] invariant guards.
