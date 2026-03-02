export type FairSwapPoint = {
  swapIndex: number;
  /** Cumulative SOL raised so far (SOL). */
  totalSolRaised: number;
  /** Cumulative tokens minted by the curve so far (whole tokens). */
  totalTokensMinted: number;

  /** Cumulative tokens actually distributed to users under the fair scheme. */
  totalTokensDistributed: number;
  /** Cumulative tokens saved into the reserve. */
  totalTokensSavedInReserve: number;
  /** Cumulative tokens taken out of the reserve to top up later users. */
  totalTokensUsedFromReserve: number;
  /** Current reserve balance (saved - used). */
  reserveCumulative: number;

  /** Per‑swap SOL in (SOL). */
  solIn: number;
  /** Per‑swap raw tokens from the curve before fairness adjustments (whole tokens). */
  tokensOutRaw: number;
  /** Per‑swap tokens distributed to the user under the fair scheme. */
  tokensDistributed: number;
  /** Per‑swap tokens saved into the reserve. */
  tokensSaved: number;
  /** Per‑swap tokens pulled from the reserve. */
  reserveUsed: number;
};

const CURVE_CONSTANT = 30;
export const DEFAULT_BONDING_CURVE_SUPPLY = 793_100_000;
export const DEFAULT_GRADUATION_AMOUNT_SOL = 85;
export const DEFAULT_SOL_PER_SWAP = 0.0062;

const MAX_EARLY_USER_RETURN = 3.75;
const MAX_LATER_USER_RETURN = 3.75;

function tokensAtSol(xSol: number, graduationAmount: number, bondingCurveSupply: number): number {
  if (xSol <= 0) return 0;
  const numerator = bondingCurveSupply * xSol * (CURVE_CONSTANT + graduationAmount);
  const denominator = graduationAmount * (CURVE_CONSTANT + xSol);
  return Math.floor(numerator / denominator);
}

function getPricePerTokenInSol(
  xSol: number,
  graduationAmount: number,
  bondingCurveSupply: number,
): number {
  const A = (bondingCurveSupply * (CURVE_CONSTANT + graduationAmount)) / graduationAmount;
  const pricePerWholeToken = ((CURVE_CONSTANT + xSol) ** 2) / (A * CURVE_CONSTANT);
  return pricePerWholeToken;
}

export function getDefaultFinalPriceSol(): number {
  return getPricePerTokenInSol(
    DEFAULT_GRADUATION_AMOUNT_SOL,
    DEFAULT_GRADUATION_AMOUNT_SOL,
    DEFAULT_BONDING_CURVE_SUPPLY,
  );
}

export function getPriceAtSolRaised(xSol: number): number {
  return getPricePerTokenInSol(xSol, DEFAULT_GRADUATION_AMOUNT_SOL, DEFAULT_BONDING_CURVE_SUPPLY);
}

export function runDistributionSimulation(options?: {
  bondingCurveSupply?: number;
  graduationAmountSol?: number;
  maxSwaps?: number;
  /** Total SOL sent per swap (before applying creator/platform/free-token shares). */
  solPerSwap?: number;
  /** Creator share percentage (0–100). */
  creatorSharePct?: number;
  /** Platform share percentage (0–100). */
  platformSharePct?: number;
  /** Free tokens share percentage (0–100). */
  freeTokensSharePct?: number;
}): FairSwapPoint[] {
  const bondingCurveSupply = options?.bondingCurveSupply ?? DEFAULT_BONDING_CURVE_SUPPLY;
  const graduationAmountSol = options?.graduationAmountSol ?? DEFAULT_GRADUATION_AMOUNT_SOL;
  const maxSwaps = options?.maxSwaps ?? 20000;
  const totalSolPerSwap = options?.solPerSwap ?? DEFAULT_SOL_PER_SWAP;

  const creatorSharePct = options?.creatorSharePct ?? 0;
  const platformSharePct = options?.platformSharePct ?? 0;
  const freeTokensSharePct = options?.freeTokensSharePct ?? 0;
  const takenPct = creatorSharePct + platformSharePct + freeTokensSharePct;
  const swapSharePct = Math.max(0, 100 - takenPct);
  const solPerSwap = totalSolPerSwap * (swapSharePct / 100);

  const points: FairSwapPoint[] = [];
  let totalSolRaised = 0;
  let totalTokensMinted = 0;

  let totalTokensDistributed = 0;
  let totalTokensSavedInReserve = 0;
  let totalTokensUsedFromReserve = 0;
  let reserveCumulative = 0;

  const finalPriceSOL = getPricePerTokenInSol(graduationAmountSol, graduationAmountSol, bondingCurveSupply);

  for (let i = 1; i <= maxSwaps; i++) {
    if (totalSolRaised >= graduationAmountSol) break;

    let solIn = solPerSwap;
    if (totalSolRaised + solIn > graduationAmountSol) {
      solIn = graduationAmountSol - totalSolRaised;
    }

    const before = totalSolRaised;
    const after = totalSolRaised + solIn;

    const tokensBefore = tokensAtSol(before, graduationAmountSol, bondingCurveSupply);
    const tokensAfter = tokensAtSol(after, graduationAmountSol, bondingCurveSupply);
    const tokensOutWhole = Math.max(0, tokensAfter - tokensBefore);

    // Cap targets in whole-token units, mirroring the on-chain-style BN math.
    const tokensCapEarly = Math.floor((MAX_EARLY_USER_RETURN * solIn) / finalPriceSOL);
    const tokensCapLater = Math.floor((MAX_LATER_USER_RETURN * solIn) / finalPriceSOL);

    let tokensDistributedFair = 0;
    let tokensSaved = 0;
    let reserveUsed = 0;

    if (tokensOutWhole >= tokensCapEarly) {
      // Early user: cap at MAX_EARLY_USER_RETURN, excess saved to reserve.
      tokensDistributedFair = Math.min(tokensOutWhole, tokensCapEarly);
      tokensSaved = tokensOutWhole - tokensDistributedFair;
    } else {
      // Later user: top up toward MAX_LATER_USER_RETURN using reserve when available.
      const maxFromReserve = tokensOutWhole + reserveCumulative;
      const targetTokens = Math.min(maxFromReserve, tokensCapLater);
      const shortfall = Math.max(0, targetTokens - tokensOutWhole);
      reserveUsed = Math.min(reserveCumulative, shortfall);
      tokensDistributedFair = tokensOutWhole + reserveUsed;
    }

    reserveCumulative = reserveCumulative + tokensSaved - reserveUsed;

    totalSolRaised = after;
    totalTokensMinted = tokensAfter;
    totalTokensDistributed += tokensDistributedFair;
    totalTokensSavedInReserve += tokensSaved;
    totalTokensUsedFromReserve += reserveUsed;

    points.push({
      swapIndex: i,
      totalSolRaised,
      totalTokensMinted,
      totalTokensDistributed,
      totalTokensSavedInReserve,
      totalTokensUsedFromReserve,
      reserveCumulative,
      solIn,
      tokensOutRaw: tokensOutWhole,
      tokensDistributed: tokensDistributedFair,
      tokensSaved,
      reserveUsed,
    });
  }

  return points;
}

