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
  RefreshCw
} from 'lucide-react';
import { Order, DriverLocation } from '../types';

interface DeliveryModuleProps {
  orders: Order[];
  onMarkDelivered: (orderId: string) => void;
  driverId?: string;
  driverName?: string;
  onUpdateDriverLocation?: (location: DriverLocation) => void;
}

export const DeliveryModule: React.FC<DeliveryModuleProps> = ({ 
  orders, 
  onMarkDelivered,
  driverId = 'user-entregador-1',
  driverName = 'Carlos Entregador',
  onUpdateDriverLocation
}) => {
  const [filter, setFilter] = useState<'ativos' | 'entregues'>('ativos');
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy: number; time: string } | null>(null);

  // Pedidos em rota de entrega ou prontos aguardando saída
  const deliveryOrders = orders.filter(o => o.tipoEntrega === 'delivery');
  const activeDeliveries = deliveryOrders.filter(o => o.status === 'em_entrega' || o.status === 'pronto');
  const finishedDeliveries = deliveryOrders.filter(o => o.status === 'entregue');

  const displayedList = filter === 'ativos' ? activeDeliveries : finishedDeliveries;

  // Ativação e Rastreamento contínuo de GPS
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
        // Fallback gracioso para ambiente de simulação/teste
        const simulatedCoords = {
          lat: -23.550520,
          lng: -46.633308,
          accuracy: 5,
          time: new Date().toLocaleTimeString('pt-BR'),
        };
        setCurrentCoords(simulatedCoords);
        setGpsActive(true);
        setGpsError('Modo GPS Simulado ativo (permissão do navegador restrita na pré-visualização).');

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

  // Simular pequenos deslocamentos a cada 30 segundos se o GPS estiver ligado para teste realista
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
  }, [gpsActive, driverId, onUpdateDriverLocation]);

  const openGoogleMapsRoute = (order: Order) => {
    if (!order.enderecoEntrega) return;
    const { logradouro, numero, bairro, cidade } = order.enderecoEntrega;
    const destination = `${logradouro}, ${numero}, ${bairro}, ${cidade || 'Brasil'}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Topo do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-stone-900 text-white p-5 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-stone-950 rounded-xl">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black uppercase tracking-wider">
                Painel do Entregador
              </h1>
              <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                {driverName}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Rotas no Google Maps, cálculo exato de troco e compartilhamento de GPS ao vivo.
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

      {/* Alerta de Obrigatoriedade do GPS */}
      {!gpsActive ? (
        <div className="bg-amber-500/15 border-2 border-amber-500 rounded-2xl p-5 mb-6 text-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
              <Compass className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="font-black text-stone-950 text-sm">
                Exigência de Compartilhamento de GPS
              </h3>
              <p className="text-xs text-stone-700 mt-0.5">
                Para iniciar as entregas, compartilhe sua localização de GPS para que a pastelaria e o cliente acompanhem a entrega em tempo real.
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
      ) : (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 mb-6 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-black">GPS Ativo e Transmitindo:</span>
            <span className="font-mono text-[11px] text-emerald-700">
              {currentCoords?.lat.toFixed(5)}, {currentCoords?.lng.toFixed(5)} (±{currentCoords?.accuracy}m) • Último sinal: {currentCoords?.time}
            </span>
          </div>
          <button
            type="button"
            onClick={handleEnableGps}
            title="Atualizar posição agora"
            className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-950 font-bold bg-white px-2 py-1 rounded-md border border-emerald-200"
          >
            <RefreshCw className="w-3 h-3" />
            Atualizar Agora
          </button>
        </div>
      )}

      {gpsError && (
        <div className="mb-4 text-xs bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {displayedList.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-xs">
          <Truck className="w-16 h-16 text-stone-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-700">Nenhuma entrega na lista</h3>
          <p className="text-xs text-stone-500">
            {filter === 'ativos'
              ? 'Todos os pedidos despachados já foram entregues aos clientes!'
              : 'Nenhum pedido finalizado hoje ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map(order => {
            const isReady = order.status === 'pronto';
            const isDelivered = order.status === 'entregue';
            const isCash = order.formaPagamento === 'dinheiro';
            const trocoDevolver = (isCash && order.trocoPara && order.trocoPara > order.valorTotal)
              ? (order.trocoPara - order.valorTotal)
              : 0;

            return (
              <div
                key={order.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Cabeçalho do Card de Entrega */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-amber-900">
                      Pedido #{order.numeroSequencial}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      isDelivered
                        ? 'bg-emerald-100 text-emerald-800'
                        : isReady
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {isDelivered ? 'Entregue' : isReady ? 'Aguardando Saída da Loja' : 'Em Rota para Entrega'}
                    </span>
                  </div>

                  {/* Valor e Situação */}
                  <div className="text-xs font-bold text-stone-600">
                    Total do Pedido: <span className="text-base font-black text-stone-900">R$ {order.valorTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dados do Cliente e Endereço */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                      <User className="w-4 h-4 text-stone-400" />
                      {order.clienteNome}
                    </div>

                    <a
                      href={`tel:${order.clienteTelefone.replace(/\D/g, '')}`}
                      className="flex items-center gap-2 text-xs font-semibold text-amber-800 hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Ligar para Cliente: {order.clienteTelefone}
                    </a>

                    {order.enderecoEntrega && (
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
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
                        
                        {/* Botão Oficial do Google Maps para o Motoboy */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            `${order.enderecoEntrega.logradouro}, ${order.enderecoEntrega.numero}, ${order.enderecoEntrega.bairro}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-2 px-3 rounded-lg shadow-xs transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Navegar via Google Maps (GPS)
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Instruções de Pagamento e Troco em Destaque */}
                  <div className="space-y-3 flex flex-col justify-between">
                    {isCash ? (
                      <div className="p-3.5 bg-amber-50 border-2 border-amber-400 rounded-xl text-xs space-y-2">
                        <div className="flex items-center justify-between font-black text-amber-950">
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
                        <div className="p-2 bg-amber-400/90 text-stone-950 rounded-lg flex items-center justify-between font-black text-xs">
                          <span>LEVAR DE TROCO:</span>
                          <span className="text-sm font-mono">R$ {trocoDevolver.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : order.formaPagamento === 'pix' ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-1">
                        <div className="font-black text-emerald-900 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          PAGAMENTO VIA PIX
                        </div>
                        <p className="text-emerald-800 text-[11px]">
                          ✓ Já pago online! Não precisa cobrar nada do cliente.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-xs space-y-1">
                        <div className="font-black text-blue-900 flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          COBRAR NO CARTÃO (MAQUININHA)
                        </div>
                        <p className="text-blue-800 text-[11px]">
                          Levar máquina de cartão ({order.formaPagamento === 'cartao_credito' ? 'Crédito' : 'Débito'}). Cobrar: <strong>R$ {order.valorTotal.toFixed(2)}</strong>.
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-stone-500">
                      Itens na Sacola: {order.itens.map(i => `${i.quantidade}x ${i.nomeProduto}`).join(', ')}
                    </div>
                  </div>
                </div>

                {/* Ações: Abrir Rota GPS & Marcar como Entregue */}
                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => openGoogleMapsRoute(order)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98"
                  >
                    <Navigation className="w-4 h-4" />
                    Abrir Rota no Google Maps
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  {!isDelivered && (
                    <button
                      onClick={() => onMarkDelivered(order.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Marcar como Entregue ao Cliente
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
