import { Asset, Manager, Upgrade } from './types';

export const INITIAL_ASSETS: Asset[] = [
  { id: 'gas_royalties', name: 'Gas Royalties', baseCost: 10, baseIncome: 1, level: 0, unlocked: true, productionTime: 1000, lastProducedTime: 0 },
  { id: 'oil_royalties', name: 'Oil Royalties', baseCost: 100, baseIncome: 5, level: 0, unlocked: false, productionTime: 2000, lastProducedTime: 0 },
  { id: 'gas_well', name: 'Gas Well', baseCost: 1000, baseIncome: 20, level: 0, unlocked: false, productionTime: 4000, lastProducedTime: 0 },
  { id: 'oil_well', name: 'Oil Well', baseCost: 10000, baseIncome: 100, level: 0, unlocked: false, productionTime: 8000, lastProducedTime: 0 },
  { id: 'oil_sands', name: 'Oil Sands', baseCost: 100000, baseIncome: 500, level: 0, unlocked: false, productionTime: 12000, lastProducedTime: 0 },
  { id: 'shale_play', name: 'Shale Play', baseCost: 1000000, baseIncome: 2000, level: 0, unlocked: false, productionTime: 20000, lastProducedTime: 0 },
  { id: 'omani_field', name: 'Omani Field', baseCost: 20000000, baseIncome: 10000, level: 0, unlocked: false, productionTime: 30000, lastProducedTime: 0 },
];

export const INITIAL_MANAGERS: Manager[] = [
  { id: 'mgr_gas_royalties', name: 'J. Ewing', targetAssetId: 'gas_royalties', cost: 500, owned: false, description: 'Auto-run Gas Royalties' },
  { id: 'mgr_oil_royalties', name: 'D. Plainview', targetAssetId: 'oil_royalties', cost: 5000, owned: false, description: 'Auto-run Oil Royalties' },
  { id: 'mgr_gas_well', name: 'R. Rich', targetAssetId: 'gas_well', cost: 25000, owned: false, description: 'Auto-run Gas Well' },
  { id: 'mgr_oil_well', name: 'M. Burns', targetAssetId: 'oil_well', cost: 100000, owned: false, description: 'Auto-run Oil Well' },
  { id: 'mgr_oil_sands', name: 'L. Luthor', targetAssetId: 'oil_sands', cost: 500000, owned: false, description: 'Auto-run Oil Sands' },
  { id: 'mgr_shale', name: 'G. Gekko', targetAssetId: 'shale_play', cost: 5000000, owned: false, description: 'Auto-run Shale Play' },
  { id: 'mgr_omani', name: 'T. Stark', targetAssetId: 'omani_field', cost: 100000000, owned: false, description: 'Auto-run Omani Field' },
];

export const INITIAL_UPGRADES: Upgrade[] = [
  { id: 'upg_drill_1', name: 'Carbide Drills', targetAssetId: 'gas_royalties', cost: 2000, multiplier: 3, owned: false, description: 'Gas Royalties profit x3' },
  { id: 'upg_pump_1', name: 'High Pressure Pumps', targetAssetId: 'oil_royalties', cost: 10000, multiplier: 3, owned: false, description: 'Oil Royalties profit x3' },
  { id: 'upg_frack_1', name: 'Hydraulic Fracking', targetAssetId: 'gas_well', cost: 50000, multiplier: 3, owned: false, description: 'Gas Well profit x3' },
  { id: 'upg_offshore', name: 'Offshore Logistics', targetAssetId: 'oil_well', cost: 250000, multiplier: 3, owned: false, description: 'Oil Well profit x3' },
  { id: 'upg_refinery', name: 'Efficient Refinery', targetAssetId: 'GLOBAL', cost: 10000000, multiplier: 1.5, owned: false, description: 'All income x1.5' },
];
