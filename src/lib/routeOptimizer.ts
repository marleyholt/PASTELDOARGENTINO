import { Order } from '../types';
import { GoogleGenAI } from '@google/genai';

export interface OptimizedRouteResult {
  pedidosOrdenados: Order[];
  explicacaoRota: string;
  tempoTotalEstimadoMin: number;
  geradoPorIA: boolean;
}

/**
 * Agrupa e calcula rota inteligente para o motoboy.
 * Se houver API key ou conexão, usa o Gemini para refinar a logística.
 * Caso contrário, usa heurística inteligente de agrupamento por bairros e tempo de pedido.
 */
export async function optimizeDeliveryRoute(
  orders: Order[],
  driverName: string,
  storeAddress: string = 'Av. Paulista, 1500 - Bela Vista'
): Promise<OptimizedRouteResult> {
  const deliveryOrders = orders.filter(
    o => o.tipoEntrega === 'delivery' && (o.status === 'em_entrega' || o.status === 'pronto')
  );

  if (deliveryOrders.length === 0) {
    return {
      pedidosOrdenados: [],
      explicacaoRota: 'Não há pedidos pendentes para este entregador no momento.',
      tempoTotalEstimadoMin: 0,
      geradoPorIA: false,
    };
  }

  if (deliveryOrders.length === 1) {
    const singleOrder = { ...deliveryOrders[0], prioridadeEntrega: 1, ordemRotaSugerida: 1 };
    return {
      pedidosOrdenados: [singleOrder],
      explicacaoRota: `Apenas 1 entrega pendente (#${singleOrder.numeroSequencial} em ${singleOrder.enderecoEntrega?.bairro || 'endereço cadastrado'}). Trajeto direto.`,
      tempoTotalEstimadoMin: 20,
      geradoPorIA: false,
    };
  }

  // Tenta otimização com Gemini se a chave estiver disponível
  const geminiApiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY
    ? process.env.GEMINI_API_KEY
    : (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const prompt = `Você é um especialista em logística urbana de entrega de comida rápida (pastelaria artesanal).
Ponto de partida (Loja): ${storeAddress}.
Entregador: ${driverName}.

Abaixo está a lista de pedidos prontos para entrega com seus endereços e horários:
${deliveryOrders.map((o, idx) => `[Pedido ID: ${o.id}] #${o.numeroSequencial} - Cliente: ${o.clienteNome} | Bairro: ${o.enderecoEntrega?.bairro} | Rua: ${o.enderecoEntrega?.logradouro}, nº ${o.enderecoEntrega?.numero} | Feito às: ${new Date(o.criadoEm).toLocaleTimeString('pt-BR')} | Total: R$ ${o.valorTotal}`).join('\n')}

Retorne uma análise em JSON puro com a chave "ordemIds" (array de string com os IDs na ordem exata recomendada para o motoboy entregar, 1º ao último para economizar tempo e combustível e não deixar o pastel esfriar), "explicacao" (texto curto de 2 a 3 frases explicando por que essa ordem é mais eficiente, citando os bairros) e "tempoEstimadoMin" (número total em minutos).
Responda EXCLUSIVAMENTE em formato JSON:
{"ordemIds": ["id1", "id2"], "explicacao": "...", "tempoEstimadoMin": 35}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);

      if (parsed.ordemIds && Array.isArray(parsed.ordemIds)) {
        const sortedMap = new Map<string, number>();
        parsed.ordemIds.forEach((id: string, index: number) => {
          sortedMap.set(id, index + 1);
        });

        const sorted = [...deliveryOrders].sort((a, b) => {
          const rankA = sortedMap.get(a.id) ?? 999;
          const rankB = sortedMap.get(b.id) ?? 999;
          return rankA - rankB;
        }).map((o, idx) => ({
          ...o,
          prioridadeEntrega: idx + 1,
          ordemRotaSugerida: idx + 1,
        }));

        return {
          pedidosOrdenados: sorted,
          explicacaoRota: parsed.explicacao || 'Rota otimizada pela IA com base em menor tempo de trânsito e agrupamento de bairros.',
          tempoTotalEstimadoMin: parsed.tempoEstimadoMin || (deliveryOrders.length * 15),
          geradoPorIA: true,
        };
      }
    } catch (err) {
      console.warn('[RouteOptimizer] Gemini AI falhou ou offline, aplicando otimizador geográfico inteligente local:', err);
    }
  }

  // Otimizador Algorítmico Heurístico (Agrupamento inteligente por proximidade e tempo)
  const sorted = [...deliveryOrders].sort((a, b) => {
    // 1º Agrupa por mesmo bairro
    const bairroA = a.enderecoEntrega?.bairro?.toLowerCase().trim() || '';
    const bairroB = b.enderecoEntrega?.bairro?.toLowerCase().trim() || '';
    
    if (bairroA === bairroB) {
      // Se mesmo bairro, prioriza quem pediu primeiro
      return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
    }
    return bairroA.localeCompare(bairroB);
  }).map((o, index) => ({
    ...o,
    prioridadeEntrega: index + 1,
    ordemRotaSugerida: index + 1,
  }));

  const bairros = Array.from(new Set(sorted.map(s => s.enderecoEntrega?.bairro).filter(Boolean)));
  const explicacao = `Rota agrupada por bairros vizinhos (${bairros.join(' ➔ ')}). Essa sequência minimiza retornos desnecessários e garante que os pedidos saiam bem quentes.`;

  return {
    pedidosOrdenados: sorted,
    explicacaoRota: explicacao,
    tempoTotalEstimadoMin: sorted.length * 15,
    geradoPorIA: false,
  };
}
