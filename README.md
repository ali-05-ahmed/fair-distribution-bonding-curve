# Token-Sim Distribution Frontend

This is a minimal Next.js frontend that visualizes **fair vs unfair token distributions** for your bonding curve simulations.

## What it shows

- **Unfair distribution graph**: effective return multiple from the raw bonding curve (similar to `bondingCurve.graduation.test.ts`).
- **Fair distribution graph**: effective return multiple when applying the reserve-based scheme from `bondingCurve.graduation_retain.test.ts`.
- **Reserve graph**: how the protocol reserve accumulates from early swaps and is spent to top up later users.

The simulation logic in `app/lib/distributionSimulation.ts` mirrors the graduation tests but is implemented in a browser-friendly, dependency-light way using plain numbers.

## Running locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the UI at:

```text
http://localhost:3000
```

You will see the **fair** and **unfair** distribution curves plotted against total SOL raised up to graduation.

