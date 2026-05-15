export type Direction = "L" | "S";
export type PositionStatus = "open" | "closed";
export type TradeAction = "BUY" | "SELL" | "SHORT" | "COVER";
export type TransactionAction = "open" | "add" | "trim" | "close";

export interface Position {
  id: string;
  ticker: string;
  direction: Direction;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  entryDate: string;
  sector: string;
  analyst: string;
  thesis: string;
  status: PositionStatus;
  notes: string;
}

export interface Transaction {
  id: string;
  date: string;
  ticker: string;
  direction: Direction;
  action: TransactionAction;
  shares: number;
  price: number;
  cashFlow: number;
  notes: string;
}

export interface PortfolioStats {
  nav: number;
  openingNav: number;
  inceptionReturn: number;
  inceptionReturnPct: number;
  cashBalance: number;
  cashPct: number;
  totalLongValue: number;
  totalShortValue: number;
  grossExposure: number;
  netExposure: number;
  netExposurePct: number;
  longShortRatio: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPct: number;
  openPositions: number;
  longCount: number;
  shortCount: number;
}

export interface PriceMap {
  [ticker: string]: number;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  weight: number;
}
