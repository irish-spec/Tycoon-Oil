
export enum BuyMode {
  ONE = 1,
  TEN = 10,
  MAX = 'MAX'
}

export interface Asset {
  id: string;
  name: string;
  baseCost: number;
  baseIncome: number;
  level: number;
  unlocked: boolean;
  productionTime: number; // in ms
  lastProducedTime: number;
}

export interface Manager {
  id: string;
  name: string;
  targetAssetId: string;
  cost: number;
  owned: boolean;
  description: string;
}

export interface Upgrade {
  id: string;
  name: string;
  targetAssetId: string; // 'GLOBAL' for all
  cost: number;
  multiplier: number;
  owned: boolean;
  description: string;
}

export interface GameState {
  cash: number;
  assets: Asset[];
  managers: Manager[];
  upgrades: Upgrade[];
  lastSaveTime: number;
  startTime: number;
}

export const INITIAL_CASH = 10;
