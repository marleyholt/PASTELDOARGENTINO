import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChefHat, 
  Clock, 
  Truck, 
  AlertCircle, 
  User, 
  Phone, 
  MapPin, 
  ArrowRight, 
  ArrowLeft,
  DollarSign,
  Navigation,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Order, OrderStatus, UserAccount, DriverLocation, DeliveryDriver } from '../types';
import { OrderSyncIndicator } from './OrderSyncIndicator';

interface KanbanBoardProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  users: UserAccount[];
  deliveryDrivers?: DeliveryDriver[];
  onAssignDelivery: (orderId: string, driverId: string, driverName: string) => void;
  onMarkAsPaid: (orderId: string) => void;
  driverLocations?: Record<string, DriverLocation>;
  onOpenTracker?: (orderId: string) => void;
  secondsRemaining?: number;
  isChecking?: boolean;
  onForceCheck?: () => void;
}

const columns: { id: OrderStatus; title: string; color: string; icon: React.ComponentType<any> }[] = [
  { id: 'novo', title: 'Novo / Aguardando', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: Clock },
  { id: 'preparando', title: 'Na Cozinha (Fritadeira)', color: 'bg-orange-100 text-orange-900 border-orange-300', icon: ChefHat },
  { id: 'pronto', title: 'Pronto / Despacho', color: 'bg-blue-100 text-blue-900 border-blue-300', icon: CheckCircle2 },
  { id: 'em_entrega', title: 'Em Rota de Entrega', color: 'bg-purple-100 text-purple-900 border-purple-300', icon: Truck },
  { id: 'entregue', title: 'Entregue / Concluído', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: CheckCircle2 },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  orders,
  onUpdateOrderStatus,
  users,
  deliveryDrivers = [],
  onAssignDelivery,
  onMarkAsPaid,
  driverLocations = {},
  onOpenTracker,
  secondsRemaining = 15,
  isChecking = false,
  onForceCheck = () => {},
}) => {
  const [showPaidArchived, setShowPaidArchived] = useState(false);
  const [viewingDriverGps, setViewingDriverGps] = useState<{ driverName: string; orderId: string; loc?: DriverLocation } | null>(null);

  // Lista unificada de motoboys cadastrados
  const drivers = deliveryDrivers.length > 0 
    ? deliveryDrivers.filter(d => d.ativo)
    : users.filter(u => u.cargo === 'entregador' && u.ativo).map(u => ({
        id: u.id,
        nome: u.nome,
        telefone: u.telefone,
        veiculo: 'Moto Padrão',
        ativo: true,
        emServico: true,
      }));

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'novo': return 'preparando';
      case 'preparando': return 'pronto';
      case 'pronto': return 'em_entrega';
      case 'em_entrega': return 'entregue';
      default: return null;
    }
  };

  const getPrevStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'preparando': return 'novo';
      case 'pronto': return 'preparando';
      case 'em_entrega': return 'pronto';
      case 'entregue': return 'em_entrega';
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            Pipeline de Produção (Kanban em Tempo Real)
          </h1>
          <p className="text-xs text-stone-600">
            Controle visual com atualização automática a cada 15s (novos pedidos, saída da cozinha e entregas).
          </p>
        </div>

        {/* Indicador de checagem automática a cada 15s */}
        <OrderSyncIndicator 
          secondsRemaining={secondsRemaining}
          isChecking={isChecking}
          onForceCheck={onForceCheck}
          variant="light"
        />
      </div>

      {/* Grid Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colOrders = orders.filter(o => o.status === col.id);
          const ColIcon = col.icon;

          // Na coluna de entregue: separar os pendentes de acerto dos já pagos
          const pendingSettlement = col.id === 'entregue' ? colOrders.filter(o => o.statusPagamento !== 'pago') : [];
          const paidAndCompleted = col.id === 'entregue' ? colOrders.filter(o => o.statusPagamento === 'pago') : [];

          return (
            <div
              key={col.id}
              className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex flex-col min-h-[520px]"
            >
              {/* Cabeçalho da Coluna */}
              <div className={`p-2.5 rounded-xl border mb-3 flex items-center justify-between font-bold text-xs ${col.color}`}>
                <div className="flex items-center gap-1.5">
                  <ColIcon className="w-4 h-4" />
                  <span>{col.title}</span>
                </div>
                <span className="bg-white/90 px-2 py-0.5 rounded-full text-[11px] font-black shadow-xs">
                  {colOrders.length}
                </span>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colOrders.length === 0 ? (
                  <div className="text-center py-10 text-stone-400 text-xs italic">
                    Nenhum pedido nesta etapa
                  </div>
                ) : col.id === 'entregue' ? (
                  // Layout Especial para Entregue/Concluído (Pedidos com acerto pendente ficam abertos, pagos podem ser minimizados)
                  <div className="space-y-3">
                    {/* Bloco 1: Pedidos Entregues Aguardando Acerto Financeiro com Motoboy */}
                    {pendingSettlement.length > 0 && (
                      <div className="space-y-2">
                        <div className="bg-amber-100 text-amber-900 border border-amber-300 rounded-lg p-2 text-[10px] font-bold flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Aguardando Acerto com Motoboy ({pendingSettlement.length})</span>
                        </div>
                        {pendingSettlement.map(order => renderOrderCard(order))}
                      </div>
                    )}

                    {/* Bloco 2: Pedidos Concluídos e Pagos (Minimizados para abrir espaço) */}
                    {paidAndCompleted.length > 0 && (
                      <div className="pt-2 border-t border-stone-200">
                        <button
                          onClick={() => setShowPaidArchived(!showPaidArchived)}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-stone-200/80 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
                        >
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Pagos & Arquivados ({paidAndCompleted.length})
                          </span>
                          {showPaidArchived ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {showPaidArchived && (
                          <div className="space-y-2 mt-2">
                            {paidAndCompleted.map(order => renderOrderCard(order, true))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Colunas normais: novo, preparando, pronto, em_entrega
                  colOrders.map(order => renderOrderCard(order))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Visualização de GPS do Entregador */}
      {viewingDriverGps && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    GPS ao Vivo: {viewingDriverGps.driverName}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Acompanhando trajeto do Pedido #{orders.find(o => o.id === viewingDriverGps.orderId)?.numeroSequencial}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDriverGps(null)}
                className="text-stone-400 hover:text-stone-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Simulação Visual do Mapa */}
            <div className="relative h-64 w-full bg-stone-800 rounded-xl overflow-hidden border border-stone-300 flex items-center justify-center text-center p-4">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="relative z-10 space-y-3 text-white">
                <div className="w-12 h-12 bg-amber-500 text-stone-950 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Sinal GPS Ativo • Atualizado a cada 1 min
                  </span>
                  <div className="mt-2 text-xs font-mono text-stone-300">
                    Latitude: {viewingDriverGps.loc?.latitude.toFixed(6) || '-23.550520'}
                    <br />
                    Longitude: {viewingDriverGps.loc?.longitude.toFixed(6) || '-46.633308'}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Precisão: ~{viewingDriverGps.loc?.precisao || 8} metros • Velocidade estimada: 32 km/h
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={`https://www.google.com/maps?q=${viewingDriverGps.loc?.latitude || -23.550520},${viewingDriverGps.loc?.longitude || -46.633308}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir no Google Maps Web
              </a>
              <button
                onClick={() => setViewingDriverGps(null)}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Fechar Painel GPS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Renderizador unificado do Card de Pedido
  function renderOrderCard(order: Order, isMinimized = false) {
    const next = getNextStatus(order.status);
    const prev = getPrevStatus(order.status);
    const isPaid = order.statusPagamento === 'pago';

    // Cálculo do troco exato para dinheiro
    const trocoDevolver = (order.formaPagamento === 'dinheiro' && order.trocoPara && order.trocoPara > order.valorTotal)
      ? (order.trocoPara - order.valorTotal)
      : 0;

    // Se estiver minimizado (entregues e pagos)
    if (isMinimized) {
      return (
        <div 
          key={order.id} 
          className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">#{order.numeroSequencial}</span>
            <span className="text-stone-600 font-medium truncate max-w-[100px]">{order.clienteNome}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-emerald-800">R$ {order.valorTotal.toFixed(2)}</span>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-bold">PAGO</span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={order.id}
        className={`bg-white border rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all space-y-2.5 ${
          order.status === 'entregue' && !isPaid 
            ? 'border-amber-400 ring-2 ring-amber-300/40' 
            : 'border-stone-200'
        }`}
      >
        {/* Topo do Card: Número e Tipo de Entrega */}
        <div className="flex items-center justify-between">
          <span className="font-black text-amber-950 text-sm">
            #{order.numeroSequencial}
          </span>
          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
            order.tipoEntrega === 'delivery' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {order.tipoEntrega === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}
          </span>
        </div>

        {/* Situação do Pagamento em Grande Destaque */}
        <div>
          {isPaid ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-lg text-[11px] font-black">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>PAGO</span>
              </span>
              <span className="uppercase text-[10px] font-bold text-emerald-700">
                {order.formaPagamento === 'pix' ? '💠 PIX' : order.formaPagamento === 'dinheiro' ? '💵 Dinheiro' : '💳 Cartão'}
              </span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-1.5 rounded-lg text-[11px] font-bold space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>PAGAR NA ENTREGA</span>
                </span>
                <span className="font-black text-xs font-mono">
                  R$ {order.valorTotal.toFixed(2)}
                </span>
              </div>
              <div className="text-[10px] text-amber-700 uppercase">
                Método: {order.formaPagamento === 'dinheiro' ? 'Dinheiro' : order.formaPagamento === 'cartao_credito' ? 'Cartão Crédito' : 'Cartão Débito'}
              </div>
            </div>
          )}
        </div>

        {/* Destaque Obrigatório de Troco se for em Dinheiro */}
        {order.formaPagamento === 'dinheiro' && (
          <div className="bg-amber-100/90 border border-amber-300 text-stone-900 p-2 rounded-lg text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-700">💵 Cliente paga com:</span>
              <span className="font-bold">R$ {(order.trocoPara || order.valorTotal).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-amber-200/80 pt-1">
              <span className="font-bold text-amber-950">Troco a devolver:</span>
              <span className="bg-amber-500 text-stone-950 px-2 py-0.5 rounded font-black font-mono text-xs">
                R$ {trocoDevolver.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Botão PAGO para NOVO / AGUARDANDO e ENTREGUE / CONCLUÍDO */}
        {(order.status === 'novo' || order.status === 'entregue') && !isPaid && (
          <button
            type="button"
            onClick={() => onMarkAsPaid(order.id)}
            className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 px-3 rounded-lg shadow-xs transition-transform active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Recebimento (PAGO)</span>
          </button>
        )}

        {/* Dados do Cliente */}
        <div>
          <div className="font-bold text-stone-900 text-xs flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-stone-400" />
            {order.clienteNome}
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <Phone className="w-3 h-3 text-stone-400" />
            {order.clienteTelefone}
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="bg-stone-50 rounded-lg p-2 text-[11px] space-y-1 border border-stone-100">
          {order.itens.map(item => (
            <div key={item.id} className="text-stone-700">
              <span className="font-bold text-amber-900">{item.quantidade}x</span> {item.nomeProduto}
              {item.observacao && (
                <span className="text-orange-700 font-semibold block text-[10px]">
                  Obs: {item.observacao}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Endereço se delivery */}
        {order.tipoEntrega === 'delivery' && order.enderecoEntrega && (
          <div className="text-[10px] text-stone-600 flex items-start gap-1">
            <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
            <span>
              {order.enderecoEntrega.bairro} - {order.enderecoEntrega.logradouro}, nº {order.enderecoEntrega.numero}
            </span>
          </div>
        )}

        {/* Atribuição e Rastreamento de Entregador */}
        {(order.status === 'pronto' || order.status === 'em_entrega') && order.tipoEntrega === 'delivery' && (
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Entregador:
              </label>
              {order.status === 'em_entrega' && (
                <button
                  type="button"
                  onClick={() => setViewingDriverGps({
                    driverName: order.entregadorNome || 'Motoboy',
                    orderId: order.id,
                    loc: order.entregadorId ? driverLocations[order.entregadorId] : undefined
                  })}
                  className="flex items-center gap-1 text-[10px] text-purple-700 hover:text-purple-900 font-bold"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Ver GPS ao Vivo</span>
                </button>
              )}
            </div>
            <select
              value={order.entregadorId || ''}
              onChange={(e) => {
                const selected = drivers.find(d => d.id === e.target.value);
                if (selected) {
                  onAssignDelivery(order.id, selected.id, selected.nome);
                }
              }}
              className="w-full text-[11px] p-1.5 border border-stone-300 rounded-md bg-white font-medium focus:ring-1 focus:ring-amber-500"
            >
              <option value="">-- Selecionar motoboy para este pedido --</option>
              {drivers.map(d => {
                const isDuty = 'emServico' in d && (d as any).emServico;
                const vehicle = 'veiculo' in d ? (d as any).veiculo : '';
                const plate = 'placa' in d && (d as any).placa ? `[${(d as any).placa}]` : '';

                return (
                  <option key={d.id} value={d.id}>
                    {isDuty ? '🟢 ' : '⚪ '}
                    {d.nome} {vehicle ? `(${vehicle})` : ''} {plate}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Valor Total e Botões de Avanço de Etapa */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
          <span className="font-black text-stone-900 text-xs">
            R$ {order.valorTotal.toFixed(2)}
          </span>

          <div className="flex items-center gap-1">
            {prev && (
              <button
                onClick={() => onUpdateOrderStatus(order.id, prev)}
                title="Voltar etapa"
                className="p-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {next && (
              <button
                onClick={() => onUpdateOrderStatus(order.id, next)}
                title="Avançar etapa"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
};
