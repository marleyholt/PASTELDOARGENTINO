import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Truck, 
  MapPin, 
  Phone, 
  Navigation, 
  RefreshCw, 
  MessageCircle, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Order, OrderStatus, DriverLocation, StoreConfig } from '../types';

interface OrderTrackerProps {
  orders: Order[];
  config: StoreConfig;
  initialOrderId?: string;
  driverLocations?: Record<string, DriverLocation>;
  onBackToMenu?: () => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  orders,
  config,
  initialOrderId,
  driverLocations = {},
  onBackToMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (initialOrderId) {
      const found = orders.find(o => o.id === initialOrderId);
      return found ? found.numeroSequencial.toString() : '';
    }
    return orders[0]?.numeroSequencial.toString() || '1001';
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(() => {
    if (initialOrderId) {
      return orders.find(o => o.id === initialOrderId) || orders[0] || null;
    }
    return orders[0] || null;
  });

  // Temporizador de contagem regressiva de 60 segundos para atualização do GPS
  const [secondsToRefresh, setSecondsToRefresh] = useState(60);
  const [refreshPulse, setRefreshPulse] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsToRefresh(prev => {
        if (prev <= 1) {
          setRefreshPulse(true);
          setTimeout(() => setRefreshPulse(false), 2000);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Atualizar o selectedOrder se as ordens no estado global mudarem (ex: status avançou no Kanban)
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) {
        setSelectedOrder(updated);
      }
    }
  }, [orders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryTrimmed = searchQuery.trim().replace('#', '');
    const found = orders.find(o => 
      o.numeroSequencial.toString() === queryTrimmed || 
      o.id === queryTrimmed ||
      o.clienteTelefone.includes(queryTrimmed)
    );
    if (found) {
      setSelectedOrder(found);
    } else {
      alert(`Nenhum pedido encontrado com o número #${queryTrimmed}. Verifique o número e tente novamente.`);
    }
  };

  // Status steps
  const steps: { key: OrderStatus; label: string; desc: string; icon: React.ComponentType<any> }[] = [
    { key: 'novo', label: 'Pedido Recebido', desc: 'Confirmado pelo sistema', icon: Clock },
    { key: 'preparando', label: 'Em Preparação', desc: 'Fritando na temperatura ideal', icon: ChefHat },
    { key: 'pronto', label: 'Pronto na Loja', desc: 'Embalado e aguardando motoboy', icon: CheckCircle2 },
    { key: 'em_entrega', label: 'Saiu para Entrega', desc: 'Motoboy em rota até seu endereço', icon: Truck },
    { key: 'entregue', label: 'Entregue', desc: 'Bom apetite!', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'novo': return 0;
      case 'preparando': return 1;
      case 'pronto': return 2;
      case 'em_entrega': return 3;
      case 'entregue': return 4;
      case 'cancelado': return -1;
    }
  };

  const currentStepIndex = selectedOrder ? getStepIndex(selectedOrder.status) : 0;
  const driverLoc = selectedOrder?.entregadorId ? driverLocations[selectedOrder.entregadorId] : undefined;

  // Link para envio de comprovante PIX via WhatsApp
  const generatePixProofWhatsappUrl = (order: Order) => {
    const rawStorePhone = (config.whatsappOficial || config.telefoneContato || '').replace(/\D/g, '');
    const cleanPhone = rawStorePhone.startsWith('55') ? rawStorePhone : `55${rawStorePhone}`;
    const message = `Olá, ${config.nome}! Segue o comprovante de pagamento do PIX referente ao meu Pedido #${order.numeroSequencial} (Valor: R$ ${order.valorTotal.toFixed(2)}).`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Barra de Busca de Pedido */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o número do pedido (ex: 1001, 1002...)"
              className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all"
          >
            Buscar Pedido
          </button>
        </form>
      </div>

      {!selectedOrder ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-xs">
          <Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-stone-800">Acompanhe seu Pedido em Tempo Real</h2>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Digite o número do seu pedido acima para ver o status da cozinha, preparação e a localização do motoboy no mapa.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card de Boas-vindas / Sucesso */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
              <div>
                <span className="bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
                  Status ao Vivo
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 text-white">
                  Pedido #{selectedOrder.numeroSequencial}
                </h1>
                <p className="text-xs text-stone-400 mt-0.5">
                  Cliente: <strong className="text-stone-200">{selectedOrder.clienteNome}</strong> • {selectedOrder.tipoEntrega === 'delivery' ? 'Entrega em Domicílio' : 'Retirada no Balcão'}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-stone-400 block font-semibold">Total a Pagar</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  R$ {selectedOrder.valorTotal.toFixed(2)}
                </span>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedOrder.statusPagamento === 'pago' 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {selectedOrder.statusPagamento === 'pago' ? '✓ Pagamento Confirmado' : 'Pagar na Entrega'}
                </span>
              </div>
            </div>

            {/* Notificação de Disparo do Sistema */}
            <div className="mt-4 flex items-center gap-2 text-xs text-stone-300 bg-stone-800/80 px-3.5 py-2 rounded-xl border border-stone-700/60">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Notificação Automática:</strong> Seu pedido já foi registrado no Kanban da nossa cozinha.
              </span>
            </div>

            {/* Se pagamento for PIX e estiver pendente ou recém-criado, botão de enviar comprovante */}
            {selectedOrder.formaPagamento === 'pix' && (
              <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-emerald-200">
                  <strong className="block text-white font-bold">Pagamento via PIX Selecionado</strong>
                  Envie o comprovante para agilizar o envio do seu pedido.
                </div>
                <a
                  href={generatePixProofWhatsappUrl(selectedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-98 whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar Comprovante do PIX pelo WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Linha do Tempo / Stepper do Pedido */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs">
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider mb-6">
              Etapas de Preparação & Entrega
            </h3>

            <div className="space-y-6">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;

                // Não exibir etapa de motoboy se for retirada
                if (step.key === 'em_entrega' && selectedOrder.tipoEntrega === 'retirada') {
                  return null;
                }

                return (
                  <div key={step.key} className="flex items-start gap-4 relative">
                    {/* Linha conectora */}
                    {idx < steps.length - 1 && (
                      <div className={`absolute left-5 top-10 w-0.5 h-10 -ml-px ${
                        isPassed ? 'bg-emerald-500' : 'bg-stone-200'
                      }`} />
                    )}

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isPassed 
                        ? 'bg-emerald-500 text-white' 
                        : isCurrent 
                        ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-100 animate-pulse' 
                        : 'bg-stone-100 text-stone-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-black ${
                          isCurrent ? 'text-amber-900' : isPassed ? 'text-stone-900' : 'text-stone-400'
                        }`}>
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                            Etapa Atual
                          </span>
                        )}
                        {isPassed && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            ✓ Concluído
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Se estiver 'em_entrega', Mapa e Rastreamento GPS ao Vivo (Atualização a cada 1 minuto) */}
          {selectedOrder.status === 'em_entrega' && selectedOrder.tipoEntrega === 'delivery' && (
            <div className="bg-white border-2 border-purple-400 rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl">
                    <Navigation className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-black text-stone-900 text-base">
                      Motoboy a Caminho da sua Residência
                    </h3>
                    <p className="text-xs text-stone-500">
                      {selectedOrder.entregadorNome ? `Entregador: ${selectedOrder.entregadorNome}` : 'Entregador em trânsito'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-stone-400 block">Próxima atualização GPS</span>
                    <span className="text-xs font-black text-purple-700 font-mono">
                      em {secondsToRefresh}s
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSecondsToRefresh(60);
                      setRefreshPulse(true);
                      setTimeout(() => setRefreshPulse(false), 1500);
                    }}
                    title="Atualizar GPS Agora"
                    className="p-2 text-stone-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshPulse ? 'animate-spin text-purple-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Simulação Visual do Mapa do Rastreamento */}
              <div className="relative h-60 w-full bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 flex items-center justify-center text-center p-4">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:20px_20px]" />
                
                {/* Linha pontilhada de trajeto */}
                <div className="absolute w-2/3 h-1 border-t-2 border-dashed border-amber-400/60 -rotate-6 top-1/2 left-16" />

                {/* Marcador da Pastelaria */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shadow-md">
                    🥟
                  </div>
                  <span className="text-[9px] font-bold text-stone-300 mt-1">Pastelaria</span>
                </div>

                {/* Marcador do Motoboy no trajeto */}
                <div className="relative z-10 flex flex-col items-center animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xl ring-4 ring-purple-400/40">
                    <Truck className="w-6 h-6" />
                  </div>
                  <span className="bg-purple-900/90 text-white text-[10px] font-black px-2 py-0.5 rounded-md mt-1 shadow-sm">
                    Motoboy em Movimento
                  </span>
                  <span className="text-[9px] text-purple-200 mt-0.5 font-mono">
                    Coord: {driverLoc ? `${driverLoc.latitude.toFixed(4)}, ${driverLoc.longitude.toFixed(4)}` : '-23.5505, -46.6333'}
                  </span>
                </div>

                {/* Marcador da Casa do Cliente */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    🏠
                  </div>
                  <span className="text-[9px] font-bold text-stone-300 mt-1">Seu Endereço</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-purple-50/70 p-3 rounded-xl border border-purple-200 text-purple-950">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    <strong>Atualização de GPS a cada 1 minuto:</strong> O sinal do motoboy está conectado e transmitindo.
                  </span>
                </div>
                {selectedOrder.enderecoEntrega && (
                  <span className="font-bold text-stone-700">
                    Destino: {selectedOrder.enderecoEntrega.bairro}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Resumo do Pedido e Endereço */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="font-black text-stone-900 text-sm uppercase tracking-wider">
              Detalhes dos Itens do Pedido
            </h4>

            <div className="divide-y divide-stone-100">
              {selectedOrder.itens.map(item => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-amber-900">{item.quantidade}x</span>{' '}
                    <span className="font-bold text-stone-800">{item.nomeProduto}</span>
                    {item.observacao && (
                      <span className="block text-[11px] text-stone-500 italic mt-0.5">
                        Obs: {item.observacao}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-stone-900">
                    R$ {(item.precoUnitario * item.quantidade).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Endereço de Entrega */}
            {selectedOrder.tipoEntrega === 'delivery' && selectedOrder.enderecoEntrega && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
                <span className="font-black text-stone-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Endereço para Entrega:
                </span>
                <p className="text-stone-700 pl-5">
                  {selectedOrder.enderecoEntrega.logradouro}, nº {selectedOrder.enderecoEntrega.numero}
                  {selectedOrder.enderecoEntrega.complemento ? ` (${selectedOrder.enderecoEntrega.complemento})` : ''} - {selectedOrder.enderecoEntrega.bairro}
                </p>
              </div>
            )}

            {/* Botão de Retornar ao Cardápio */}
            {onBackToMenu && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onBackToMenu}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                >
                  ← Voltar ao Cardápio Digital
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
