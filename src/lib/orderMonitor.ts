import { Order } from '../types';

export interface OrderComparisonResult {
  hasChanges: boolean;
  newOrders: Order[];
  leftKitchenOrders: Order[];
  deliveredOrders: Order[];
}

/**
 * Compara a lista anterior de pedidos com a nova lista retornada da checagem
 */
export function compareOrders(previousOrders: Order[], incomingOrders: Order[]): OrderComparisonResult {
  const prevMap = new Map<string, Order>();
  previousOrders.forEach(o => prevMap.set(o.id, o));

  const newOrders: Order[] = [];
  const leftKitchenOrders: Order[] = [];
  const deliveredOrders: Order[] = [];

  for (const current of incomingOrders) {
    const prev = prevMap.get(current.id);

    // 1. Pedido totalmente novo que não existia na lista
    if (!prev) {
      newOrders.push(current);
      continue;
    }

    // 2. Pedido saiu da cozinha: antes estava em 'novo' ou 'preparando', e agora está 'pronto' ou 'em_entrega'
    const wasInKitchen = prev.status === 'preparando' || prev.status === 'novo';
    const isNowReadyOrOut = current.status === 'pronto' || current.status === 'em_entrega';
    if (wasInKitchen && isNowReadyOrOut) {
      leftKitchenOrders.push(current);
    }

    // 3. Pedido foi entregue pelo motoboy: antes estava em rota ('em_entrega' ou 'pronto') e agora está 'entregue'
    const wasInTransit = prev.status === 'em_entrega' || prev.status === 'pronto';
    const isNowDelivered = current.status === 'entregue';
    if (wasInTransit && isNowDelivered) {
      deliveredOrders.push(current);
    }
  }

  // Verifica se houve alguma alteração de status, valor, pagamento ou prioridade
  let anyFieldChanged = false;
  if (previousOrders.length !== incomingOrders.length) {
    anyFieldChanged = true;
  } else {
    for (const cur of incomingOrders) {
      const p = prevMap.get(cur.id);
      if (!p) {
        anyFieldChanged = true;
        break;
      }
      if (
        p.status !== cur.status ||
        p.statusPagamento !== cur.statusPagamento ||
        p.atualizadoEm !== cur.atualizadoEm ||
        p.prioridadeEntrega !== cur.prioridadeEntrega ||
        p.entregadorId !== cur.entregadorId
      ) {
        anyFieldChanged = true;
        break;
      }
    }
  }

  const hasChanges = 
    newOrders.length > 0 || 
    leftKitchenOrders.length > 0 || 
    deliveredOrders.length > 0 || 
    anyFieldChanged;

  return {
    hasChanges,
    newOrders,
    leftKitchenOrders,
    deliveredOrders,
  };
}
