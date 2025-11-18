
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Asset, Manager, Upgrade, BuyMode, INITIAL_CASH } from './types';
import { INITIAL_ASSETS, INITIAL_MANAGERS, INITIAL_UPGRADES } from './constants';
import { formatMoney, calculateNextCost } from './utils/formatting';
import { AssetCard } from './components/AssetCard';
import { Users, Cog, Building2, Save } from 'lucide-react';

// --- Icons and Layout Helpers ---
const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-bold tracking-wider transition-colors
      ${active ? 'text-orange-500 border-b-2 border-orange-500 bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
    `}
  >
    {icon}
    <span className="mt-1">{label}</span>
  </button>
);

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('idleTycoonSave_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with initial to handle potential schema updates in a real app
        // Ensuring dates/numbers are correct types
        return { ...parsed };
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    return {
      cash: INITIAL_CASH,
      assets: INITIAL_ASSETS,
      managers: INITIAL_MANAGERS,
      upgrades: INITIAL_UPGRADES,
      lastSaveTime: Date.now(),
      startTime: Date.now(),
    };
  });

  const [activeTab, setActiveTab] = useState<'PROPERTIES' | 'CEOS' | 'TECHNOLOGY'>('PROPERTIES');
  const [buyMode, setBuyMode] = useState<BuyMode>(BuyMode.ONE);
  const [now, setNow] = useState(Date.now()); // For forcing re-renders of progress bars

  // Refs for Loop
  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // --- Game Loop ---
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      
      const currentState = stateRef.current;
      let newCash = currentState.cash;
      let assetsChanged = false;
      
      const newAssets = currentState.assets.map(asset => {
        const manager = currentState.managers.find(m => m.targetAssetId === asset.id);
        const hasManager = manager?.owned;
        const incomeMultiplier = currentState.upgrades
            .filter(u => u.owned && (u.targetAssetId === asset.id || u.targetAssetId === 'GLOBAL'))
            .reduce((acc, u) => acc * u.multiplier, 1);
        
        const income = asset.baseIncome * asset.level * incomeMultiplier;

        if (asset.level > 0) {
          // Manager logic: "Auto Production" usually means continuous income per second
          // Manual logic: "Production Time" must elapse
          
          if (hasManager) {
            // Simple income per tick for manager
            // Tick is 100ms. Income per sec = income. Income per tick = income / 10.
            const incomePerTick = income / 10; 
            newCash += incomePerTick;
            return asset;
          } else {
            // Manual logic check
            if (asset.lastProducedTime > 0) {
              const elapsed = currentTime - asset.lastProducedTime;
              if (elapsed >= asset.productionTime) {
                 // Finished producing
                 newCash += income;
                 assetsChanged = true;
                 return { ...asset, lastProducedTime: 0 }; // Reset
              }
            }
          }
        }
        return asset;
      });

      // Auto Save every 10 seconds
      if (currentTime - currentState.lastSaveTime > 10000) {
         localStorage.setItem('idleTycoonSave_v2', JSON.stringify({
             ...currentState,
             cash: newCash,
             assets: assetsChanged ? newAssets : currentState.assets,
             lastSaveTime: currentTime
         }));
         // Update save time in ref implicitly by the setGameState call below
      }

      if (newCash !== currentState.cash || assetsChanged) {
        setGameState(prev => ({
            ...prev,
            cash: newCash,
            assets: assetsChanged ? newAssets : prev.assets,
            lastSaveTime: currentTime - prev.lastSaveTime > 10000 ? currentTime : prev.lastSaveTime
        }));
      }
    }, 100); // 10Hz Tick

    return () => clearInterval(intervalId);
  }, []);

  // --- Actions ---
  
  const handleBuyAsset = useCallback((assetId: string, amount: number, totalCost: number) => {
    setGameState(prev => {
      if (prev.cash < totalCost) return prev;

      const newAssets = prev.assets.map(a => {
        if (a.id === assetId) {
          return { ...a, level: a.level + amount };
        }
        return a;
      });
      
      // Check for unlocks (Unlock next asset if level 1 bought? Or hardcoded?)
      // Logic: If I buy level 1 of asset X, asset X+1 is usually visible but locked until I have cash?
      // Simplified: Unlock next asset if current asset reaches level 10? 
      // Let's just unlock based on cash for next one, or simple chain: Buying 1 unlocks visibility of next.
      // For this clone, let's say buying 1 level of Asset N unlocks Asset N+1
      const currentAssetIndex = newAssets.findIndex(a => a.id === assetId);
      if (currentAssetIndex >= 0 && currentAssetIndex < newAssets.length - 1) {
          if (newAssets[currentAssetIndex].level > 0 && !newAssets[currentAssetIndex + 1].unlocked) {
              newAssets[currentAssetIndex + 1].unlocked = true;
          }
      }

      return {
        ...prev,
        cash: prev.cash - totalCost,
        assets: newAssets
      };
    });
  }, []);

  const handleManualProduce = useCallback((assetId: string) => {
    setGameState(prev => {
      const newAssets = prev.assets.map(a => {
        if (a.id === assetId && a.lastProducedTime === 0) {
          return { ...a, lastProducedTime: Date.now() };
        }
        return a;
      });
      return { ...prev, assets: newAssets };
    });
  }, []);

  const handleBuyManager = useCallback((managerId: string) => {
    setGameState(prev => {
      const mgr = prev.managers.find(m => m.id === managerId);
      if (!mgr || prev.cash < mgr.cost || mgr.owned) return prev;

      return {
        ...prev,
        cash: prev.cash - mgr.cost,
        managers: prev.managers.map(m => m.id === managerId ? { ...m, owned: true } : m)
      };
    });
  }, []);

  const handleBuyUpgrade = useCallback((upgradeId: string) => {
    setGameState(prev => {
      const upg = prev.upgrades.find(u => u.id === upgradeId);
      if (!upg || prev.cash < upg.cost || upg.owned) return prev;

      return {
        ...prev,
        cash: prev.cash - upg.cost,
        upgrades: prev.upgrades.map(u => u.id === upgradeId ? { ...u, owned: true } : u)
      };
    });
  }, []);

  // --- Computed Values for Render ---
  const globalMultiplier = gameState.upgrades
    .filter(u => u.owned && u.targetAssetId === 'GLOBAL')
    .reduce((acc, u) => acc * u.multiplier, 1);

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="flex-none pt-8 pb-4 px-6 bg-gradient-to-b from-gray-900 to-black z-20 shadow-2xl border-b border-white/5">
        <div className="text-gray-400 text-xs font-bold tracking-widest mb-1 uppercase">Net Worth</div>
        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
            {formatMoney(gameState.cash)}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex-none flex border-b border-white/10 bg-black/50 backdrop-blur z-10">
        <TabButton 
            active={activeTab === 'PROPERTIES'} 
            onClick={() => setActiveTab('PROPERTIES')} 
            icon={<Building2 className="w-5 h-5" />} 
            label="ASSETS" 
        />
        <TabButton 
            active={activeTab === 'CEOS'} 
            onClick={() => setActiveTab('CEOS')} 
            icon={<Users className="w-5 h-5" />} 
            label="MANAGERS" 
        />
        <TabButton 
            active={activeTab === 'TECHNOLOGY'} 
            onClick={() => setActiveTab('TECHNOLOGY')} 
            icon={<Cog className="w-5 h-5" />} 
            label="UPGRADES" 
        />
      </nav>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
        {activeTab === 'PROPERTIES' && (
            <div className="max-w-md mx-auto w-full">
                {gameState.assets.map(asset => {
                    const manager = gameState.managers.find(m => m.targetAssetId === asset.id);
                    // Calculate specific multipliers for this asset
                    const assetMultiplier = gameState.upgrades
                        .filter(u => u.owned && u.targetAssetId === asset.id)
                        .reduce((acc, u) => acc * u.multiplier, 1);

                    if (!asset.unlocked) {
                        // Only show unlocked or the very next locked one
                        const prevAsset = gameState.assets.find((_, i, arr) => arr[i+1]?.id === asset.id);
                        if (prevAsset && prevAsset.level === 0) return null; 
                    }
                    
                    return (
                        <AssetCard 
                            key={asset.id}
                            asset={asset}
                            money={gameState.cash}
                            buyMode={buyMode}
                            onBuy={handleBuyAsset}
                            onProduce={handleManualProduce}
                            manager={manager}
                            globalMultiplier={globalMultiplier}
                            assetMultiplier={assetMultiplier}
                        />
                    );
                })}
                <div className="h-12"></div>
            </div>
        )}

        {activeTab === 'CEOS' && (
            <div className="max-w-md mx-auto w-full space-y-3">
                {gameState.managers.map(manager => (
                    <div key={manager.id} className={`
                        p-4 rounded-xl border flex items-center justify-between
                        ${manager.owned ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-900/40 border-white/10'}
                    `}>
                        <div>
                            <h4 className="font-bold text-gray-100">{manager.name}</h4>
                            <p className="text-xs text-gray-400 mt-1">{manager.description}</p>
                        </div>
                        {manager.owned ? (
                            <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded uppercase border border-green-500/30">
                                Hired
                            </div>
                        ) : (
                            <button
                                disabled={gameState.cash < manager.cost}
                                onClick={() => handleBuyManager(manager.id)}
                                className={`
                                    px-4 py-2 rounded-lg font-bold text-sm min-w-[100px]
                                    ${gameState.cash >= manager.cost 
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                                `}
                            >
                                {formatMoney(manager.cost)}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'TECHNOLOGY' && (
            <div className="max-w-md mx-auto w-full space-y-3">
                 {gameState.upgrades.map(upgrade => (
                    <div key={upgrade.id} className={`
                        p-4 rounded-xl border flex items-center justify-between
                        ${upgrade.owned ? 'bg-purple-900/20 border-purple-500/30' : 'bg-gray-900/40 border-white/10'}
                    `}>
                        <div>
                            <h4 className="font-bold text-gray-100">{upgrade.name}</h4>
                            <p className="text-xs text-gray-400 mt-1">{upgrade.description}</p>
                        </div>
                        {upgrade.owned ? (
                            <div className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded uppercase border border-purple-500/30">
                                Installed
                            </div>
                        ) : (
                            <button
                                disabled={gameState.cash < upgrade.cost}
                                onClick={() => handleBuyUpgrade(upgrade.id)}
                                className={`
                                    px-4 py-2 rounded-lg font-bold text-sm min-w-[100px]
                                    ${gameState.cash >= upgrade.cost 
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                                `}
                            >
                                {formatMoney(upgrade.cost)}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}
      </main>

      {/* Sticky Footer Controls (Only on Properties) */}
      {activeTab === 'PROPERTIES' && (
        <footer className="flex-none p-4 bg-black/80 backdrop-blur-lg border-t border-white/10 pb-8 safe-area-pb">
           <div className="max-w-md mx-auto grid grid-cols-3 gap-2 bg-gray-900/50 p-1 rounded-xl border border-white/5">
               {[
                   { label: '1x', value: BuyMode.ONE },
                   { label: '10x', value: BuyMode.TEN },
                   { label: 'MAX', value: BuyMode.MAX }
               ].map(opt => (
                   <button
                       key={opt.label}
                       onClick={() => setBuyMode(opt.value)}
                       className={`
                           py-2 rounded-lg text-sm font-bold transition-all
                           ${buyMode === opt.value 
                               ? 'bg-orange-500 text-white shadow-lg' 
                               : 'text-gray-400 hover:bg-white/5'}
                       `}
                   >
                       {opt.label}
                   </button>
               ))}
           </div>
        </footer>
      )}
    </div>
  );
};

export default App;
