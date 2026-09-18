import React from 'react';
import { RefreshCw, Clock, CheckCircle2, ChefHat, Truck, Bell } from 'lucide-react';

interface OrderSyncIndicatorProps {
  secondsRemaining: number;
  isChecking: boolean;
  onForceCheck: () => void;
  variant?: 'light' | 'dark';
}

export const OrderSyncIndicator: React.FC<OrderSyncIndicatorProps> = ({
  secondsRemaining,
  isChecking,
  onForceCheck,
  variant = 'light',
}) => {
  const isDark = variant === 'dark';

  return (
    <div
      id="order-sync-indicator"
      className={`flex flex-wrap items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-all ${
        isDark 
          ? 'bg-stone-800/90 border-stone-700 text-stone-200' 
          : 'bg-white border-stone-200 text-stone-700'
      }`}
    >
      {/* Indicador de pulso verde com timer de 15s */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="font-mono font-bold text-[11px]">
          {isChecking ? (
            <span className="text-amber-500 animate-pulse">Checando Firestore...</span>
          ) : (
            <span>Auto-check em <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{secondsRemaining}s</strong></span>
          )}
        </span>
      </div>

      {/* Badges dos 3 critérios vigiados */}
      <div className="hidden md:flex items-center gap-1.5 text-[10px] text-stone-500">
        <span className="h-3 w-px bg-stone-300 dark:bg-stone-700" />
        <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-300 font-medium">
          <Bell className="w-3 h-3" /> Novos Pedidos
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-0.5 text-orange-700 dark:text-orange-300 font-medium">
          <ChefHat className="w-3 h-3" /> Saída Cozinha
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-0.5 text-purple-700 dark:text-purple-300 font-medium">
          <Truck className="w-3 h-3" /> Entrega Motoboy
        </span>
      </div>

      {/* Botão para forçar checagem imediata */}
      <button
        id="btn-force-check-orders"
        type="button"
        onClick={onForceCheck}
        disabled={isChecking}
        title="Verificar banco de dados agora sem esperar os 15 segundos"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
          isDark
            ? 'bg-stone-700 hover:bg-stone-600 text-amber-300 disabled:opacity-50'
            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 disabled:opacity-50'
        }`}
      >
        <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-amber-500' : ''}`} />
        <span>Checar Agora</span>
      </button>
    </div>
  );
};
