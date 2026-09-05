Pitwall AI is an autonomous on-chain Formula 1 prediction syndicate powered by GenLayer GenVM. It ingests live Polymarket odds, telemetry micro-splits, weather radar, and FIA penalty bulletins. Using GenLayer multi-validator LLM consensus, it computes fair win probabilities, identifies alpha edges, locks collateral, and executes conditional wagers with zero mock data.

HIGHLIGHTS FOR REVIEWERS:
1. Live GenLayer Contract: 0x1BB06fA3A47dECeb8f33eb50EF050651b66F2a03 on GenLayer Studio RPC (Tx: 0x3af6ec2e47c2a1624082a8ef004b3ccb6d0a938d804264adaa84b8ef71ac4755).
2. 100% Autonomous On-Chain AI Resolution: Multi-validator AI consensus scrapes official FIA race classification bulletins via gl.nondet.web.render to determine winners without human input.
3. Real On-Chain Execution: Faucet, wagers, resolutions, and claims emit real transactions with mined receipts on GenLayer Studio.
4. Dual Settlement: Native GenLayer Syndicate Vault + EVM Gnosis CTF Vault with [ERR_UNDERFUNDED] invariant guards.
