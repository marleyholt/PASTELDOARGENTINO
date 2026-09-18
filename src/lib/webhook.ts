import { Order, StoreConfig, PaymentMethod } from '../types';

export interface WebhookPayload {
  evento: 'novo_pedido';
  loja: string;
  pedidoId: string;
  numeroSequencial: number;
  cliente: {
    nome: string;
    telefone: string;
  };
  tipoEntrega: 'delivery' | 'retirada';
  endereco?: {
    logradouro: string;
    numero: string;
    bairro: string;
    complemento?: string;
  };
  itens: {
    nome: string;
    quantidade: number;
    precoUnitario: number;
    adicionais?: string[];
    observacao?: string;
    subtotal: number;
  }[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  formaPagamento: PaymentMethod;
  statusPagamento: string;
  trocoPara?: number;
  mensagemWhatsappFormatada: string;
  data: string;
}

/**
 * Monta o texto legível predefinido para o WhatsApp
 */
export function formatWhatsAppMessage(order: Order, config: StoreConfig): string {
  let itemsText = '';
  order.itens.forEach(item => {
    itemsText += `• ${item.quantidade}x ${item.nomeProduto}`;
    if (item.adicionais && item.adicionais.length > 0) {
      itemsText += ` (+ ${item.adicionais.map(a => a.nome).join(', ')})`;
    }
    if (item.observacao) {
      itemsText += ` [Obs: ${item.observacao}]`;
    }
    itemsText += ` - R$ ${item.subtotal.toFixed(2)}\n`;
  });

  const paymentNames: Record<PaymentMethod, string> = {
    pix: `PIX (Chave: ${config.chavePix})`,
    cartao_credito: 'Cartão de Crédito (Levar maquininha)',
    cartao_debito: 'Cartão de Débito (Levar maquininha)',
    dinheiro: order.trocoPara ? `Dinheiro (Troco para R$ ${order.trocoPara.toFixed(2)})` : 'Dinheiro (Sem troco)',
  };

  const addressText = order.tipoEntrega === 'delivery' && order.enderecoEntrega
    ? `📍 *Endereço:* ${order.enderecoEntrega.logradouro}, nº ${order.enderecoEntrega.numero} ${order.enderecoEntrega.complemento ? `(${order.enderecoEntrega.complemento})` : ''} - ${order.enderecoEntrega.bairro}`
    : `📍 *Retirada no Balcão:* ${config.enderecoCompleto}`;

  const template = config.mensagemWhatsappPadrao || `🥟 *NOVO PEDIDO #{numero} - {loja}*
👤 *Cliente:* {cliente} ({telefone})
{endereco}
━━━━━━━━━━━━━━━━━━━━
🛒 *ITENS:*
{itens}
━━━━━━━━━━━━━━━━━━━━
🛵 *Taxa:* R$ {taxa_entrega}
💰 *TOTAL:* R$ {total}
💳 *Pagamento:* {pagamento}
{observacoes}`;

  return template
    .replace('{loja}', config.nome)
    .replace('{numero}', order.numeroSequencial.toString())
    .replace('{cliente}', order.clienteNome)
    .replace('{telefone}', order.clienteTelefone)
    .replace('{tipo_entrega}', order.tipoEntrega === 'delivery' ? 'Entrega em Domicílio' : 'Retirada no Balcão')
    .replace('{endereco}', addressText)
    .replace('{itens}', itemsText.trim())
    .replace('{taxa_entrega}', order.taxaEntrega.toFixed(2))
    .replace('{total}', order.valorTotal.toFixed(2))
    .replace('{pagamento}', paymentNames[order.formaPagamento] || order.formaPagamento)
    .replace('{observacoes}', order.observacoesGerais ? `📝 *Obs:* ${order.observacoesGerais}` : '');
}

/**
 * Dispara o webhook HTTP POST para a API configurada
 */
export async function dispatchOrderWebhook(
  order: Order, 
  config: StoreConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.webhookWhatsappAtivo || !config.webhookWhatsappUrl) {
    return { success: false, message: 'Webhook não configurado ou desativado.' };
  }

  const messageText = formatWhatsAppMessage(order, config);

  const payload: WebhookPayload = {
    evento: 'novo_pedido',
    loja: config.nome,
    pedidoId: order.id,
    numeroSequencial: order.numeroSequencial,
    cliente: {
      nome: order.clienteNome,
      telefone: order.clienteTelefone,
    },
    tipoEntrega: order.tipoEntrega,
    endereco: order.enderecoEntrega,
    itens: order.itens.map(i => ({
      nome: i.nomeProduto,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      adicionais: i.adicionais?.map(a => a.nome),
      observacao: i.observacao,
      subtotal: i.subtotal,
    })),
    subtotal: order.subtotal,
    taxaEntrega: order.taxaEntrega,
    total: order.valorTotal,
    formaPagamento: order.formaPagamento,
    statusPagamento: order.statusPagamento,
    trocoPara: order.trocoPara,
    mensagemWhatsappFormatada: messageText,
    data: new Date().toISOString(),
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.webhookWhatsappToken) {
      headers['Authorization'] = `Bearer ${config.webhookWhatsappToken}`;
      headers['x-api-key'] = config.webhookWhatsappToken;
    }

    const response = await fetch(config.webhookWhatsappUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('[Webhook WhatsApp] Disparo realizado com sucesso!');
      return { success: true, message: 'Webhook disparado com sucesso para o WhatsApp!' };
    } else {
      console.warn(`[Webhook WhatsApp] Falha HTTP: ${response.status}`);
      return { success: false, message: `Servidor retornou status HTTP ${response.status}` };
    }
  } catch (error: any) {
    console.error('[Webhook WhatsApp] Erro de rede:', error);
    return { success: false, message: `Erro de conexão com o webhook: ${error?.message || 'Falha de rede'}` };
  }
}
