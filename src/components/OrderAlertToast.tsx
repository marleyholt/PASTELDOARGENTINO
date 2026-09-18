import React, { useEffect } from 'react';
import { Bell, ChefHat, Truck, X, Sparkles } from 'lucide-react';

export interface OrderNotification {
  id: string;
  type: 'new' | 'kitchen_done' | 'delivered';
  title: string;
  description: string;
  timestamp: number;
}

interface OrderAlertToastProps {
  notification: OrderNotification | null;
  onDismiss: () => void;
}

export const OrderAlertToast: React.FC<OrderAlertToastProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6500);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const getStyle = () => {
    switch (notification.type) {
      case 'new':
        return {
          bg: 'bg-amber-600 text-white border-amber-500 shadow-amber-900/20',
          iconBg: 'bg-white text-amber-600',
          icon: Bell,
        };
      case 'kitchen_done':
        return {
          bg: 'bg-orange-600 text-white border-orange-500 shadow-orange-900/20',
          iconBg: 'bg-white text-orange-600',
          icon: ChefHat,
        };
      case 'delivered':
        return {
          bg: 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20',
          iconBg: 'bg-white text-emerald-600',
          icon: Truck,
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <div
      id="order-alert-toast"
      className="fixed top-20 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3.5 ${style.bg}`}>
        <div className={`p-2 rounded-xl shrink-0 ${style.iconBg}`}>
          <Icon className="w-5 h-5 animate-bounce" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-black tracking-tight">{notification.title}</h4>
            <span className="text-[10px] font-mono opacity-80 font-semibold">agora</span>
          </div>
          <p className="text-xs mt-0.5 opacity-95 leading-relaxed font-medium">{notification.description}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-black/15 text-white/80 hover:text-white transition-colors shrink-0"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
