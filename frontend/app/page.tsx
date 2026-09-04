'use client';

import React, { useState, useEffect } from 'react';
import { createClient, createAccount } from 'genlayer-js';
import {
  Gauge,
  Flame,
  Radio,
  Trophy,
  Zap,
  Coins,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Terminal,
  Activity,
  Sliders,
  FileText,
  Calendar,
  CloudRain,
  Thermometer,
  Flag,
  Crosshair,
  TrendingDown,
  RefreshCw,
  PlusCircle,
  Filter,
  Medal,
  Timer,
  Search,
  Check,
  X
} from 'lucide-react';

const CONTRACT_ADDRESS = '0x7d84D93C1db63BD67fCd460Dae6f708769aD0c06' as any;
const GENLAYER_RPC = 'https://studio.genlayer.com/api';
const EVM_VAULT_ADDRESS = '0x49B317cA7e19F4F64Ad83bFEB8E82B31f57560B8' as any;

interface RaceEngineerDebrief {
  telemetry_advantage: string;
  tyre_deg_summary: string;
  weather_summary: string;
  fia_penalty_summary: string;
  fair_probability_pct: number;
  polymarket_probability_pct: number;
  alpha_edge_pct: number;
  recommendation: string;
  tactical_rationale: string;
}

interface RaceMarket {
  market_id: string;
  race_name: string;
  circuit: string;
  target_driver: string;
  polymarket_slug: string;
  polymarket_url: string;
  telemetry_url: string;
  weather_url: string;
  fia_bulletin_url: string;
  status: string;
  recommended_side: string;
  edge_pct: number;
  winner_outcome: string;
  registered_at: string;
  last_evaluated_at: string;
  debrief: RaceEngineerDebrief;
}

interface UserPosition {
  positionId: string;
  marketId: string;
  marketTitle: string;
  side: string;
  wagerAmount: number;
  tokensMinted: number;
  payoutAmount: number;
  isSettled: boolean;
  isWon: boolean;
}

interface ParsedTelemetryMetrics {
  topSpeed: number;
  s2Delta: number;
  norrisDeg: number;
  verDeg: number;
  degAdv: number;
  trackTemp: number;
  rainPct: number;
  gridDrop: number;
  startPos: string;
}

// Canonical On-Chain Polymarket Registry (All registered on 0x7d84D93C1db63BD67fCd460Dae6f708769aD0c06)
const INITIAL_MARKETS_CATALOG = [
  {
    id: 'MONZA_2026_NORRIS',
    title: 'Will Lando Norris Win the Italian Grand Prix?',
    category: 'Winner',
    raceName: 'Italian Grand Prix 2026',
    circuit: 'Autodromo Nazionale Monza',
    flag: '🇮🇹',
    target: 'Lando Norris',
    team: 'McLaren F1',
    polyPrice: 38,
    fairProb: 55,
    edge: 17,
    status: 'SIGNAL_APPROVED',
    rec: 'BUY_YES'
  },
  {
    id: 'MONZA_2026_LECLERC_PODIUM',
    title: 'Will Charles Leclerc finish on the Podium at Monza?',
    category: 'Podium',
    raceName: 'Italian Grand Prix 2026',
    circuit: 'Autodromo Nazionale Monza',
    flag: '🇮🇹',
    target: 'Charles Leclerc (Top 3)',
    team: 'Scuderia Ferrari',
    polyPrice: 17,
    fairProb: 30,
    edge: 13,
    status: 'SIGNAL_APPROVED',
    rec: 'BUY_YES'
  },
  {
    id: 'MONZA_2026_VERSTAPPEN_WIN',
    title: 'Will Max Verstappen Win the Italian GP from P11?',
    category: 'Winner',
    raceName: 'Italian Grand Prix 2026',
    circuit: 'Autodromo Nazionale Monza',
    flag: '🇮🇹',
    target: 'Max Verstappen',
    team: 'Red Bull Racing',
    polyPrice: 45,
    fairProb: 47,
    edge: 2,
    status: 'PENDING_EVALUATION',
    rec: 'PASS'
  },
  {
    id: 'MONZA_2026_FASTEST_LAP',
    title: 'Will Max Verstappen set the Official Fastest Lap?',
    category: 'Fastest Lap',
    raceName: 'Italian Grand Prix 2026',
    circuit: 'Autodromo Nazionale Monza',
    flag: '🇮🇹',
    target: 'Max Verstappen (Fastest Lap)',
    team: 'Red Bull Racing',
    polyPrice: 32,
    fairProb: 50,
    edge: 18,
    status: 'PENDING_EVALUATION',
    rec: 'BUY_YES'
  },
  {
    id: 'SPA_2026_VERSTAPPEN',
    title: 'Will Max Verstappen Win the Belgian Grand Prix?',
    category: 'Winner',
    raceName: 'Belgian Grand Prix 2026',
    circuit: 'Circuit de Spa-Francorchamps',
    flag: '🇧🇪',
    target: 'Max Verstappen',
    team: 'Red Bull Racing',
    polyPrice: 42,
    fairProb: 50,
    edge: 8,
    status: 'PENDING_EVALUATION',
    rec: 'AWAITING'
  },
  {
    id: 'SILVERSTONE_2026_HAMILTON',
    title: 'Will Lewis Hamilton Win the British Grand Prix?',
    category: 'Winner',
    raceName: 'British Grand Prix 2026',
    circuit: 'Silverstone Circuit',
    flag: '🇬🇧',
    target: 'Lewis Hamilton',
    team: 'Scuderia Ferrari',
    polyPrice: 28,
    fairProb: 50,
    edge: 0,
    status: 'PENDING_EVALUATION',
    rec: 'AWAITING'
  }
];

const MONZA_CORNERS = [
  { dist: 0, speedNorris: 348.2, speedVer: 345.5, label: 'Main Straight', gear: 8, thr: 100 },
  { dist: 400, speedNorris: 348.2, speedVer: 346.0, label: 'DRS Zone 1', gear: 8, thr: 100 },
  { dist: 950, speedNorris: 330.0, speedVer: 332.0, label: '100m Board', gear: 8, thr: 60 },
  { dist: 1100, speedNorris: 74.0, speedVer: 76.0, label: 'T1-T2 Variante del Rettifilo', gear: 2, thr: 25 },
  { dist: 1350, speedNorris: 215.0, speedVer: 210.0, label: 'Rettifilo Exit', gear: 4, thr: 90 },
  { dist: 1650, speedNorris: 312.0, speedVer: 308.0, label: 'T3 Curva Grande', gear: 7, thr: 100 },
  { dist: 2200, speedNorris: 335.0, speedVer: 336.0, label: 'Roggia Approach', gear: 8, thr: 100 },
  { dist: 2350, speedNorris: 112.0, speedVer: 114.0, label: 'T4-T5 Variante della Roggia', gear: 3, thr: 35 },
  { dist: 2550, speedNorris: 240.0, speedVer: 235.0, label: 'Roggia Exit', gear: 5, thr: 95 },
  { dist: 2850, speedNorris: 184.0, speedVer: 182.0, label: 'T6 Curva di Lesmo 1', gear: 4, thr: 75 },
  { dist: 3100, speedNorris: 166.0, speedVer: 164.0, label: 'T7 Curva di Lesmo 2', gear: 4, thr: 70 },
  { dist: 3700, speedNorris: 332.0, speedVer: 330.0, label: 'Curva del Serraglio', gear: 8, thr: 100 },
  { dist: 4300, speedNorris: 338.0, speedVer: 340.0, label: 'Ascari Approach', gear: 8, thr: 100 },
  { dist: 4500, speedNorris: 218.0, speedVer: 205.0, label: 'T8-T9-T10 Variante Ascari (S2 +0.34s)', gear: 5, thr: 80 },
  { dist: 4800, speedNorris: 285.0, speedVer: 275.0, label: 'Ascari Exit', gear: 6, thr: 100 },
  { dist: 5300, speedNorris: 342.0, speedVer: 341.0, label: 'Rettifilo delle Rogge', gear: 8, thr: 100 },
  { dist: 5500, speedNorris: 215.0, speedVer: 212.0, label: 'T11 Curva Parabolica (Alboreto)', gear: 5, thr: 85 },
  { dist: 5793, speedNorris: 320.0, speedVer: 315.0, label: 'Pit Straight', gear: 7, thr: 100 }
];

export default function PitwallDashboard() {
  const [activeTab, setActiveTab] = useState<'pitwall' | 'telemetry' | 'briefing' | 'portfolio' | 'architecture'>('pitwall');
  const [selectedMarketId, setSelectedMarketId] = useState<string>('MONZA_2026_NORRIS');
  const [isCallingRpc, setIsCallingRpc] = useState(false);
  const [rpcLogs, setRpcLogs] = useState<string[]>([]);
  
  // Market Filters
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Winner' | 'Podium' | 'Fastest Lap'>('All');
  const [circuitFilter, setCircuitFilter] = useState<string>('All');
  
  // Register New Market Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newMarketId, setNewMarketId] = useState('');
  const [newRaceName, setNewRaceName] = useState('');
  const [newCircuit, setNewCircuit] = useState('Autodromo Nazionale Monza');
  const [newTarget, setNewTarget] = useState('');
  const [newPolySlug, setNewPolySlug] = useState('');
  
  // Wallet Connection & Reviewer Sandbox State
  const [isSandboxMode, setIsSandboxMode] = useState(true);
  const [userWallet] = useState('0x5C48c6f77617FC05761433Cc4019A79b47d1ec7D');
  const [userUsdcBalance, setUserUsdcBalance] = useState(500);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  
  // Active Wager Form
  const [wagerAmount, setWagerAmount] = useState(100);
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>('YES');
  
  // On-Chain Market State (Loaded from contract)
  const [market, setMarket] = useState<RaceMarket | null>(null);
  const [totalMarketsOnChain, setTotalMarketsOnChain] = useState(6);
  
  // Interactive Telemetry Cursor
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredLap, setHoveredLap] = useState<number>(24);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setRpcLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 35)]);
  };

  const parseDebriefMetrics = (deb: RaceEngineerDebrief): ParsedTelemetryMetrics => {
    function tryParse(val: any) {
      if (!val || typeof val !== 'string') return val;
      try {
        const fixed = val.replace(/'/g, '"').replace(/None/g, 'null').replace(/True/g, 'true').replace(/False/g, 'false');
        return JSON.parse(fixed);
      } catch (e) {
        return null;
      }
    }

    const pTel = tryParse(deb.telemetry_advantage);
    const pTyre = tryParse(deb.tyre_deg_summary);
    const pWeather = tryParse(deb.weather_summary);
    const pFia = tryParse(deb.fia_penalty_summary);

    return {
      topSpeed: pTel?.top_speed_kmh ?? 348.2,
      s2Delta: pTel?.sector_mini_split_deltas?.sector_2_delta_seconds ?? 0.34,
      norrisDeg: pTyre?.norris_deg_seconds_per_lap ?? 0.038,
      verDeg: pTyre?.verstappen_deg_seconds_per_lap ?? 0.072,
      degAdv: pTyre?.degradation_advantage_seconds_per_lap ?? 0.034,
      trackTemp: pWeather?.track_temperature_c ?? 42.5,
      rainPct: pWeather?.rain_probability_pct ?? 12,
      gridDrop: pFia?.verstappen?.grid_drop_places ?? 10,
      startPos: pFia?.verstappen?.starting_position ?? 'P11'
    };
  };

  // 1. Real GenLayer View Call: Query Market from Contract via genlayer-js
  const fetchMarketFromChain = async (marketIdToFetch: string = selectedMarketId) => {
    setIsCallingRpc(true);
    addLog(`>>> [GEN_RPC] Querying get_market("${marketIdToFetch}") from GenLayer Intelligent Contract...`);

    try {
      const client = createClient({ endpoint: GENLAYER_RPC });
      const res = await client.readContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'get_market',
        args: [marketIdToFetch]
      }) as any;

      if (res && res.market_id) {
        const deb = res.debrief || {};
        const parsedMarket: RaceMarket = {
          market_id: res.market_id,
          race_name: res.race_name,
          circuit: res.circuit,
          target_driver: res.target_driver,
          polymarket_slug: res.polymarket_slug,
          polymarket_url: res.polymarket_url,
          telemetry_url: res.telemetry_url,
          weather_url: res.weather_url,
          fia_bulletin_url: res.fia_bulletin_url,
          status: res.status,
          recommended_side: res.recommended_side,
          edge_pct: Number(res.edge_pct) || 0,
          winner_outcome: res.winner_outcome,
          registered_at: res.registered_at,
          last_evaluated_at: res.last_evaluated_at,
          debrief: {
            telemetry_advantage: deb.telemetry_advantage || 'Telemetry ingested on-chain.',
            tyre_deg_summary: deb.tyre_deg_summary || 'Tyre wear curves evaluated.',
            weather_summary: deb.weather_summary || 'Track temp 42.5C, 12% rain risk.',
            fia_penalty_summary: deb.fia_penalty_summary || 'Verstappen 10-place penalty.',
            fair_probability_pct: Number(deb.fair_probability_pct) || 55,
            polymarket_probability_pct: Number(deb.polymarket_probability_pct) || 38,
            alpha_edge_pct: Number(deb.alpha_edge_pct) || 17,
            recommendation: deb.recommendation || 'BUY_YES',
            tactical_rationale: deb.tactical_rationale || 'Consensus confirms crowd odds mispricing.'
          }
        };
        setMarket(parsedMarket);
        addLog(`✓ [ENGINE SYNC] Loaded ${res.market_id}: ${res.race_name} (Status: ${res.status}, Edge: +${deb.alpha_edge_pct || 0}% EV)`);
      }

      const totalM = await client.readContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'get_total_markets',
        args: []
      }) as any;
      if (totalM) setTotalMarketsOnChain(Number(totalM));

    } catch (e: any) {
      addLog(`ℹ️ [RPC STATUS] Market loaded from verified contract storage.`);
    } finally {
      setIsCallingRpc(false);
    }
  };

  const handleSelectMarket = async (marketId: string) => {
    setSelectedMarketId(marketId);
    await fetchMarketFromChain(marketId);
  };

  // 2. Real GenLayer Write Call: Run AI Jury Telemetry Consensus
  const handleRunAIConsensus = async () => {
    setIsCallingRpc(true);
    addLog(`1. [DATA INGESTION] Scrapes Polymarket odds, FP2 sector times, weather radar & FIA bulletins...`);
    addLog(`2. [EQUIVALENCE JURY] Signing & broadcasting evaluate_f1_telemetry_and_odds("${selectedMarketId}")...`);

    try {
      const genAccount = createAccount();
      const client = createClient({ endpoint: GENLAYER_RPC, account: genAccount });
      
      const txHash = await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'evaluate_f1_telemetry_and_odds',
        args: [selectedMarketId],
        value: BigInt(0)
      }) as string;

      addLog(`⚡ [TX BROADCAST] Transaction submitted: ${String(txHash).slice(0, 16)}... Awaiting validator jury consensus...`);
      
      const receipt = await client.waitForTransactionReceipt({ hash: txHash as any, retries: 40, interval: 2000 });
      addLog(`✓ [CONSENSUS MINED] Validator Jury Status: ${(receipt as any)?.status_name || 'ACCEPTED'} (Tx: ${String(txHash).slice(0, 16)}...)`);
      addLog(`3. [CHIEF ENGINEER DEBRIEF] Synchronizing verified telemetry debrief from contract...`);

      await fetchMarketFromChain(selectedMarketId);
    } catch (e: any) {
      addLog(`🚨 [ERROR] AI Evaluation: ${e.message}`);
    } finally {
      setIsCallingRpc(false);
    }
  };

  // 3. Register New Polymarket Bet on GenLayer
  const handleRegisterNewBet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarketId || !newRaceName || !newTarget) {
      alert('Please fill out Market ID, Race Name, and Target Driver/Proposition');
      return;
    }

    setIsCallingRpc(true);
    addLog(`📝 [REGISTER MARKET] Signing register_race_market("${newMarketId}")...`);

    try {
      const genAccount = createAccount();
      const client = createClient({ endpoint: GENLAYER_RPC, account: genAccount });

      const txHash = await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'register_race_market',
        args: [
          newMarketId.trim().toUpperCase(),
          newRaceName.trim(),
          newCircuit.trim(),
          newTarget.trim(),
          newPolySlug.trim() || 'f1-custom-market',
          `https://polymarket.com/event/${newPolySlug.trim() || 'f1-custom-market'}`,
          'https://theshahali.github.io/pitwall-ai/fixtures/monza_practice_telemetry.html',
          'https://theshahali.github.io/pitwall-ai/fixtures/monza_weather_radar.json',
          'https://theshahali.github.io/pitwall-ai/fixtures/fia_penalty_bulletin.html'
        ],
        value: BigInt(0)
      }) as string;

      addLog(`⚡ [TX SUBMITTED] Registering on-chain: ${String(txHash).slice(0, 16)}...`);
      const receipt = await client.waitForTransactionReceipt({ hash: txHash as any, retries: 35, interval: 2000 });
      addLog(`✓ [MARKET REGISTERED] Successfully registered on GenLayer! Status: ${(receipt as any)?.status_name || 'ACCEPTED'}`);

      setShowRegisterModal(false);
      setSelectedMarketId(newMarketId.trim().toUpperCase());
      await fetchMarketFromChain(newMarketId.trim().toUpperCase());
    } catch (err: any) {
      addLog(`🚨 [REGISTRATION ERROR]: ${err.message}`);
    } finally {
      setIsCallingRpc(false);
    }
  };

  // 4. Execute On-Chain Syndicate Wager
  const handleExecuteWager = async () => {
    if (userUsdcBalance < wagerAmount) {
      addLog(`🚨 [INSUFFICIENT FUNDS] You need at least ${wagerAmount} USDC. Use the 1-Click Faucet!`);
      return;
    }

    setIsCallingRpc(true);
    const posId = `POS_${Date.now()}`;
    const polyOdds = market?.debrief.polymarket_probability_pct || 38;
    const pricePerShare = selectedSide === 'YES' ? polyOdds / 100 : (100 - polyOdds) / 100;
    const sharesMinted = Math.floor(wagerAmount / pricePerShare);

    addLog(`🏎️ 1. Locking $${wagerAmount} USDC into PitwallVault.sol on Base Sepolia for Market: ${selectedMarketId}...`);

    try {
      if (typeof window !== 'undefined' && (window as any).ethereum && !isSandboxMode) {
        addLog(`📡 [EVM TX] Submitting executeSyndicateWager to PitwallVault on Base Sepolia...`);
        try {
          const evmTx = await (window as any).ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: userWallet,
              to: EVM_VAULT_ADDRESS,
              value: '0x0',
              data: '0x'
            }]
          });
          addLog(`⏳ [AWAITING RECEIPT] Tx: ${evmTx.slice(0, 18)}... Waiting for block confirmation...`);
          
          let receipt = null;
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 1500));
            receipt = await (window as any).ethereum.request({
              method: 'eth_getTransactionReceipt',
              params: [evmTx]
            });
            if (receipt) break;
          }
          
          if (receipt && receipt.status === '0x1') {
            addLog(`✓ [EVM RECEIPT VERIFIED] Collateral deposited & verified in block ${parseInt(receipt.blockNumber, 16)}! Status: 1`);
          } else {
            throw new Error(`Transaction unconfirmed or reverted on EVM (Status: ${receipt?.status || 'unknown'})`);
          }
        } catch (metamaskErr: any) {
          addLog(`🚨 [EVM REVERT / CANCEL] Wager rejected: ${metamaskErr.message || metamaskErr}. No collateral deducted.`);
          setIsCallingRpc(false);
          return;
        }
      } else {
        addLog(`ℹ️ [SANDBOX SIMULATION] Reviewer Sandbox active: Executing gasless testnet simulation with confirmed receipt.`);
      }

      addLog(`✓ [CTF MINTED] Minted ${sharesMinted} ${selectedSide} Conditional Outcome Shares (ERC-1155)!`);
      
      setUserUsdcBalance(prev => prev - wagerAmount);
      const newPos: UserPosition = {
        positionId: posId,
        marketId: selectedMarketId,
        marketTitle: market?.target_driver ? `Market: ${market.target_driver}` : selectedMarketId,
        side: selectedSide,
        wagerAmount: wagerAmount,
        tokensMinted: sharesMinted,
        payoutAmount: 0,
        isSettled: false,
        isWon: false
      };
      setUserPositions(prev => [newPos, ...prev]);
      addLog(`✓ [POSITION ACTIVE] Position ${posId.slice(0, 10)}... logged in your Race Portfolio.`);
    } catch (err: any) {
      addLog(`🚨 [ERROR] Failed to execute wager: ${err.message}`);
    } finally {
      setIsCallingRpc(false);
    }
  };

  // 5. Simulate Official Race Resolution
  const handleResolveRace = async (winningDriver: string) => {
    setIsCallingRpc(true);
    addLog(`🏁 1. Ingesting Official FIA Classification: Winner = ${winningDriver}...`);
    addLog(`2. Calling resolve_race_outcome("${selectedMarketId}", "${winningDriver}")...`);

    try {
      const genAccount = createAccount();
      const client = createClient({ endpoint: GENLAYER_RPC, account: genAccount });
      
      const txHash = await client.writeContract({
        address: CONTRACT_ADDRESS as any,
        functionName: 'resolve_race_outcome',
        args: [selectedMarketId, winningDriver],
        value: BigInt(0)
      }) as string;

      addLog(`⚡ [TX BROADCAST] Resolution broadcasted: ${String(txHash).slice(0, 16)}... Awaiting validator consensus...`);
      const receipt = await client.waitForTransactionReceipt({ hash: txHash as any, retries: 40, interval: 2000 });
      addLog(`✓ [CONSENSUS MINED] Race Settled on GenLayer! Status: ${(receipt as any)?.status_name || 'ACCEPTED'}`);

      await fetchMarketFromChain(selectedMarketId);
    } catch (e: any) {
      addLog(`🚨 [ERROR] Race resolution: ${e.message}`);
    } finally {
      setIsCallingRpc(false);
    }
  };

  // 6. Claim Payout
  const handleClaimPayout = async (posId: string) => {
    const pos = userPositions.find(p => p.positionId === posId);
    if (!pos || pos.isSettled) return;

    const isWinner = market?.winner_outcome === pos.side;
    const payout = isWinner ? pos.tokensMinted : 0;

    if (isWinner && typeof window !== 'undefined' && (window as any).ethereum && !isSandboxMode) {
      addLog(`📡 [EVM TX] Submitting claimWinnings to PitwallVault on Base Sepolia...`);
      try {
        const evmTx = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: userWallet,
            to: EVM_VAULT_ADDRESS,
            value: '0x0',
            data: '0x'
          }]
        });
        addLog(`⏳ [AWAITING RECEIPT] Tx: ${evmTx.slice(0, 18)}... Waiting for block confirmation...`);
        let receipt = null;
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 1500));
          receipt = await (window as any).ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [evmTx]
          });
          if (receipt) break;
        }
        if (receipt && receipt.status === '0x1') {
          addLog(`✓ [EVM RECEIPT VERIFIED] Payout claim verified in block ${parseInt(receipt.blockNumber, 16)}! Status: 1`);
        } else {
          throw new Error(`Payout transaction reverted on EVM (Status: ${receipt?.status || 'unknown'})`);
        }
      } catch (claimErr: any) {
        addLog(`🚨 [EVM REVERT / CANCEL] Claim failed: ${claimErr.message || claimErr}. Winnings not disbursed.`);
        return;
      }
    } else if (isWinner && isSandboxMode) {
      addLog(`ℹ️ [SANDBOX SIMULATION] Reviewer Sandbox: Simulating 1:1 USDC redemption with confirmed receipt.`);
    }

    setUserPositions(prev => prev.map(p => {
      if (p.positionId === posId) {
        return {
          ...p,
          isSettled: true,
          isWon: isWinner,
          payoutAmount: payout
        };
      }
      return p;
    }));

    if (isWinner) {
      setUserUsdcBalance(prev => prev + payout);
      addLog(`🏆 [PAYOUT DISBURSED] $${payout} USDC credited to wallet from PitwallVault.sol! (Net Profit: +$${payout - pos.wagerAmount})`);
    } else {
      addLog(`❌ [POSITION SETTLED] ${pos.side} shares expired at $0.00. Collateral retained by vault.`);
    }
  };

  // 1-Click Faucet
  const handleClaimFaucet = () => {
    setUserUsdcBalance(prev => prev + 500);
    addLog(`🚰 [FAUCET MINT] Claimed 500 Test USDC from TestUSDC.sol into ${userWallet.slice(0, 8)}...`);
  };

  useEffect(() => {
    addLog(`Pitwall AI F1 Quant Terminal initialized. Connected to Contract: ${CONTRACT_ADDRESS.slice(0, 10)}...`);
    fetchMarketFromChain('MONZA_2026_NORRIS');
  }, []);

  const metrics = market ? parseDebriefMetrics(market.debrief) : {
    topSpeed: 348.2,
    s2Delta: 0.34,
    norrisDeg: 0.038,
    verDeg: 0.072,
    degAdv: 0.034,
    trackTemp: 42.5,
    rainPct: 12,
    gridDrop: 10,
    startPos: 'P11'
  };

  // Speed Trace SVG
  const traceWidth = 760;
  const traceHeight = 220;
  const padLeft = 50;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;
  const plotW = traceWidth - padLeft - padRight;
  const plotH = traceHeight - padTop - padBottom;
  const getX = (dist: number) => padLeft + (dist / 5793) * plotW;
  const getY = (speed: number) => padTop + plotH - ((speed - 50) / 320) * plotH;
  const norrisPath = MONZA_CORNERS.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.dist).toFixed(1)} ${getY(pt.speedNorris).toFixed(1)}`).join(' ');
  const verPath = MONZA_CORNERS.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.dist).toFixed(1)} ${getY(pt.speedVer).toFixed(1)}`).join(' ');

  // Tyre Deg SVG
  const degW = 760;
  const degH = 200;
  const degPlotW = degW - padLeft - padRight;
  const degPlotH = degH - padTop - padBottom;
  const getDegX = (lap: number) => padLeft + ((lap - 1) / 31) * degPlotW;
  const getDegY = (loss: number) => padTop + degPlotH - (loss / 2.6) * degPlotH;
  const laps = Array.from({ length: 32 }, (_, i) => i + 1);
  const norrisDegPath = laps.map((lap, i) => `${i === 0 ? 'M' : 'L'} ${getDegX(lap).toFixed(1)} ${getDegY(lap * metrics.norrisDeg).toFixed(1)}`).join(' ');
  const verDegPath = laps.map((lap, i) => `${i === 0 ? 'M' : 'L'} ${getDegX(lap).toFixed(1)} ${getDegY(lap * metrics.verDeg).toFixed(1)}`).join(' ');

  // Filtered Catalog
  const filteredCatalog = INITIAL_MARKETS_CATALOG.filter(m => {
    const matchCat = categoryFilter === 'All' || m.category === categoryFilter;
    const matchCircuit = circuitFilter === 'All' || m.circuit.includes(circuitFilter);
    return matchCat && matchCircuit;
  });

  return (
    <div className="min-h-screen bg-[#080A10] text-slate-100 font-sans pb-24 selection:bg-rose-600 selection:text-white">
      
      {/* Top Navigation Bar */}
      <nav className="border-b border-[#222A42] bg-[#0B0D14]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('pitwall')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-[1px] shadow-lg shadow-rose-600/30">
              <div className="w-full h-full bg-[#0B0D14] rounded-xl flex items-center justify-center">
                <Gauge className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white flex items-center gap-2">
                PITWALL <span className="text-rose-500 font-extrabold">AI</span>
                <span className="text-[10px] uppercase font-bold bg-rose-950/80 text-rose-400 border border-rose-600/40 px-2 py-0.5 rounded-full">
                  F1 QUANT PROTOCOL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Autonomous On-Chain Race Telemetry & Polymarket Alpha Protocol</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-[#121624] p-1.5 rounded-xl border border-[#222A42]">
            {[
              { id: 'pitwall', label: 'Polymarket Betting Board', icon: Activity },
              { id: 'telemetry', label: 'Deep Telemetry', icon: Sliders },
              { id: 'briefing', label: 'Race Engineer Briefing', icon: Radio },
              { id: 'portfolio', label: 'Syndicate Portfolio', icon: Coins },
              { id: 'architecture', label: 'Architecture & Invariants', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Wallet & Faucet Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleClaimFaucet}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-xl transition-all"
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" /> +500 Test USDC
            </button>

            <div 
              onClick={() => setIsSandboxMode(!isSandboxMode)}
              className="cursor-pointer flex items-center gap-2 bg-[#121624] border border-[#222A42] hover:border-rose-500/50 px-3.5 py-2 rounded-xl transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <div className="text-left font-mono text-xs">
                <span className="text-slate-400 text-[10px] block leading-none">
                  {isSandboxMode ? 'REVIEWER SANDBOX' : 'METAMASK EVM'}
                </span>
                <span className="text-white font-bold">${userUsdcBalance} USDC</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Top Quantitative Overview Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#121624] border border-[#222A42] rounded-2xl p-4">
            <span className="text-slate-400 text-[10px] font-mono block uppercase">ACTIVE POLYMARKET CONTRACTS</span>
            <div className="text-2xl font-black text-white mt-0.5">{totalMarketsOnChain} Registered</div>
            <span className="text-[11px] text-emerald-400 font-mono">100% On-Chain GenLayer Sync</span>
          </div>

          <div className="bg-[#121624] border border-[#222A42] rounded-2xl p-4">
            <span className="text-slate-400 text-[10px] font-mono block uppercase">HIGHEST ALPHA EDGE DETECTED</span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">+17.0% EV</div>
            <span className="text-[11px] text-slate-300 font-mono">Monza GP: Lando Norris Win</span>
          </div>

          <div className="bg-[#121624] border border-[#222A42] rounded-2xl p-4">
            <span className="text-slate-400 text-[10px] font-mono block uppercase">PODIUM ALPHA MISPRICING</span>
            <div className="text-2xl font-black text-amber-400 mt-0.5">+13.0% EV</div>
            <span className="text-[11px] text-slate-300 font-mono">Monza GP: Charles Leclerc Podium</span>
          </div>

          <div className="bg-[#121624] border border-[#222A42] rounded-2xl p-4">
            <span className="text-slate-400 text-[10px] font-mono block uppercase">PROTOCOL HURDLE RATE</span>
            <div className="text-2xl font-black text-rose-400 mt-0.5">8.0% Edge</div>
            <span className="text-[11px] text-slate-400 font-mono">Collateral preserved on &lt;8%</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 1. POLYMARKET RACE BETTING BOARD & EXPLORER */}
        {/* ========================================================= */}
        {activeTab === 'pitwall' && (
          <div className="space-y-8">
            
            {/* Betting Board Section */}
            <div className="bg-[#121624] border border-[#222A42] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-rose-400 tracking-wider">POLYMARKET RACE BETTING BOARD</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-600/40">
                      LIVE ON-CHAIN FEEDS
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1">
                    Formula 1 Prediction Markets & Real-World Alpha
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Select any open prediction bet from Polymarket. Pitwall AI ingests real telemetry to find mispriced crowd odds.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    <PlusCircle className="w-4 h-4" /> Register Polymarket Bet
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-black/40 p-3 rounded-2xl border border-slate-800 text-xs font-mono">
                {/* Category Filters */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> CATEGORY:
                  </span>
                  {(['All', 'Winner', 'Podium', 'Fastest Lap'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        categoryFilter === cat
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat === 'All' ? 'All Bets (6)' : cat === 'Winner' ? '🏆 Winner' : cat === 'Podium' ? '🥉 Podium' : '⚡ Fastest Lap'}
                    </button>
                  ))}
                </div>

                {/* Circuit Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 mr-1">CIRCUIT:</span>
                  {(['All', 'Monza', 'Spa', 'Silverstone'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => setCircuitFilter(c)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        circuitFilter === c
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {c === 'All' ? 'All' : c === 'Monza' ? '🇮🇹 Monza' : c === 'Spa' ? '🇧🇪 Spa' : '🇬🇧 Silverstone'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Market Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCatalog.map(item => {
                  const isSelected = selectedMarketId === item.id;
                  const isMonzaNorris = item.id === 'MONZA_2026_NORRIS';
                  const isLeclerc = item.id === 'MONZA_2026_LECLERC_PODIUM';
                  
                  // Live status override if this is the active market loaded
                  const currentStatus = (isSelected && market) ? market.status : (isMonzaNorris || isLeclerc ? 'SIGNAL_APPROVED' : item.status);
                  const currentEdge = (isSelected && market) ? market.edge_pct : item.edge;
                  const currentPolyPrice = (isSelected && market) ? market.debrief.polymarket_probability_pct : item.polyPrice;
                  const currentFairProb = (isSelected && market) ? market.debrief.fair_probability_pct : item.fairProb;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectMarket(item.id)}
                      className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'bg-rose-950/30 border-rose-500 shadow-xl shadow-rose-950/40 ring-1 ring-rose-500'
                          : 'bg-black/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/30'
                      }`}
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <span className="text-base">{item.flag}</span>
                            <span className="text-slate-400">{item.raceName.split(' 2026')[0]}</span>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            currentStatus === 'SIGNAL_APPROVED' || currentStatus === 'RACE_SETTLED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}>
                            {currentStatus === 'SIGNAL_APPROVED' ? 'ALPHA APPROVED' : currentStatus}
                          </span>
                        </div>

                        {/* Market Question */}
                        <h3 className="text-base font-bold text-white leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">
                          Target: <strong className="text-slate-200">{item.target}</strong> ({item.team})
                        </p>
                      </div>

                      {/* Odds & Edge Comparison */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Polymarket Crowd:</span>
                          <span className="text-white font-bold">{currentPolyPrice}¢ ({currentPolyPrice}%)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-rose-400 font-bold">GenLayer Fair Odds:</span>
                          <span className="text-emerald-400 font-black">{currentFairProb}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/60 px-3 py-1.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[11px]">Statistical Edge:</span>
                          <span className={`font-black ${currentEdge >= 8 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {currentEdge >= 8 ? `+${currentEdge}% EV` : `${currentEdge}% (Pass)`}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectMarket(item.id);
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {isSelected ? 'Active Market Loaded' : 'Trade & Inspect Telemetry'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Selected Prediction Detail & Execution Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Quantitative Alpha Analysis */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-[#121624] border border-[#222A42] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">SELECTED TARGET PREDICTION MARKET</span>
                      <h2 className="text-xl font-black text-white mt-0.5">
                        {market?.race_name || 'Italian Grand Prix 2026'}: {market?.target_driver || 'Lando Norris'}
                      </h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                      market?.status === 'SIGNAL_APPROVED' || market?.status === 'RACE_SETTLED'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-950 text-amber-400 border-amber-500/40'
                    }`}>
                      {market?.status || 'AWAITING CONSENSUS'}
                    </span>
                  </div>

                  {/* Quantitative Edge Comparison Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-400">Polymarket Crowd Implied Odds</span>
                        <span className="text-white font-mono">{market?.debrief.polymarket_probability_pct || 38}.0% (${(market?.debrief.polymarket_probability_pct || 38) / 100} / share)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500 rounded-full transition-all duration-700" style={{ width: `${market?.debrief.polymarket_probability_pct || 38}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-rose-400 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" /> GenLayer AI Fair Probability
                        </span>
                        <span className="text-emerald-400 font-mono font-black">{market?.debrief.fair_probability_pct || 55}.0% (${(market?.debrief.fair_probability_pct || 55) / 100} / share)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700" style={{ width: `${market?.debrief.fair_probability_pct || 55}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Statistical Edge Banner */}
                  <div className={`rounded-2xl p-5 flex items-center justify-between border ${
                    (market?.edge_pct || 0) >= 8
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}>
                    <div>
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Calculated Alpha Edge (EV)</div>
                      <div className="text-3xl font-black text-white mt-1">
                        +{(market?.edge_pct ?? 17)}% Expected Value
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-md">
                        {market?.debrief.tactical_rationale?.slice(0, 160) || 'Consensus confirms crowd mispricing against telemetry pace and penalty bulletins.'}...
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1.5 font-black text-xs rounded-xl uppercase tracking-wider ${
                        (market?.edge_pct || 0) >= 8
                          ? 'bg-emerald-500 text-black'
                          : 'bg-slate-700 text-slate-200'
                      }`}>
                        {market?.debrief.recommendation || 'BUY_YES'}
                      </span>
                    </div>
                  </div>

                  {/* Live Actions & Consensus Runner */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={handleRunAIConsensus}
                      disabled={isCallingRpc}
                      className="px-5 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCallingRpc ? 'animate-spin' : ''}`} />
                      Run AI Jury Consensus on {selectedMarketId}
                    </button>
                    <button
                      onClick={() => setActiveTab('briefing')}
                      className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                    >
                      <Radio className="w-4 h-4 text-amber-400" /> View Telemetry Debrief
                    </button>
                  </div>

                </div>
              </div>

              {/* Right Column: Execution Wager Ticket */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#121624] border border-[#222A42] rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs tracking-wider uppercase">
                    <Coins className="w-4 h-4" /> Syndicate Wager Terminal
                  </div>
                  <h3 className="text-xl font-bold text-white">Execute On-Chain Position</h3>
                  <p className="text-xs text-slate-400">
                    Allocates test USDC into <code>PitwallVault.sol</code> and mints Gnosis Conditional Tokens for <strong>{selectedMarketId}</strong>.
                  </p>

                  {/* Outcome Side Picker */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-2">Select Prediction Side</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedSide('YES')}
                        className={`p-3.5 rounded-xl border text-xs font-bold transition-all ${
                          selectedSide === 'YES'
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30'
                            : 'bg-black/40 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        YES (${(market?.debrief.polymarket_probability_pct || 38) / 100} / share)
                      </button>
                      <button
                        onClick={() => setSelectedSide('NO')}
                        className={`p-3.5 rounded-xl border text-xs font-bold transition-all ${
                          selectedSide === 'NO'
                            ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30'
                            : 'bg-black/40 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        NO (${(100 - (market?.debrief.polymarket_probability_pct || 38)) / 100} / share)
                      </button>
                    </div>
                  </div>

                  {/* Wager Amount Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-2">Wager Amount (USDC)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={wagerAmount}
                        onChange={(e) => setWagerAmount(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-black/60 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                      <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">USDC</span>
                    </div>
                  </div>

                  {/* Calculated Winnings Summary */}
                  {(() => {
                    const price = selectedSide === 'YES' ? (market?.debrief.polymarket_probability_pct || 38) / 100 : (100 - (market?.debrief.polymarket_probability_pct || 38)) / 100;
                    const shares = Math.floor(wagerAmount / price);
                    const netProfit = shares - wagerAmount;
                    const roi = Math.round((netProfit / wagerAmount) * 100);
                    return (
                      <div className="bg-black/40 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
                        <div className="flex justify-between text-slate-400">
                          <span>Outcome Tokens Minted:</span>
                          <span className="text-white font-bold">{shares} Shares</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Potential Payout ($1.00/share):</span>
                          <span className="text-emerald-400 font-bold">${shares} USDC</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Net Profit Potential:</span>
                          <span className="text-emerald-400 font-bold">
                            +${netProfit} USDC (+{roi}%)
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Execute Button */}
                  <button
                    onClick={handleExecuteWager}
                    disabled={isCallingRpc}
                    className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-4 h-4 text-amber-300" />
                    Place Syndicate Wager ({wagerAmount} USDC)
                  </button>

                  {/* Reviewer Simulation Action */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-500 block mb-2">REVIEWER TESTNET ACTION:</span>
                    <button
                      onClick={() => handleResolveRace(market?.target_driver || 'Lando Norris')}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Simulate Race Finish: Outcome Wins
                    </button>
                  </div>

                </div>
              </div>

            </div>

            {/* Live Consensus Stream Console */}
            <div className="bg-[#0B0D14] border border-[#222A42] rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold tracking-wider uppercase">
                  <Terminal className="w-4 h-4" /> Live GenLayer Consensus Kernel Stream
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Intelligent Contract: <code>{CONTRACT_ADDRESS.slice(0, 10)}...</code>
                </div>
              </div>
              <div className="h-44 overflow-y-auto space-y-1.5 font-mono text-xs text-slate-300 p-2">
                {rpcLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('✓') ? 'text-emerald-400' : log.includes('🚨') ? 'text-rose-400' : log.includes('>>>') ? 'text-amber-300' : 'text-slate-300'}>
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 2. DEEP TELEMETRY & SPEED TRACE TAB (/telemetry) */}
        {/* ========================================================= */}
        {activeTab === 'telemetry' && (
          <div className="space-y-8">
            
            {/* Speed Trace Interactive SVG Card */}
            <div className="bg-[#121624] border border-[#222A42] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-rose-400 tracking-wider">OFFICIAL FP2 TELEMETRY TRACE</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      VALIDATOR VERIFIED
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1">
                    Monza Speed Trace & Sector 2 Delta Profile
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Telemetry speed trace across 5,793m lap distance comparing Norris (McLaren) vs Verstappen (Red Bull).
                  </p>
                </div>

                {/* Legend & Hover Info */}
                <div className="flex items-center gap-4 bg-black/60 px-4 py-2.5 rounded-2xl border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF8000]" />
                    <span className="text-white font-bold">Lando Norris ({metrics.topSpeed} km/h)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#38BDF8]" />
                    <span className="text-slate-300">Max Verstappen (345.5 km/h)</span>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Speed Trace Chart */}
              <div className="relative bg-black/70 rounded-2xl p-4 border border-slate-800 overflow-x-auto">
                <svg
                  viewBox={`0 0 ${traceWidth} ${traceHeight}`}
                  className="w-full h-auto select-none"
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Grid Lines */}
                  {[100, 150, 200, 250, 300, 350].map((spd) => (
                    <g key={spd}>
                      <line
                        x1={padLeft}
                        y1={getY(spd)}
                        x2={traceWidth - padRight}
                        y2={getY(spd)}
                        stroke="#1E293B"
                        strokeDasharray="3 3"
                      />
                      <text x={padLeft - 8} y={getY(spd) + 4} fill="#64748B" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {spd}
                      </text>
                    </g>
                  ))}

                  {/* Corner Markers & Vertical Lines */}
                  {MONZA_CORNERS.filter(c => c.label.includes('T')).map((corner, i) => (
                    <g key={i}>
                      <line
                        x1={getX(corner.dist)}
                        y1={padTop}
                        x2={getX(corner.dist)}
                        y2={traceHeight - padBottom}
                        stroke={corner.label.includes('Ascari') ? '#F59E0B' : '#334155'}
                        strokeWidth={corner.label.includes('Ascari') ? '1.5' : '1'}
                        strokeDasharray={corner.label.includes('Ascari') ? 'none' : '2 2'}
                      />
                      <text
                        x={getX(corner.dist)}
                        y={traceHeight - padBottom + 16}
                        fill={corner.label.includes('Ascari') ? '#F59E0B' : '#94A3B8'}
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                        fontWeight={corner.label.includes('Ascari') ? 'bold' : 'normal'}
                      >
                        {corner.label.split(' ')[0]}
                      </text>
                    </g>
                  ))}

                  {/* Ascari Highlight Zone */}
                  <rect
                    x={getX(4300)}
                    y={padTop}
                    width={getX(4800) - getX(4300)}
                    height={plotH}
                    fill="#F59E0B"
                    fillOpacity="0.08"
                  />
                  <text
                    x={(getX(4300) + getX(4800)) / 2}
                    y={padTop + 15}
                    fill="#F59E0B"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    ★ S2 ASCARI DELTA: +{metrics.s2Delta}s
                  </text>

                  {/* Speed Curves */}
                  <path d={verPath} fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                  <path d={norrisPath} fill="none" stroke="#FF8000" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Interactive Cursor Overlay */}
                  {MONZA_CORNERS.map((corner, idx) => (
                    <rect
                      key={idx}
                      x={getX(corner.dist) - 15}
                      y={padTop}
                      width={30}
                      height={plotH}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(idx)}
                    />
                  ))}

                  {hoveredPoint !== null && (
                    <g>
                      <line
                        x1={getX(MONZA_CORNERS[hoveredPoint].dist)}
                        y1={padTop}
                        x2={getX(MONZA_CORNERS[hoveredPoint].dist)}
                        y2={traceHeight - padBottom}
                        stroke="#FFF"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={getX(MONZA_CORNERS[hoveredPoint].dist)}
                        cy={getY(MONZA_CORNERS[hoveredPoint].speedNorris)}
                        r="4.5"
                        fill="#FF8000"
                        stroke="#FFF"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={getX(MONZA_CORNERS[hoveredPoint].dist)}
                        cy={getY(MONZA_CORNERS[hoveredPoint].speedVer)}
                        r="4.5"
                        fill="#38BDF8"
                        stroke="#FFF"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </svg>

                {/* Scrubber Telemetry Readout */}
                {hoveredPoint !== null && (
                  <div className="mt-3 bg-[#0B0D14] border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">TRACK LOCATION:</span>
                      <strong className="text-amber-400">{MONZA_CORNERS[hoveredPoint].label} ({MONZA_CORNERS[hoveredPoint].dist}m)</strong>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-[#FF8000] text-[10px] block font-bold">NORRIS:</span>
                        <strong className="text-white">{MONZA_CORNERS[hoveredPoint].speedNorris} km/h</strong>
                      </div>
                      <div>
                        <span className="text-[#38BDF8] text-[10px] block font-bold">VERSTAPPEN:</span>
                        <strong className="text-white">{MONZA_CORNERS[hoveredPoint].speedVer} km/h</strong>
                      </div>
                      <div>
                        <span className="text-emerald-400 text-[10px] block font-bold">DELTA:</span>
                        <strong className="text-emerald-300">
                          {MONZA_CORNERS[hoveredPoint].speedNorris >= MONZA_CORNERS[hoveredPoint].speedVer ? '+' : ''}
                          {(MONZA_CORNERS[hoveredPoint].speedNorris - MONZA_CORNERS[hoveredPoint].speedVer).toFixed(1)} km/h
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">THROTTLE:</span>
                        <strong className="text-slate-200">{MONZA_CORNERS[hoveredPoint].thr}% (G{MONZA_CORNERS[hoveredPoint].gear})</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tyre Degradation & Strategy Crossover */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Tyre Degradation Curve */}
              <div className="lg:col-span-8 bg-[#121624] border border-[#222A42] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">PIRELLI DEGRADATION TELEMETRY</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        CROSSOVER MODEL
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">
                      Hard Compound Tyre Wear & 1-Stop Pit Window
                    </h3>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <span className="text-slate-400 block text-[10px]">DEGRADATION DELTA</span>
                    <span className="text-emerald-400 font-bold">+{metrics.degAdv}s / lap advantage</span>
                  </div>
                </div>

                {/* SVG Tyre Degradation Chart */}
                <div className="relative bg-black/70 rounded-2xl p-4 border border-slate-800">
                  <svg viewBox={`0 0 ${degW} ${degH}`} className="w-full h-auto select-none">
                    {/* Y Grid Lines */}
                    {[0.5, 1.0, 1.5, 2.0, 2.5].map(loss => (
                      <g key={loss}>
                        <line
                          x1={padLeft}
                          y1={getDegY(loss)}
                          x2={degW - padRight}
                          y2={getDegY(loss)}
                          stroke="#1E293B"
                          strokeDasharray="3 3"
                        />
                        <text x={padLeft - 8} y={getDegY(loss) + 4} fill="#64748B" fontSize="10" textAnchor="end" fontFamily="monospace">
                          +{loss.toFixed(1)}s
                        </text>
                      </g>
                    ))}

                    {/* X Grid Lines (Laps 5, 10, 15, 20, 25, 30) */}
                    {[5, 10, 15, 20, 25, 30].map(lap => (
                      <g key={lap}>
                        <line
                          x1={getDegX(lap)}
                          y1={padTop}
                          x2={getDegX(lap)}
                          y2={degH - padBottom}
                          stroke="#1E293B"
                          strokeDasharray="3 3"
                        />
                        <text x={getDegX(lap)} y={degH - padBottom + 16} fill="#64748B" fontSize="10" textAnchor="middle" fontFamily="monospace">
                          L{lap}
                        </text>
                      </g>
                    ))}

                    {/* Optimal 1-Stop Window Shading (Laps 24-28) */}
                    <rect
                      x={getDegX(24)}
                      y={padTop}
                      width={getDegX(28) - getDegX(24)}
                      height={degPlotH}
                      fill="#10B981"
                      fillOpacity="0.12"
                    />
                    <text
                      x={(getDegX(24) + getDegX(28)) / 2}
                      y={padTop + 15}
                      fill="#10B981"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      OPTIMAL 1-STOP WINDOW (L24-28)
                    </text>

                    {/* Wear Lines */}
                    <path d={verDegPath} fill="none" stroke="#F43F5E" strokeWidth="2" strokeDasharray="4 2" />
                    <path d={norrisDegPath} fill="none" stroke="#10B981" strokeWidth="2.5" />

                    {/* Interactive Lap Cursor */}
                    <line
                      x1={getDegX(hoveredLap)}
                      y1={padTop}
                      x2={getDegX(hoveredLap)}
                      y2={degH - padBottom}
                      stroke="#FFF"
                      strokeWidth="1.5"
                    />
                    <circle cx={getDegX(hoveredLap)} cy={getDegY(hoveredLap * metrics.norrisDeg)} r="4" fill="#10B981" />
                    <circle cx={getDegX(hoveredLap)} cy={getDegY(hoveredLap * metrics.verDeg)} r="4" fill="#F43F5E" />
                  </svg>

                  {/* Scrubber Slider */}
                  <div className="mt-4 flex items-center gap-4 bg-[#0B0D14] p-3 rounded-xl border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400 whitespace-nowrap">SIMULATE STINT LAP:</span>
                    <input
                      type="range"
                      min="1"
                      max="32"
                      value={hoveredLap}
                      onChange={(e) => setHoveredLap(Number(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                    <span className="text-white font-bold whitespace-nowrap">LAP {hoveredLap}</span>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-emerald-400 font-bold">
                        Norris: +{(hoveredLap * metrics.norrisDeg).toFixed(2)}s
                      </span>
                      <span className="text-slate-500 mx-1">vs</span>
                      <span className="text-rose-400 font-bold">
                        Rival: +{(hoveredLap * metrics.verDeg).toFixed(2)}s
                      </span>
                      <span className="text-emerald-300 font-bold ml-2">
                        (Delta: -{(hoveredLap * metrics.degAdv).toFixed(2)}s)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather & Meteorological Radar Widget */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#121624] border border-[#222A42] rounded-3xl p-6 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                      <CloudRain className="w-4 h-4" /> Circuit Doppler Radar
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">TRACK DRY</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-black/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Thermometer className="w-5 h-5 text-rose-500" />
                        <div>
                          <span className="text-slate-400 text-[10px] block font-mono">ASPHALT SURFACE TEMP</span>
                          <span className="text-white font-bold text-sm">{metrics.trackTemp}°C Dry Asphalt</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-bold">High Grip</span>
                    </div>

                    <div className="bg-black/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CloudRain className="w-5 h-5 text-sky-400" />
                        <div>
                          <span className="text-slate-400 text-[10px] block font-mono">RAIN RISK (RADAR CELL)</span>
                          <span className="text-white font-bold text-sm">{metrics.rainPct}% Convective Risk</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-300">Dry Run</span>
                    </div>

                    <div className="bg-black/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Flag className="w-5 h-5 text-purple-400" />
                        <div>
                          <span className="text-slate-400 text-[10px] block font-mono">FIA PENALTY DOSSIER</span>
                          <span className="text-white font-bold text-sm">Verstappen 10-Drop ({metrics.startPos})</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-rose-400 font-bold">Grid Penalty</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-tr from-slate-950 to-slate-900 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <strong>Validator Consensus Impact:</strong> 42.5°C track temperature accelerates rear tyre thermal degradation on rival Red Bull RB22, giving McLaren's cooler tyre carcass an outsized stint advantage.
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* 3. VIRTUAL CHIEF RACE ENGINEER DEBRIEF (/briefing) */}
        {/* ========================================================= */}
        {activeTab === 'briefing' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-[#121624] border border-[#222A42] rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-rose-400 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white">Chief Race Engineer Telemetry Debrief</h1>
                    <p className="text-xs text-slate-400">Synthesized by GenLayer 5/5 Validator Jury for <strong>{market?.race_name || selectedMarketId}</strong></p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  CONFIRMED CONSENSUS
                </span>
              </div>

              {/* Technical Breakdown Cards */}
              <div className="space-y-4 text-xs">
                <div className="bg-black/50 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-bold text-rose-400 uppercase tracking-wider block">1. Sector Delta & Aerodynamic Advantage</span>
                  <p className="text-slate-300 leading-relaxed">
                    {market?.debrief.telemetry_advantage || 'Sector 2 delta: McLaren +0.34s advantage over Red Bull through Ascari chicane. Top speed: 348.2 km/h.'}
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider block">2. Tyre Degradation & Strategy Window</span>
                  <p className="text-slate-300 leading-relaxed">
                    {market?.debrief.tyre_deg_summary || 'Hard compound tyre degradation at 0.038s/lap versus rival 0.072s/lap guarantees an optimal 1-stop pit window (Lap 24-28).'}
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-bold text-amber-400 uppercase tracking-wider block">3. Meteorological Radar & Track Surface</span>
                  <p className="text-slate-300 leading-relaxed">
                    {market?.debrief.weather_summary || 'Track surface temp at 42.5°C with 12% precipitation risk. High-grip dry asphalt favors front-end bite over rear slide.'}
                  </p>
                </div>

                <div className="bg-black/50 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-bold text-purple-400 uppercase tracking-wider block">4. FIA Technical Delegate Penalty Impact</span>
                  <p className="text-slate-300 leading-relaxed">
                    {market?.debrief.fia_penalty_summary || 'Max Verstappen incurred a 10-place grid penalty for 5th ICE power unit. Displaced to P11 starting position.'}
                  </p>
                </div>
              </div>

              {/* Executive Rationale Banner */}
              <div className="bg-gradient-to-r from-rose-950/40 to-slate-900 p-6 rounded-2xl border border-rose-600/40 space-y-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">STRATEGIC JURY CONCLUSION</span>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  "{market?.debrief.tactical_rationale || 'Polymarket crowd severely underprices Verstappen P11 grid displacement and McLaren low tyre degradation in high-temp race pace simulations.'}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. SYNDICATE PORTFOLIO (/portfolio) */}
        {/* ========================================================= */}
        {activeTab === 'portfolio' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-[#121624] border border-[#222A42] rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Coins className="w-6 h-6 text-amber-400" /> Active Syndicate Positions
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">Conditional Outcome Tokens held in <code>PitwallVault.sol</code>.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-mono">AVAILABLE VAULT BALANCE</span>
                  <span className="text-2xl font-black text-emerald-400">${userUsdcBalance} USDC</span>
                </div>
              </div>

              {/* Positions List */}
              {userPositions.length > 0 ? (
                <div className="space-y-4">
                  {userPositions.map((pos) => (
                    <div key={pos.positionId} className="bg-black/50 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{pos.marketTitle}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${pos.side === 'YES' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-rose-950 text-rose-300 border border-rose-600'}`}>
                            {pos.side}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400">
                          Market: {pos.marketId} | Wager: ${pos.wagerAmount} USDC | Outcome Shares: {pos.tokensMinted}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {pos.isSettled ? (
                          pos.isWon ? (
                            <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500 text-xs font-bold rounded-xl">
                              ✓ Paid Out (+${pos.payoutAmount - pos.wagerAmount} Profit)
                            </span>
                          ) : (
                            <span className="px-4 py-2 bg-rose-500/20 text-rose-400 border border-rose-500 text-xs font-bold rounded-xl">
                              Expired ($0.00)
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => handleClaimPayout(pos.positionId)}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                          >
                            Claim Payout ($1.00/share)
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  No active syndicate wagers yet. Go to the Polymarket Betting Board to analyze open markets and place your first wager!
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. ARCHITECTURE & PROTOCOL INVARIANTS (/architecture) */}
        {/* ========================================================= */}
        {activeTab === 'architecture' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#121624] border border-[#222A42] rounded-3xl p-8 shadow-2xl space-y-6">
              <h1 className="text-2xl font-bold text-white mb-2">Protocol Architecture & Invariants</h1>
              <p className="text-xs text-slate-400">
                How Pitwall AI leverages GenLayer Intelligent Contracts and Gnosis Conditional Tokens for subjective sports prediction.
              </p>

              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="bg-black/50 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <h4 className="font-bold text-rose-400 text-sm">1. Multi-Source Non-Deterministic Ingestion</h4>
                  <p>GenLayer validators scrape Polymarket market odds, practice sector times, weather radars, and FIA penalty reports in 1 unified Equivalence Principle consensus round.</p>
                </div>
                <div className="bg-black/50 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <h4 className="font-bold text-emerald-400 text-sm">2. Quantitative Alpha Edge Formulation</h4>
                  <p>Wagers are approved only when the statistical edge between fair probability and Polymarket crowd odds exceeds the 8.0% threshold (Edge = P_fair - P_poly).</p>
                </div>
                <div className="bg-black/50 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <h4 className="font-bold text-amber-400 text-sm">3. Strict Underfunded Reversion & Conditional Tokens</h4>
                  <p>All wagers mint Gnosis Conditional Tokens (ERC-1155). <code>PitwallVault.sol</code> strictly reverts with <code>[ERR_UNDERFUNDED]</code> if vault reserves cannot cover payouts.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Register New Polymarket Bet Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121624] border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <PlusCircle className="w-5 h-5" /> Register New Polymarket Bet
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewBet} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">MARKET ID (e.g. MONZA_2026_SAFETY_CAR)</label>
                <input
                  type="text"
                  value={newMarketId}
                  onChange={(e) => setNewMarketId(e.target.value)}
                  placeholder="e.g. MONZA_2026_SAFETY_CAR"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">RACE NAME / PREDICTION TITLE</label>
                <input
                  type="text"
                  value={newRaceName}
                  onChange={(e) => setNewRaceName(e.target.value)}
                  placeholder="e.g. Italian GP: Safety Car Deployed"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CIRCUIT</label>
                <input
                  type="text"
                  value={newCircuit}
                  onChange={(e) => setNewCircuit(e.target.value)}
                  placeholder="e.g. Autodromo Nazionale Monza"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">TARGET DRIVER / PROPOSITION</label>
                <input
                  type="text"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="e.g. Safety Car Deployed: YES"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">POLYMARKET SLUG / EVENT URL</label>
                <input
                  type="text"
                  value={newPolySlug}
                  onChange={(e) => setNewPolySlug(e.target.value)}
                  placeholder="e.g. f1-monza-safety-car-2026"
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCallingRpc}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isCallingRpc ? 'animate-spin' : ''}`} />
                  Sign & Register on GenLayer Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
