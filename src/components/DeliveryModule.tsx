import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Phone, 
  CheckCircle, 
  DollarSign, 
  Clock, 
  User, 
  ExternalLink,
  ShieldAlert,
  Compass,
  Radio,
  RefreshCw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Edit3,
  Bot,
  AlertCircle
} from 'lucide-react';
import { Order, DriverLocation, AppProfile, DeliveryDriver } from '../types';
import { optimizeDeliveryRoute, OptimizedRouteResult } from '../lib/routeOptimizer';

interface DeliveryModuleProps {
  orders: Order[];
  onMarkDelivered: (orderId: string) => void;
  driverId?: string;
  driverName?: string;
  onUpdateDriverLocation?: (location: DriverLocation) => void;
  currentRole?: AppProfile;
  drivers?: DeliveryDriver[];
  onUpdateOrderPriority?: (orderId: string, priority: number, observation?: string) => void;
  onApplyOptimizedRoute?: (optimizedOrders: Order[]) => void;
  storeAddress?: string;
}

export const DeliveryModule: React.FC<DeliveryModuleProps> = ({ 
  orders, 
  onMarkDelivered,
  driverId = 'drv-1',
  driverName = 'Carlos Entregador',
  onUpdateDriverLocation,
  currentRole = 'motoboy',
  drivers = [],
  onUpdateOrderPriority,
  onApplyOptimizedRoute,
  storeAddress = 'Av. Paulista, 1500 - Bela Vista'
}) => {
  const [filter, setFilter] = useState<'ativos' | 'entregues'>('ativos');
  const [selectedAdminDriverId, setSelectedAdminDriverId] = useState<string>(driverId || 'all');
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy: number; time: string } | null>(null);

  // Estados da IA de Otimização de Rota
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiRouteModal, setAiRouteModal] = useState<OptimizedRouteResult | null>(null);

  // Modal para editar observação de entrega
  const [editingObsOrderId, setEditingObsOrderId] = useState<string | null>(null);
  const [tempObsValue, setTempObsValue] = useState<string>('');

  const isAdmin = currentRole === 'admin';

  // Filtra pedidos de delivery
  const allDeliveryOrders = orders.filter(o => o.tipoEntrega === 'delivery');

  // Se for motoboy, mostra APENAS os pedidos atribuídos ao seu registro / ID
  // Se for admin, filtra pelo motoboy selecionado na aba ou exibe todos
  const filteredByDriver = allDeliveryOrders.filter(order => {
    if (!isAdmin) {
      // Motoboy só pode ver o que está com o ID dele
      return order.entregadorId === driverId;
    }
    if (selectedAdminDriverId === 'all') return true;
    return order.entregadorId === selectedAdminDriverId;
  });

  const activeDeliveries = filteredByDriver.filter(o => o.status === 'em_entrega' || o.status === 'pronto');
  const finishedDeliveries = filteredByDriver.filter(o => o.status === 'entregue');

  // Ordena os pedidos ativos pela prioridade definida (1º, 2º, 3º...) ou pela data de criação
  const sortedActiveDeliveries = [...activeDeliveries].sort((a, b) => {
    const prioA = a.prioridadeEntrega ?? 999;
    const prioB = b.prioridadeEntrega ?? 999;
    if (prioA !== prioB) return prioA - prioB;
    return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
  });

  const displayedList = filter === 'ativos' ? sortedActiveDeliveries : finishedDeliveries;

  // Ativação e Rastreamento de GPS
  const handleEnableGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Seu navegador ou aparelho não suporta Geolocalização por GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 10),
          time: new Date().toLocaleTimeString('pt-BR'),
        };
        setCurrentCoords(coords);
        setGpsActive(true);
        setGpsError(null);

        if (onUpdateDriverLocation) {
          onUpdateDriverLocation({
            entregadorId: driverId,
            entregadorNome: driverName,
            latitude: coords.lat,
            longitude: coords.lng,
            velocidade: position.coords.speed || 30,
            precisao: coords.accuracy,
            ultimaAtualizacao: new Date().toISOString(),
            ativo: true,
          });
        }
      },
      (err) => {
        console.warn('GPS error:', err.message);
        const simulatedCoords = {
          lat: -23.550520,
          lng: -46.633308,
          accuracy: 5,
          time: new Date().toLocaleTimeString('pt-BR'),
        };
        setCurrentCoords(simulatedCoords);
        setGpsActive(true);
        setGpsError('Modo GPS Simulado ativo (permissão de teste na pré-visualização).');

        if (onUpdateDriverLocation) {
          onUpdateDriverLocation({
            entregadorId: driverId,
            entregadorNome: driverName,
            latitude: simulatedCoords.lat,
            longitude: simulatedCoords.lng,
            velocidade: 28,
            precisao: simulatedCoords.accuracy,
            ultimaAtualizacao: new Date().toISOString(),
            ativo: true,
          });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Simular pequenos deslocamentos a cada 30 segundos se o GPS estiver ligado
  useEffect(() => {
    if (!gpsActive) return;

    const interval = setInterval(() => {
      setCurrentCoords(prev => {
        if (!prev) return null;
        const deltaLat = (Math.random() - 0.5) * 0.001;
        const deltaLng = (Math.random() - 0.5) * 0.001;
        const newCoords = {
          lat: prev.lat + deltaLat,
          lng: prev.lng + deltaLng,
          accuracy: prev.accuracy,
          time: new Date().toLocaleTimeString('pt-BR'),
        };

        if (onUpdateDriverLocation) {
          onUpdateDriverLocation({
            entregadorId: driverId,
            entregadorNome: driverName,
            latitude: newCoords.lat,
            longitude: newCoords.lng,
            velocidade: 25 + Math.floor(Math.random() * 15),
            precisao: newCoords.accuracy,
            ultimaAtualizacao: new Date().toISOString(),
            ativo: true,
          });
        }
        return newCoords;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [gpsActive, driverId, driverName, onUpdateDriverLocation]);

  const openGoogleMapsRoute = (order: Order) => {
    if (!order.enderecoEntrega) return;
    const { logradouro, numero, bairro, cidade } = order.enderecoEntrega;
    const destination = `${logradouro}, ${numero}, ${bairro}, ${cidade || 'Brasil'}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
  };

  // Otimização de Rota com IA
  const handleOptimizeWithAI = async () => {
    setIsOptimizing(true);
    try {
      const activeToOptimize = activeDeliveries;
      const targetDriverName = isAdmin
        ? (drivers.find(d => d.id === selectedAdminDriverId)?.nome || 'Entregador')
        : driverName;

      const result = await optimizeDeliveryRoute(activeToOptimize, targetDriverName, storeAddress);
      setAiRouteModal(result);
    } catch (e) {
      console.error('Erro na IA de rotas:', e);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Confirmar aplicação da rota sugerida pela IA
  const handleConfirmAiRoute = () => {
    if (!aiRouteModal || !onApplyOptimizedRoute) return;
    onApplyOptimizedRoute(aiRouteModal.pedidosOrdenados);
    setAiRouteModal(null);
  };

  // Alterar prioridade manualmente (subir / descer)
  const handleShiftPriority = (orderId: string, direction: 'up' | 'down') => {
    if (!onUpdateOrderPriority) return;
    const currentIndex = sortedActiveDeliveries.findIndex(o => o.id === orderId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedActiveDeliveries.length) return;

    const currentOrder = sortedActiveDeliveries[currentIndex];
    const targetOrder = sortedActiveDeliveries[targetIndex];

    const currentPrio = currentOrder.prioridadeEntrega ?? (currentIndex + 1);
    const targetPrio = targetOrder.prioridadeEntrega ?? (targetIndex + 1);

    onUpdateOrderPriority(currentOrder.id, targetPrio, currentOrder.observacaoEntrega);
    onUpdateOrderPriority(targetOrder.id, currentPrio, targetOrder.observacaoEntrega);
  };

  // Salvar observação específica de entrega
  const handleSaveObservation = (orderId: string) => {
    if (onUpdateOrderPriority) {
      const order = sortedActiveDeliveries.find(o => o.id === orderId);
      const currentPrio = order?.prioridadeEntrega ?? 1;
      onUpdateOrderPriority(orderId, currentPrio, tempObsValue.trim());
    }
    setEditingObsOrderId(null);
    setTempObsValue('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Topo do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-stone-900 text-white p-5 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-stone-950 rounded-xl shadow-xs">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black uppercase tracking-wider">
                {isAdmin ? 'Gestão de Entregas & Rotas' : 'Painel do Entregador'}
              </h1>
              <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                {isAdmin ? 'Modo Administrador' : driverName}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              {isAdmin 
                ? 'Defina a ordem de entrega, observações e otimize rotas com IA.'
                : 'Acompanhe apenas os seus pedidos atribuídos com rota no Google Maps.'}
            </p>
          </div>
        </div>

        {/* Abas Ativos / Histórico */}
        <div className="flex bg-stone-800 p-1 rounded-xl border border-stone-700">
          <button
            onClick={() => setFilter('ativos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'ativos' ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:text-white'
            }`}
          >
            Em Rota ({activeDeliveries.length})
          </button>
          <button
            onClick={() => setFilter('entregues')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'entregues' ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:text-white'
            }`}
          >
            Concluídos ({finishedDeliveries.length})
          </button>
        </div>
      </div>

      {/* Seletor de Motoboys para o Administrador */}
      {isAdmin && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Filtrar por Motoboy:
            </span>
            <select
              value={selectedAdminDriverId}
              onChange={(e) => setSelectedAdminDriverId(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">🛵 Todos os Entregadores ({allDeliveryOrders.length} pedidos)</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.nome} (Reg #{d.codigoRegistro || d.id.replace('drv-', '')})
                </option>
              ))}
            </select>
          </div>

          {/* Botão de Otimizar Rota com IA */}
          {activeDeliveries.length > 0 && (
            <button
              type="button"
              onClick={handleOptimizeWithAI}
              disabled={isOptimizing}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 disabled:opacity-50"
            >
              {isOptimizing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>{isOptimizing ? 'Calculando Rota...' : 'Otimizar Ordem de Entrega com IA'}</span>
            </button>
          )}
        </div>
      )}

      {/* Alerta de Obrigatoriedade do GPS para o Motoboy */}
      {!isAdmin && !gpsActive && (
        <div className="bg-amber-500/15 border-2 border-amber-500 rounded-2xl p-5 mb-6 text-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
              <Compass className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="font-black text-stone-950 text-sm">
                Compartilhamento de GPS em Tempo Real
              </h3>
              <p className="text-xs text-stone-700 mt-0.5">
                Para que o cliente acompanhe a sua aproximação no mapa ao vivo, ative a transmissão de GPS do seu aparelho.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnableGps}
            className="w-full sm:w-auto bg-stone-950 hover:bg-stone-800 text-amber-400 font-black text-xs px-5 py-3 rounded-xl shadow-md whitespace-nowrap transition-transform active:scale-98 flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            Ativar e Transmitir GPS
          </button>
        </div>
      )}

      {gpsActive && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 mb-6 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-black">GPS Ativo:</span>
            <span className="font-mono text-[11px] text-emerald-700">
              {currentCoords?.lat.toFixed(5)}, {currentCoords?.lng.toFixed(5)} • Último sinal: {currentCoords?.time}
            </span>
          </div>
          <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
            Transmitindo
          </span>
        </div>
      )}

      {/* Lista de Pedidos */}
      {displayedList.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl shadow-xs">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-2xl">
            🛵
          </div>
          <h3 className="text-lg font-bold text-stone-800">
            {filter === 'ativos' ? 'Nenhuma entrega pendente' : 'Nenhuma entrega concluída ainda'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            {!isAdmin 
              ? 'Não há pedidos atribuídos ao seu registro no momento. Assim que a pastelaria despachar um pedido para você, ele aparecerá aqui com rota no Google Maps.'
              : 'Selecione outro motoboy ou aguarde novos pedidos saírem da cozinha.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map((order, index) => {
            const isDelivered = order.status === 'entregue';
            const trocoDevolver = order.formaPagamento === 'dinheiro' && order.trocoPara
              ? Math.max(0, order.trocoPara - order.valorTotal)
              : 0;

            const priorityNumber = order.prioridadeEntrega || (index + 1);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                  isDelivered 
                    ? 'border-stone-200 opacity-80' 
                    : priorityNumber === 1 
                      ? 'border-amber-400 ring-2 ring-amber-400/30' 
                      : 'border-stone-300'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    
                    {/* Badge de Prioridade / Ordem de Entrega */}
                    <div className={`px-3 py-1 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-xs ${
                      isDelivered 
                        ? 'bg-stone-200 text-stone-700' 
                        : priorityNumber === 1 
                          ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-300' 
                          : 'bg-stone-800 text-white'
                    }`}>
                      <span>📍</span>
                      <span>{isDelivered ? 'Entregue' : `${priorityNumber}ª Parada`}</span>
                    </div>

                    <div>
                      <h2 className="text-base font-black text-stone-900">
                        Pedido #{order.numeroSequencial}
                      </h2>
                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Criado às {new Date(order.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Controles de Prioridade para o Administrador */}
                  {isAdmin && !isDelivered && (
                    <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                      <span className="text-[10px] font-bold text-stone-500 px-1">Ordem:</span>
                      <button
                        type="button"
                        onClick={() => handleShiftPriority(order.id, 'up')}
                        disabled={index === 0}
                        title="Subir prioridade (entregar antes)"
                        className="p-1 rounded-lg bg-white hover:bg-stone-200 text-stone-800 disabled:opacity-30 shadow-xs"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShiftPriority(order.id, 'down')}
                        disabled={index === sortedActiveDeliveries.length - 1}
                        title="Descer prioridade (entregar depois)"
                        className="p-1 rounded-lg bg-white hover:bg-stone-200 text-stone-800 disabled:opacity-30 shadow-xs"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Entregador atribuído */}
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-stone-500 block">Entregador:</span>
                    <span className="text-xs font-black text-amber-700">
                      {order.entregadorNome || 'Aguardando atribuição'}
                    </span>
                  </div>
                </div>

                {/* Observação de Entrega da Administração para o Motoboy */}
                <div className="my-3 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                      Observação de Entrega / Instrução ao Motoboy:
                    </span>
                    {isAdmin && editingObsOrderId !== order.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingObsOrderId(order.id);
                          setTempObsValue(order.observacaoEntrega || '');
                        }}
                        className="text-[10px] text-amber-700 font-bold hover:underline"
                      >
                        {order.observacaoEntrega ? 'Editar' : '+ Adicionar Observação'}
                      </button>
                    )}
                  </div>

                  {editingObsOrderId === order.id ? (
                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        value={tempObsValue}
                        onChange={(e) => setTempObsValue(e.target.value)}
                        placeholder="Ex: Entregar primeiro que esfria rápido / Tocar interfone 12"
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-hidden"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingObsOrderId(null)}
                          className="px-2.5 py-1 bg-stone-200 text-stone-700 rounded-md text-[11px]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveObservation(order.id)}
                          className="px-3 py-1 bg-amber-600 text-white font-bold rounded-md text-[11px]"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-stone-800 text-xs italic">
                      {order.observacaoEntrega ? `"${order.observacaoEntrega}"` : 'Nenhuma instrução especial da gerência.'}
                    </p>
                  )}
                </div>

                {/* Dados do Cliente e Endereço */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 text-xs">
                  <div>
                    <div className="font-bold text-stone-900 text-sm">{order.clienteNome}</div>
                    <a
                      href={`https://wa.me/55${order.clienteTelefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {order.clienteTelefone} (WhatsApp do Cliente)
                    </a>

                    {order.enderecoEntrega && (
                      <div className="mt-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                        <div className="font-bold text-stone-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                          <span>{order.enderecoEntrega.logradouro}, nº {order.enderecoEntrega.numero}</span>
                        </div>
                        {order.enderecoEntrega.complemento && (
                          <div className="text-stone-600 pl-5">
                            Compl: {order.enderecoEntrega.complemento}
                          </div>
                        )}
                        <div className="text-stone-700 pl-5">
                          Bairro: <strong>{order.enderecoEntrega.bairro}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informações de Pagamento e Troco */}
                  <div className="space-y-2">
                    {order.formaPagamento === 'dinheiro' ? (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1">
                        <div className="font-black text-amber-900 flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-amber-700" />
                            RECEBER EM DINHEIRO
                          </span>
                          <span className="text-sm font-mono">R$ {order.valorTotal.toFixed(2)}</span>
                        </div>
                        <div className="text-stone-700 text-[11px] flex justify-between">
                          <span>Cliente vai pagar com nota de:</span>
                          <strong>R$ {(order.trocoPara || order.valorTotal).toFixed(2)}</strong>
                        </div>
                        <div className="p-2 bg-amber-400 text-stone-950 rounded-lg flex items-center justify-between font-black text-xs">
                          <span>LEVAR DE TROCO:</span>
                          <span className="text-sm font-mono">R$ {trocoDevolver.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : order.formaPagamento === 'pix' ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-1">
                        <div className="font-black text-emerald-900 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          PAGAMENTO VIA PIX (JÁ PAGO)
                        </div>
                        <p className="text-emerald-800 text-[11px]">
                          ✓ Confirmado online! Não precisa cobrar o cliente.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-xs space-y-1">
                        <div className="font-black text-blue-900 flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          COBRAR NO CARTÃO (LEVAR MAQUININHA)
                        </div>
                        <p className="text-blue-800 text-[11px]">
                          Cobrar: <strong>R$ {order.valorTotal.toFixed(2)}</strong> ({order.formaPagamento === 'cartao_credito' ? 'Crédito' : 'Débito'}).
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-stone-500">
                      Itens: {order.itens.map(i => `${i.quantidade}x ${i.nomeProduto}`).join(', ')}
                    </div>
                  </div>
                </div>

                {/* Botões de Ação do Entregador */}
                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => openGoogleMapsRoute(order)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navegar via Google Maps (GPS)</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  {!isDelivered && (
                    <button
                      type="button"
                      onClick={() => onMarkDelivered(order.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Marcar como Entregue</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SUGESTÃO DE ROTA DA IA (GEMINI) */}
      {/* ========================================================= */}
      {aiRouteModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-purple-300 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scale-up text-stone-900">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-purple-950">
                    Otimização de Rota com IA
                  </h3>
                  <p className="text-xs text-stone-500">
                    {aiRouteModal.geradoPorIA ? 'Análise com Google Gemini AI' : 'Análise Heurística por Bairros e Tempo'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiRouteModal(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 text-xs text-purple-950 leading-relaxed">
                <span className="font-black block text-purple-900 mb-1">🧠 Justificativa da IA:</span>
                {aiRouteModal.explicacaoRota}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Sequência Recomendada de Paradas:
                </span>
                {aiRouteModal.pedidosOrdenados.map((order, idx) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-black text-stone-900 block">
                          Pedido #{order.numeroSequencial} - {order.clienteNome}
                        </span>
                        <span className="text-[11px] text-stone-600">
                          {order.enderecoEntrega?.logradouro}, {order.enderecoEntrega?.numero} ({order.enderecoEntrega?.bairro})
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-stone-800">
                      R$ {order.valorTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-stone-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAiRouteModal(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 rounded-xl text-xs"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAiRoute}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-3 rounded-xl text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Aplicar Esta Ordem</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
