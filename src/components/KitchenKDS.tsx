import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, AlertTriangle, Check, Bell } from 'lucide-react';
import { Order } from '../types';
import { OrderSyncIndicator } from './OrderSyncIndicator';

interface KitchenKDSProps {
  orders: Order[];
  onSetReady: (orderId: string) => void;
  secondsRemaining?: number;
  isChecking?: boolean;
  onForceCheck?: () => void;
}

export const KitchenKDS: React.FC<KitchenKDSProps> = ({ 
  orders, 
  onSetReady,
  secondsRemaining = 15,
  isChecking = false,
  onForceCheck = () => {},
}) => {
  // Filtrar apenas os pedidos que estão em produção ou novos
  const kitchenOrders = orders.filter(o => o.status === 'preparando' || o.status === 'novo');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItemCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-stone-900 text-white p-4 rounded-2xl shadow-md border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-stone-950 rounded-xl">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
              KDS - Display de Produção da Cozinha
            </h1>
            <p className="text-xs text-stone-400">
              Tela com atualização automática a cada 15s para novos pedidos e despachos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Indicador de 15 segundos da cozinha */}
          <OrderSyncIndicator
            secondsRemaining={secondsRemaining}
            isChecking={isChecking}
            onForceCheck={onForceCheck}
            variant="dark"
          />

          <div className="bg-stone-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-400 border border-stone-700">
            {kitchenOrders.length} PEDIDOS EM FILA
          </div>
        </div>
      </div>

      {kitchenOrders.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-xs">
          <ChefHat className="w-16 h-16 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-700">Cozinha em Dia!</h3>
          <p className="text-xs text-stone-500">Nenhum pastel pendente de fritura no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kitchenOrders.map(order => {
            const elapsedMinutes = Math.floor((Date.now() - new Date(order.criadoEm).getTime()) / 60000);
            const isDelayed = elapsedMinutes > 20;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border-2 shadow-md flex flex-col justify-between overflow-hidden ${
                  isDelayed ? 'border-red-500' : 'border-stone-300'
                }`}
              >
                {/* Topo do Ticket */}
                <div className={`p-4 text-white flex items-center justify-between ${
                  isDelayed ? 'bg-red-600' : 'bg-stone-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight">
                      #{order.numeroSequencial}
                    </span>
                    <span className="text-xs uppercase bg-white/20 px-2 py-0.5 rounded-md font-bold">
                      {order.tipoEntrega === 'delivery' ? 'Entrega' : 'Balcão'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono font-bold bg-black/30 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMinutes} min atrás</span>
                  </div>
                </div>

                {/* Cliente */}
                <div className="px-4 py-2 bg-stone-100 border-b border-stone-200 text-xs font-semibold text-stone-700">
                  Cliente: <strong>{order.clienteNome}</strong>
                </div>

                {/* Observação Geral */}
                {order.observacoesGerais && (
                  <div className="mx-4 mt-3 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>ATENÇÃO: {order.observacoesGerais}</span>
                  </div>
                )}

                {/* Lista de Itens do Pedido */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                  {order.itens.map((item, idx) => {
                    const itemKey = `${order.id}-${item.id}-${idx}`;
                    const isChecked = checkedItems[itemKey];

                    return (
                      <div
                        key={itemKey}
                        onClick={() => toggleItemCheck(itemKey)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all select-none ${
                          isChecked
                            ? 'bg-emerald-50/50 border-emerald-300 opacity-60'
                            : 'bg-stone-50 border-stone-200 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={!!isChecked}
                              onChange={() => {}}
                              className="mt-1 w-4 h-4 text-emerald-600 rounded border-stone-300"
                            />
                            <div>
                              <span className={`text-base font-black ${isChecked ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                                {item.quantidade}x {item.nomeProduto}
                              </span>
                              
                              {/* Adicionais / Bordas */}
                              {item.adicionais && item.adicionais.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.adicionais.map((extra, eIdx) => (
                                    <span
                                      key={eIdx}
                                      className="inline-block bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-md mr-1"
                                    >
                                      + {extra.nome}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Observação individual */}
                              {item.observacao && (
                                <div className="mt-1 bg-red-100 text-red-900 font-bold text-xs px-2 py-0.5 rounded-md inline-block">
                                  ⚠️ {item.observacao}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botão de Finalizar Fritura / Pronto */}
                <div className="p-4 border-t border-stone-200 bg-stone-50">
                  <button
                    onClick={() => onSetReady(order.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-md text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-transform active:scale-98"
                  >
                    <Check className="w-5 h-5" />
                    Pastel Pronto / Despachar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
