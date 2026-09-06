Pitwall AI is an autonomous on-chain Formula 1 prediction syndicate powered by GenLayer GenVM. It ingests live Polymarket odds, telemetry micro-splits, weather radar, and FIA penalty bulletins. Using GenLayer multi-validator LLM consensus, it computes fair win probabilities, identifies alpha edges, locks collateral, and executes conditional wagers with zero mock data.

HIGHLIGHTS FOR REVIEWERS:
1. Live GenLayer Contract: 0x79c95E2ef3493fFEf92a6D0cd340dd1C5bed1Ec8 on GenLayer Studio RPC (Tx: 0x2ead1fe0d7cc249f6af41f69b04e26d7daf0951ca2fbeb0b8fb1788c11464382).
2. $10,000.00 USDC Default Institutional Bankroll: Every reviewer and tester session immediately possesses $10,000 USDC on-chain in contract storage, guaranteeing a completely frictionless testing experience with zero faucet bottlenecks.
3. 100% Autonomous Fail-Closed AI Resolution: Multi-validator AI consensus scrapes official FIA race classification bulletins via gl.nondet.web.render with zero fabricated fallbacks.
4. Real On-Chain Execution: Faucet, wagers, resolutions, and claims emit real transactions with mined receipts on GenLayer Studio.
5. Dual Settlement: Native GenLayer Syndicate Vault + EVM Gnosis CTF Vault with [ERR_UNDERFUNDED] invariant guards.
