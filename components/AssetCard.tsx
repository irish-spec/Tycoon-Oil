import React, { useMemo } from 'react';
import { Asset, BuyMode, Manager, Upgrade } from '../types';
import { calculateNextCost, calculateMaxBuy, formatMoney } from '../utils/formatting';
import { ProgressBar } from './ProgressBar';
import { Pickaxe, Droplet, Factory, Flame, Mountain, Building2, Globe } from 'lucide-react';

interface AssetCardProps {
  asset: Asset;
  money: number;
  buyMode: BuyMode;
  onBuy: (assetId: string, amount: number, cost: number) => void;
  onProduce: (assetId: string) => void;
  manager: Manager | undefined;
  globalMultiplier: number;
  assetMultiplier: number;
}

const ICONS: Record<string, React.ReactNode> = {
  'gas_royalties': <Flame className="w-6 h-6 text-orange-400" />,
  'oil_royalties': <Droplet className="w-6 h-6 text-black fill-black" />,
  'gas_well': <Pickaxe className="w-6 h-6 text-gray-400" />,
  'oil_well': <Factory className="w-6 h-6 text-yellow-600" />,
  'oil_sands': <Mountain className="w-6 h-6 text-amber-700" />,
  'shale_play': <Building2 className="w-6 h-6 text-blue-400" />,
  'omani_field': <Globe className="w-6 h-6 text-emerald-400" />,
};

export const AssetCard: React.FC<AssetCardProps> = ({ 
  asset, 
  money, 
  buyMode, 
  onBuy, 
  onProduce,
  manager,
  globalMultiplier,
  assetMultiplier
}) => {
  // Calculate effective buy amount and cost
  const { amountToBuy, cost } = useMemo(() => {
    let count = 1;
    if (buyMode === BuyMode.TEN) count = 10;
    if (buyMode === BuyMode.MAX) {
      count = calculateMaxBuy(asset.baseCost, asset.level, money);
      if (count === 0 && money >= calculateNextCost(asset.baseCost, asset.level, 1)) {
        // If max is 0 but we can afford 1, UI often shows 1 but disabled style logic handles it
        count = 1; // Fallback for calculation display
      }
    }

    // Ensure at least 1 for cost calculation display
    const safeCount = Math.max(1, count);
    const calculatedCost = calculateNextCost(asset.baseCost, asset.level, safeCount);
    
    return { amountToBuy: safeCount, cost: calculatedCost };
  }, [asset.baseCost, asset.level, money, buyMode]);

  const canAfford = money >= cost;
  const isMaxZero = buyMode === BuyMode.MAX && calculateMaxBuy(asset.baseCost, asset.level, money) === 0;
  
  // Income calculation
  const currentIncome = asset.baseIncome * asset.level * globalMultiplier * assetMultiplier;
  
  // Progress Calculation
  // We rely on parent loop, but for visual we check time.
  // Actually, in React for high freq, CSS transition is smoother.
  // Here we calculate percentage based on lastProducedTime.
  const now = Date.now();
  let progress = 0;
  const isProducing = asset.lastProducedTime > 0 && (now - asset.lastProducedTime) < asset.productionTime;
  
  if (isProducing) {
      // This will be jittery if not handled by a frame loop in parent or CSS animation.
      // For this specific component, we pass props. Ideally, the progress bar handles its own internal tick if we want ultra smooth,
      // but we will rely on parent re-renders for simplicity or CSS.
      // Let's assume the parent passes a 'now' prop or we calculate it.
      // To make it smooth, we use a CSS animation keyframe approach or a simple style width.
      const elapsed = now - asset.lastProducedTime;
      progress = Math.min(100, (elapsed / asset.productionTime) * 100);
  } else if (manager && manager.owned && asset.level > 0) {
      // If manager is owned, it's effectively always running or instant
      progress = 0; // It loops instantly
  }

  // Special visual case: If manager is owned, animate via CSS class endlessly
  const hasManager = manager?.owned;

  return (
    <div className={`
      relative p-4 mb-3 rounded-xl border transition-all duration-200
      ${asset.unlocked ? 'bg-white/5 border-white/10' : 'bg-black/40 border-white/5 opacity-50 grayscale'}
      backdrop-blur-md shadow-lg
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 shadow-inner border border-white/5">
                {ICONS[asset.id] || <Factory className="w-6 h-6 text-white" />}
            </div>
            <div>
                <h3 className="font-bold text-lg text-gray-100">{asset.name}</h3>
                <div className="text-xs text-green-400 font-mono">
                    {formatMoney(currentIncome)} / sec
                </div>
            </div>
        </div>
        <div className="text-right">
            <div className="text-2xl font-bold text-gray-200">{asset.level}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Level</div>
        </div>
      </div>

      {/* Progress Bar */}
      {asset.unlocked && (
        <div 
            className="relative h-2 bg-gray-800 rounded-full overflow-hidden mb-3 cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => !hasManager && asset.level > 0 && !isProducing && onProduce(asset.id)}
        >
            {/* Background text cue */}
            {!hasManager && !isProducing && asset.level > 0 && (
                 <div className="absolute inset-0 flex items-center justify-center text-[9px] text-gray-500 font-bold z-10 pointer-events-none select-none">
                    TAP TO WORK
                 </div>
            )}
            
            <div 
                className={`absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-300 transition-all duration-75 ease-linear ${hasManager ? 'animate-progress-infinite' : ''}`}
                style={{ 
                    width: hasManager ? '100%' : `${progress}%`,
                    animationDuration: hasManager ? `${Math.max(0.2, asset.productionTime / 1000)}s` : '0s'
                }}
            />
        </div>
      )}

      {/* Buy Button */}
      <button
        disabled={!asset.unlocked || !canAfford || (buyMode === BuyMode.MAX && isMaxZero)}
        onClick={() => onBuy(asset.id, amountToBuy, cost)}
        className={`
          w-full py-3 px-4 rounded-lg font-bold flex items-center justify-between transition-all
          ${(!asset.unlocked || !canAfford || isMaxZero)
            ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-transparent' 
            : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-500 hover:to-orange-400 border-t border-white/20 shadow-lg active:translate-y-0.5'}
        `}
      >
        <span className="text-sm font-medium">
            {buyMode === BuyMode.MAX ? `Buy Max (+${amountToBuy})` : `Buy x${amountToBuy}`}
        </span>
        <span className={`font-mono ${canAfford ? 'text-white' : 'text-red-400'}`}>
          {formatMoney(cost)}
        </span>
      </button>
      
      <style>{`
        @keyframes progress-infinite {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress-infinite {
          animation-name: progress-infinite;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};
