"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  runDistributionSimulation,
  type FairSwapPoint,
  DEFAULT_SOL_PER_SWAP,
  DEFAULT_GRADUATION_AMOUNT_SOL,
  DEFAULT_BONDING_CURVE_SUPPLY,
  getDefaultFinalPriceSol,
  getPriceAtSolRaised,
} from "./lib/distributionSimulation";
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const SwapsTable = React.memo(function SwapsTable({
  points,
  selectedIndex,
  onSelect,
}: {
  points: FairSwapPoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <section className="section card">
      <div className="flex items-center justify-between">
        <div className="chart-title">All swaps until graduation</div>
        <div style={{ fontSize: 12, color: "rgb(148,163,184)" }}>Total swaps: {points.length}</div>
      </div>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sol in</th>
              <th>Total SOL</th>
              <th>Tokens minted</th>
              <th>Distributed</th>
              <th>Saved</th>
              <th>Used from reserve</th>
              <th>Reserve balance</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, idx) => (
              <tr
                key={p.swapIndex}
                className={idx === selectedIndex ? "row-active" : undefined}
                onClick={() => onSelect(idx)}
                style={{ cursor: "pointer" }}
              >
                <td>{p.swapIndex}</td>
                <td>{p.solIn.toFixed(4)}</td>
                <td>{p.totalSolRaised.toFixed(4)}</td>
                <td>{p.totalTokensMinted.toLocaleString()}</td>
                <td>{p.tokensDistributed.toLocaleString()}</td>
                <td>{p.tokensSaved.toLocaleString()}</td>
                <td>{p.reserveUsed.toLocaleString()}</td>
                <td>{p.reserveCumulative.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});

const SolAccumulatedChart = React.memo(function SolAccumulatedChart({
  points,
}: {
  points: FairSwapPoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ReLineChart
        data={points}
        margin={{ top: 20, right: 24, left: 0, bottom: 24 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
        <XAxis
          dataKey="swapIndex"
          tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
          label={{
            value: "Swap index",
            position: "insideBottom",
            offset: -12,
            fill: "rgba(148,163,184,0.9)",
            fontSize: 11,
          }}
        />
        <YAxis
          dataKey="totalSolRaised"
          tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid rgba(51,65,85,0.9)",
            borderRadius: 8,
            fontSize: 11,
          }}
          formatter={(value: number) => [`${value.toFixed(3)} SOL`, "Sol accumulated"]}
          labelFormatter={(label: number) => `Swap #${label}`}
        />
        <Legend
          verticalAlign="top"
          height={24}
          wrapperStyle={{ fontSize: 11, color: "rgba(148,163,184,0.9)" }}
        />
        <Line
          type="monotone"
          dataKey="totalSolRaised"
          name="Sol accumulated"
          stroke="#38bdf8"
          strokeWidth={2.4}
          dot={false}
        />
      </ReLineChart>
    </ResponsiveContainer>
  );
});

const TokenFlowsChart = React.memo(function TokenFlowsChart({
  points,
}: {
  points: FairSwapPoint[];
}) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        swapIndex: p.swapIndex,
        mintedM: p.totalTokensMinted / 1_000_000,
        distributedM: p.totalTokensDistributed / 1_000_000,
        savedM: p.totalTokensSavedInReserve / 1_000_000,
        usedM: p.totalTokensUsedFromReserve / 1_000_000,
      })),
    [points],
  );

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ReLineChart
        data={data}
        margin={{ top: 20, right: 24, left: 0, bottom: 24 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
        <XAxis
          dataKey="swapIndex"
          tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
          label={{
            value: "Swap index",
            position: "insideBottom",
            offset: -12,
            fill: "rgba(148,163,184,0.9)",
            fontSize: 11,
          }}
        />
        <YAxis
          tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
          width={80}
          label={{
            value: "Tokens (millions)",
            angle: -90,
            position: "insideLeft",
            offset: 10,
            fill: "rgba(148,163,184,0.9)",
            fontSize: 11,
          }}
        />
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid rgba(51,65,85,0.9)",
            borderRadius: 8,
            fontSize: 11,
          }}
          formatter={(value: number, name: string) => [
            `${value.toFixed(3)} M`,
            name,
          ]}
          labelFormatter={(label: number) => `Swap #${label}`}
        />
        <Legend
          verticalAlign="top"
          height={28}
          wrapperStyle={{ fontSize: 11, color: "rgba(148,163,184,0.9)" }}
        />
        <Line
          type="monotone"
          dataKey="mintedM"
          name="Total minted"
          stroke="#e5e7eb"
          strokeWidth={2.2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="distributedM"
          name="Total distributed"
          stroke="#34d399"
          strokeWidth={2.2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="savedM"
          name="Saved in reserve"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="usedM"
          name="Used from reserve"
          stroke="#fb923c"
          strokeWidth={2}
          dot={false}
        />
      </ReLineChart>
    </ResponsiveContainer>
  );
});

const PriceOverSwapsChart = React.memo(function PriceOverSwapsChart({
  points,
}: {
  points: FairSwapPoint[];
}) {
  if (!points.length) return null;

  const data = points.map((p) => ({
    swapIndex: p.swapIndex,
    priceSol: getPriceAtSolRaised(p.totalSolRaised),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ReLineChart
        data={data}
        margin={{ top: 20, right: 24, left: 0, bottom: 24 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
        <XAxis
          dataKey="swapIndex"
          tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
          label={{
            value: "Swap index",
            position: "insideBottom",
            offset: -12,
            fill: "rgba(148,163,184,0.9)",
            fontSize: 11,
          }}
        />
        <YAxis
          tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
          width={90}
          label={{
            value: "Token price (SOL)",
            angle: -90,
            position: "insideLeft",
            offset: 10,
            fill: "rgba(148,163,184,0.9)",
            fontSize: 11,
          }}
          tickFormatter={(v: number) => v.toExponential(2)}
        />
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid rgba(51,65,85,0.9)",
            borderRadius: 8,
            fontSize: 11,
          }}
          formatter={(value: number) => [`${value.toExponential(8)} SOL`, "Token price"]}
          labelFormatter={(label: number) => `Swap #${label}`}
        />
        <Legend
          verticalAlign="top"
          height={24}
          wrapperStyle={{ fontSize: 11, color: "rgba(148,163,184,0.9)" }}
        />
        <Line
          type="monotone"
          dataKey="priceSol"
          name="Token price"
          stroke="#f97316"
          strokeWidth={2.2}
          dot={false}
        />
      </ReLineChart>
    </ResponsiveContainer>
  );
});

function tokensAtSolDefault(xSol: number): number {
  const grad = DEFAULT_GRADUATION_AMOUNT_SOL;
  const supply = DEFAULT_BONDING_CURVE_SUPPLY;
  const CURVE_CONSTANT = 30;
  if (xSol <= 0) return 0;
  const numerator = supply * xSol * (CURVE_CONSTANT + grad);
  const denominator = grad * (CURVE_CONSTANT + xSol);
  return Math.floor(numerator / denominator);
}

function solForTokensDefault(yWhole: number): number {
  if (yWhole <= 0) return 0;
  const grad = DEFAULT_GRADUATION_AMOUNT_SOL;
  const supply = DEFAULT_BONDING_CURVE_SUPPLY;
  const CURVE_CONSTANT = 30;
  const denom = supply * (CURVE_CONSTANT + grad) - yWhole * grad;
  if (denom <= 0) return grad;
  return (CURVE_CONSTANT * yWhole * grad) / denom;
}

function FreePlayPriceChart({
  series,
}: {
  series: { gameIndex: number; priceSol: number }[];
}) {
  if (!series.length) return null;

  const basePrice = series[0]?.priceSol ?? 0;
  if (basePrice <= 0) return null;
  const maxPrice = series.reduce((m, p) => (p.priceSol > m ? p.priceSol : m), basePrice);
  const priceScale = 1e9; // display in 1e-9 SOL units

  return (
    <div style={{ marginTop: 16 }}>
      <div className="chart-title" style={{ marginBottom: 4 }}>
        Price change across free reward games
      </div>
      <p className="swap-meta" style={{ marginBottom: 8 }}>
        Y-axis shows % change in token price relative to game 0 (no tokens minted yet). X-axis is the free
        reward game index.
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <ReLineChart
          data={series}
          margin={{ top: 16, right: 24, left: 0, bottom: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
          <XAxis
            dataKey="gameIndex"
            tick={{ fill: "rgba(148,163,184,0.9)", fontSize: 11 }}
            label={{
              value: "Free reward game index",
              position: "insideBottom",
              offset: -12,
              fill: "rgba(148,163,184,0.9)",
              fontSize: 11,
            }}
          />
          <YAxis
            tick={{
              fill: "rgba(148,163,184,0.9)",
              fontSize: 11,
            }}
            width={80}
            domain={[basePrice, maxPrice]}
            label={{
              value: "Token price (SOL × 1e9)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "rgba(148,163,184,0.9)",
              fontSize: 11,
            }}
            tickFormatter={(v: number) => (v * priceScale).toFixed(4)}
          />
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid rgba(51,65,85,0.9)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value: number, _name, _props) => {
              const price = value as number;
              const deltaPct = ((price / basePrice) - 1) * 100;
              return [
                `${price.toExponential(8)} SOL (${deltaPct.toFixed(4)}%)`,
                "Token price",
              ];
            }}
            labelFormatter={(label: number) => (label === 0 ? "Game 0 (no tokens)" : `Game #${label}`)}
          />
          <Legend
            verticalAlign="top"
            height={24}
            wrapperStyle={{ fontSize: 11, color: "rgba(148,163,184,0.9)" }}
          />
          <Line
            type="monotone"
            dataKey="priceSol"
            name="Token price"
            stroke="#f97316"
            strokeWidth={2.2}
            dot={false}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Page() {
  const [solPerSwapInput, setSolPerSwapInput] = useState(DEFAULT_SOL_PER_SWAP.toString());
  const [appliedSolPerSwap, setAppliedSolPerSwap] = useState(DEFAULT_SOL_PER_SWAP);
  const [creatorShareInput, setCreatorShareInput] = useState("1");
  const [platformShareInput, setPlatformShareInput] = useState("0.5");
  const [freeTokensShareInput, setFreeTokensShareInput] = useState("1");
  const [appliedCreatorShare, setAppliedCreatorShare] = useState(1);
  const [appliedPlatformShare, setAppliedPlatformShare] = useState(0.5);
  const [appliedFreeTokensShare, setAppliedFreeTokensShare] = useState(1);
  const [swapsPerDayInput, setSwapsPerDayInput] = useState("1000");
  const [appliedSwapsPerDay, setAppliedSwapsPerDay] = useState(1000);
  const [tokensPerGameInput, setTokensPerGameInput] = useState("1000");
  const [appliedTokensPerGame, setAppliedTokensPerGame] = useState(1000);

  const points = useMemo(
    () =>
      runDistributionSimulation({
        solPerSwap: appliedSolPerSwap,
        creatorSharePct: appliedCreatorShare,
        platformSharePct: appliedPlatformShare,
        freeTokensSharePct: appliedFreeTokensShare,
      }),
    [appliedSolPerSwap, appliedCreatorShare, appliedPlatformShare, appliedFreeTokensShare],
  );

  const [cursor, setCursor] = useState(0);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [swapInput, setSwapInput] = useState("1");
  const [isUpdatingSwap, setIsUpdatingSwap] = useState(false);

  const appliedTakenPct = appliedCreatorShare + appliedPlatformShare + appliedFreeTokensShare;
  const appliedSwapSharePct = Math.max(0, 100 - appliedTakenPct);
  const effectiveSolPerSwap = appliedSolPerSwap * (appliedSwapSharePct / 100);
  const creatorSolPerSwap = appliedSolPerSwap * (appliedCreatorShare / 100);
  const platformSolPerSwap = appliedSolPerSwap * (appliedPlatformShare / 100);
  const freeTokensSolPerSwap = appliedSolPerSwap * (appliedFreeTokensShare / 100);
  const creatorSolPerDay = creatorSolPerSwap * appliedSwapsPerDay;
  const platformSolPerDay = platformSolPerSwap * appliedSwapsPerDay;
  const finalPriceSol = getDefaultFinalPriceSol();

  const totalSwaps = points.length;
  const totalFreeSolTillGrad = freeTokensSolPerSwap * totalSwaps;
  const tokensAvailableForFree =
    finalPriceSol > 0 ? totalFreeSolTillGrad / finalPriceSol : 0;
  const freeGamesPossible =
    appliedTokensPerGame > 0 ? Math.floor(tokensAvailableForFree / appliedTokensPerGame) : 0;

  const freePlaySeries = useMemo(() => {
    if (freeGamesPossible <= 0 || appliedTokensPerGame <= 0) return [] as { gameIndex: number; priceSol: number }[];
    const series: { gameIndex: number; priceSol: number }[] = [];
    const maxGames = freeGamesPossible;
    for (let g = 0; g <= maxGames; g++) {
      const tokensMinted = g * appliedTokensPerGame;
      const solRaised = solForTokensDefault(tokensMinted);
      const price = getPriceAtSolRaised(solRaised);
      series.push({ gameIndex: g, priceSol: price });
    }
    return series;
  }, [freeGamesPossible, appliedTokensPerGame]);

  let totalPriceChangePct = 0;
  let avgPriceChangePct = 0;
  if (freePlaySeries.length > 1) {
    const basePrice = freePlaySeries[0].priceSol;
    const lastPrice = freePlaySeries[freePlaySeries.length - 1].priceSol;
    if (basePrice > 0) {
      totalPriceChangePct = ((lastPrice / basePrice) - 1) * 100;
      avgPriceChangePct = totalPriceChangePct / (freePlaySeries.length - 1);
    }
  }
  const current =
    points.length > 0
      ? points[Math.min(cursor, points.length - 1)]
      : undefined;
  const finalPoint = points[points.length - 1];
  const firstReserveUseSwap = useMemo(
    () => points.find((p) => p.reserveUsed > 0)?.swapIndex ?? null,
    [points],
  );

  // Reset selection when the simulation configuration changes.
  useEffect(() => {
    if (!points.length) return;
    const lastIndex = points.length - 1;
    setCursor(lastIndex);
    setSliderIndex(lastIndex);
    setSwapInput(String(points[lastIndex].swapIndex));
  }, [points]);

  const commitSwapIndex = (index: number) => {
    if (!points.length) return;
    const clampedSwap = Math.min(Math.max(index, 1), totalSwaps);
    const internalIndex = clampedSwap - 1;
    setIsUpdatingSwap(true);
    setCursor(internalIndex);
    setSliderIndex(internalIndex);
    setSwapInput(String(clampedSwap));
    setTimeout(() => setIsUpdatingSwap(false), 80);
  };

  return (
    <div className="page">
      <section className="section card">
        <div className="swap-header-row">
          <div>
            <div className="chart-title">Simulation configuration</div>
            <p className="swap-meta">
              Adjust the constant SOL amount used for each swap in the graduation retain simulation and
              re-run the curve.
            </p>
          </div>
          <div style={{ fontSize: 12, color: "rgb(148,163,184)" }}>
            <div style={{ marginBottom: 4 }}>Shares &amp; SOL per swap</div>
            <div className="swap-slider-row" style={{ gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11 }}>Creator %</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={creatorShareInput}
                onChange={(e) => setCreatorShareInput(e.target.value)}
                className="swap-number"
              />
              <span style={{ fontSize: 11 }}>Platform %</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={platformShareInput}
                onChange={(e) => setPlatformShareInput(e.target.value)}
                className="swap-number"
              />
              <span style={{ fontSize: 11 }}>Free tokens %</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={freeTokensShareInput}
                onChange={(e) => setFreeTokensShareInput(e.target.value)}
                className="swap-number"
              />
              <span style={{ fontSize: 11 }}>SOL per swap</span>
              <input
                type="number"
                min={0.000001}
                step={0.000001}
                value={solPerSwapInput}
                onChange={(e) => setSolPerSwapInput(e.target.value)}
                className="swap-number"
              />
              <span style={{ fontSize: 11 }}>Swaps / day</span>
              <input
                type="number"
                min={1}
                step={1}
                value={swapsPerDayInput}
                onChange={(e) => setSwapsPerDayInput(e.target.value)}
                className="swap-number"
              />
              <span style={{ fontSize: 11 }}>Tokens per game</span>
              <input
                type="number"
                min={1}
                step={1}
                value={tokensPerGameInput}
                onChange={(e) => setTokensPerGameInput(e.target.value)}
                className="swap-number"
              />
              <button
                type="button"
                className="swap-search-button"
                onClick={() => {
                  const solRaw = Number(solPerSwapInput);
                  const creatorRaw = Number(creatorShareInput);
                  const platformRaw = Number(platformShareInput);
                  const freeRaw = Number(freeTokensShareInput);
                  const swapsPerDayRaw = Number(swapsPerDayInput);
                  const tokensPerGameRaw = Number(tokensPerGameInput);
                  if (Number.isNaN(solRaw) || solRaw <= 0) return;
                  if ([creatorRaw, platformRaw, freeRaw].some((v) => Number.isNaN(v) || v < 0)) {
                    return;
                  }
                  if (Number.isNaN(swapsPerDayRaw) || swapsPerDayRaw <= 0) return;
                  if (Number.isNaN(tokensPerGameRaw) || tokensPerGameRaw <= 0) return;
                  setAppliedSolPerSwap(solRaw);
                  setAppliedCreatorShare(creatorRaw);
                  setAppliedPlatformShare(platformRaw);
                  setAppliedFreeTokensShare(freeRaw);
                  setAppliedSwapsPerDay(swapsPerDayRaw);
                  setAppliedTokensPerGame(tokensPerGameRaw);
                }}
              >
                Run
              </button>
              <span style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                Swap share:&nbsp;
                <span style={{ color: appliedSwapSharePct <= 0 ? "#f97373" : "#e5e7eb" }}>
                  {appliedSwapSharePct.toFixed(1)}%
                </span>
              </span>
              <span style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                Effective SOL:&nbsp;
                <span style={{ color: "#e5e7eb" }}>
                  {effectiveSolPerSwap.toFixed(6)}
                </span>{" "}
                SOL
              </span>
            </div>
            <div className="headline-stats" style={{ marginTop: 10 }}>
              <div className="headline-stat">
                <div className="headline-stat-label">Curve swap share (per swap)</div>
                <div className="headline-stat-value">
                  {effectiveSolPerSwap.toFixed(6)} SOL
                </div>
                <div className="swap-meta">
                  From total {appliedSolPerSwap.toFixed(6)} SOL with swap share{" "}
                  {appliedSwapSharePct.toFixed(1)}%.
                </div>
              </div>
              <div className="headline-stat">
                <div className="headline-stat-label">Free tokens allocation (per swap)</div>
                <div className="headline-stat-value">
                  {freeTokensSolPerSwap.toFixed(6)} SOL
                </div>
                <div className="swap-meta">
                  Based on free tokens share {appliedFreeTokensShare.toFixed(1)}%.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section card">
        <div className="swap-header-row">
          <div>
            <div className="chart-title">Free-to-play token distribution</div>
            <p className="swap-meta">
              Based on the free tokens SOL share, this estimates how many tokens can be given out in a
              free-to-play game and how many games are possible before that pool is exhausted.
            </p>
          </div>
        </div>
        <div className="headline-stats" style={{ marginTop: 10 }}>
          <div className="headline-stat">
            <div className="headline-stat-label">Tokens available for free play</div>
            <div className="headline-stat-value">
              {tokensAvailableForFree.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="swap-meta">
              Computed from total free-tokens SOL till graduation (
              {totalFreeSolTillGrad.toFixed(3)} SOL) at peak token price ({finalPriceSol.toFixed(6)} SOL
              / token).
            </div>
          </div>
          <div className="headline-stat">
            <div className="headline-stat-label">Free-to-play games possible</div>
            <div className="headline-stat-value">
              {freeGamesPossible.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="swap-meta">
              With {appliedTokensPerGame.toLocaleString()} tokens distributed per game.
            </div>
          </div>
          {freePlaySeries.length > 1 && (
            <>
              <div className="headline-stat">
                <div className="headline-stat-label">Total price change</div>
                <div className="headline-stat-value">
                  {totalPriceChangePct.toFixed(4)}%
                </div>
                <div className="swap-meta">
                  From game 0 (no tokens) to game {freePlaySeries[freePlaySeries.length - 1].gameIndex}.
                </div>
              </div>
              <div className="headline-stat">
                <div className="headline-stat-label">Average change per game</div>
                <div className="headline-stat-value">
                  {avgPriceChangePct.toFixed(6)}%
                </div>
                <div className="swap-meta">
                  Total change divided by {freePlaySeries.length - 1} free reward games.
                </div>
              </div>
            </>
          )}
        </div>
        <FreePlayPriceChart series={freePlaySeries} />
      </section>

      <section className="section">
        <span className="tag">
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 999,
              background:
                "conic-gradient(from 180deg at 50% 50%, #38bdf8, #a855f7, #22c55e, #38bdf8)",
            }}
          />
          Pay to Play fair distribution
        </span>
        <h1>Pay to Play Fair distribution along the bonding curve</h1>
        <p className="lead">
          This UI mirrors the graduation retain test in{" "}
          <code className="px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-700/60 text-xs">
            Simulation/tests/bondingCurve.graduation_retain.test.ts
          </code>
          , showing how SOL accumulated, total tokens minted, tokens distributed, tokens saved in reserve,
          and tokens used from reserve evolve over time.
        </p>

        {finalPoint && (
          <div className="headline-stats">
            <div className="headline-stat">
              <div className="headline-stat-label">Total swaps to graduation</div>
              <div className="headline-stat-value">{totalSwaps.toLocaleString()}</div>
            </div>
            <div className="headline-stat">
              <div className="headline-stat-label">Graduation SOL raised</div>
              <div className="headline-stat-value">
                {finalPoint.totalSolRaised.toFixed(3)}{" "}
                <span style={{ fontSize: 11, color: "rgb(148,163,184)" }}>SOL</span>
              </div>
            </div>
            <div className="headline-stat">
              <div className="headline-stat-label">Total tokens minted at graduation</div>
              <div className="headline-stat-value">
                {finalPoint.totalTokensMinted.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            {appliedSwapsPerDay > 0 && (
              <div className="headline-stat">
                <div className="headline-stat-label">Total days to reach graduation</div>
                <div className="headline-stat-value">
                  {Math.ceil(totalSwaps / appliedSwapsPerDay).toLocaleString()}{" "}
                  <span style={{ fontSize: 11, color: "rgb(148,163,184)" }}>days</span>
                </div>
                <div className="swap-meta">
                  Based on {appliedSwapsPerDay.toLocaleString()} swaps per day.
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="section card">
        <div className="swap-header-row">
          <div>
            <div className="chart-title">Earnings (creator &amp; platform)</div>
            <p className="swap-meta">
              Estimated SOL earned from the configured shares, given the current SOL per swap, swaps per
              day, and total swaps to graduation.
            </p>
          </div>
        </div>
        <div className="headline-stats" style={{ marginTop: 10 }}>
          <div className="headline-stat">
            <div className="headline-stat-label">Creator earnings</div>
            <div className="headline-stat-value">
              Per swap {creatorSolPerSwap.toFixed(6)} SOL
            </div>
            <div className="swap-meta">
              Per day ({appliedSwapsPerDay.toLocaleString()} swaps): {creatorSolPerDay.toFixed(3)} SOL
            </div>
            <div className="swap-meta">
              7 days: {(creatorSolPerDay * 7).toFixed(3)} SOL
            </div>
            {totalSwaps > 0 && (
              <div className="swap-meta">
                Till graduation ({totalSwaps.toLocaleString()} swaps):{" "}
                {(creatorSolPerSwap * totalSwaps).toFixed(3)} SOL
              </div>
            )}
          </div>
          <div className="headline-stat">
            <div className="headline-stat-label">Platform earnings</div>
            <div className="headline-stat-value">
              Per swap {platformSolPerSwap.toFixed(6)} SOL
            </div>
            <div className="swap-meta">
              Per day ({appliedSwapsPerDay.toLocaleString()} swaps): {platformSolPerDay.toFixed(3)} SOL
            </div>
            <div className="swap-meta">
              7 days: {(platformSolPerDay * 7).toFixed(3)} SOL
            </div>
            {totalSwaps > 0 && (
              <div className="swap-meta">
                Till graduation ({totalSwaps.toLocaleString()} swaps):{" "}
                {(platformSolPerSwap * totalSwaps).toFixed(3)} SOL
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section card">
        <div className="swap-layout">
          <div className="swap-header-row">
            <div>
              <div className="chart-title">Explore a specific swap</div>
              <p className="swap-meta">
                Use the slider, type a swap number, or click any row in the table to inspect the
                fair-distribution breakdown for a specific swap.
              </p>
              {firstReserveUseSwap && (
                <div className="swap-meta" style={{ marginTop: 6 }}>
                  <span className="swap-pill">
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: "#22c55e" }} />
                    Reserve first used at swap #
                    <span style={{ color: "#e5e7eb", fontWeight: 600 }}>{firstReserveUseSwap}</span>
                  </span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: "rgb(148,163,184)" }}>
              <div style={{ fontFamily: "SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", fontSize: 13 }}>
                Swap <span style={{ color: "#e5e7eb" }}>#{current?.swapIndex ?? "-"}</span> of{" "}
                {totalSwaps.toLocaleString()}
              </div>
              <div className="swap-slider-row">
                <input
                  type="range"
                  min={1}
                  max={Math.max(totalSwaps, 1)}
                  value={Math.min(sliderIndex + 1, Math.max(totalSwaps, 1))}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    if (Number.isNaN(raw)) return;
                    setSliderIndex(raw - 1);
                  }}
                  onMouseUp={() => commitSwapIndex(sliderIndex + 1)}
                  onTouchEnd={() => commitSwapIndex(sliderIndex + 1)}
                />
                <input
                  type="number"
                  min={1}
                  max={Math.max(totalSwaps, 1)}
                  value={swapInput}
                  onChange={(e) => setSwapInput(e.target.value)}
                  onBlur={() => {
                    const raw = Number(swapInput);
                    if (Number.isNaN(raw)) {
                      setSwapInput(String((cursor ?? 0) + 1));
                      return;
                    }
                    commitSwapIndex(raw);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const raw = Number(swapInput);
                      if (Number.isNaN(raw)) return;
                      commitSwapIndex(raw);
                    }
                  }}
                  className="swap-number"
                />
                <button
                  type="button"
                  className="swap-search-button"
                  onClick={() => {
                    const raw = Number(swapInput);
                    if (Number.isNaN(raw)) return;
                    commitSwapIndex(raw);
                  }}
                >
                  Go
                </button>
                {isUpdatingSwap && (
                  <span style={{ fontSize: 11, color: "rgb(148,163,184)" }}>Updating…</span>
                )}
              </div>
            </div>
          </div>

          {current && (
            <div className="swap-stats-grid">
              <div className="swap-stat-card">
                <div className="stat-label">Sol accumulated</div>
                <div className="stat-value">
                  {current.totalSolRaised.toFixed(3)}
                  <span className="ml-1 text-xs text-slate-400">SOL</span>
                </div>
                <div className="stat-label" style={{ marginTop: 8 }}>
                  Total tokens minted
                </div>
                <div className="stat-value">
                  {current.totalTokensMinted.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="stat-label" style={{ marginTop: 8 }}>
                  Tokens minted (this swap)
                </div>
                <div className="stat-value">
                  {current.tokensOutRaw.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>

              <div className="swap-stat-card">
                <div className="stat-label">Tokens distributed (this swap)</div>
                <div className="stat-value">
                  {current.tokensDistributed.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="stat-label" style={{ marginTop: 8 }}>
                  Cumulative tokens distributed
                </div>
                <div className="stat-value">
                  {current.totalTokensDistributed.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>

              <div className="swap-stat-card">
                <div className="stat-label">Tokens saved in reserve (this swap)</div>
                <div className="stat-value">
                  {current.tokensSaved.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="stat-label" style={{ marginTop: 8 }}>
                  Tokens used from reserve (this swap)
                </div>
                <div className="stat-value">
                  {current.reserveUsed.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="stat-label" style={{ marginTop: 8 }}>
                  Reserve balance after swap
                </div>
                <div className="stat-value">
                  {current.reserveCumulative.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="chart-title">SOL accumulated over swaps</div>
              <p className="mt-1 text-xs text-slate-300/90 max-w-sm">
                Monotonic increase in total SOL raised until the bonding curve graduates at its configured
                cap.
              </p>
            </div>
            <div className="chart-legend">
              <span className="dot dot-fair" />
              <span>Sol accumulated</span>
            </div>
          </div>
          <SolAccumulatedChart points={points} />
        </div>

        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="chart-title">Token price over swaps</div>
              <p className="mt-1 text-xs text-slate-300/90 max-w-sm">
                Bonding curve token price (in SOL) at each swap index, assuming only pay-to-play swaps move
                the curve.
              </p>
            </div>
            <div className="chart-legend">
              <span className="dot dot-unfair" />
              <span>Token price</span>
            </div>
          </div>
          <PriceOverSwapsChart points={points} />
        </div>

        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="chart-title">Token flows under fair distribution</div>
              <p className="mt-1 text-xs text-slate-300/90 max-w-sm">
                Cumulative totals for tokens minted by the curve, actually distributed to users, saved into
                the reserve from early swaps, and later used from the reserve to top up late users.
              </p>
            </div>
            <div className="chart-legend flex-wrap">
              <span className="dot dot-fair" />
              <span>Total distributed</span>
              <span className="dot dot-unfair" />
              <span>Saved / used from reserve</span>
            </div>
          </div>
          <TokenFlowsChart points={points} />
        </div>
      </section>

      <SwapsTable points={points} selectedIndex={cursor} onSelect={setCursor} />
    </div>
  );
}

