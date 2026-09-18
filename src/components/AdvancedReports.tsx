import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart as PieIcon,
  BarChart3,
  HelpCircle,
  FileSpreadsheet,
  Receipt,
  CalendarDays,
  Wallet,
  Banknote,
  QrCode,
  ArrowDownCircle,
  ArrowUpCircle,
  Store,
  Bike,
  CheckCircle2,
  Clock,
  Coins,
  ChevronRight,
  AlertCircle,
  Flame,
  Thermometer,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  UtensilsCrossed
} from 'lucide-react';
import { Order, FinancialTransaction, Category, Product } from '../types';

interface AdvancedReportsProps {
  orders: Order[];
  transactions: FinancialTransaction[];
  categories: Category[];
  products: Product[];
}

export const AdvancedReports: React.FC<AdvancedReportsProps> = ({
  orders,
  transactions,
  categories,
  products
}) => {
  // Controle de sub-aba: 'fechamento' (Vendas por Dia / Fechamento de Caixa) vs 'analytics' (Métricas & Gráficos)
  const [activeTab, setActiveTab] = useState<'fechamento' | 'analytics'>('fechamento');

  // Estado da data para o Fechamento de Caixa Diário
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedCashDate, setSelectedCashDate] = useState<string>(todayStr);

  // Modo de visualização do mapa de temperatura: 'day' (Hora a hora do dia) ou 'weekly' (Matriz semanal de picos)
  const [heatmapViewMode, setHeatmapViewMode] = useState<'day' | 'weekly'>('day');

  // Filtros da aba de gráficos e analytics
  const [periodPreset, setPeriodPreset] = useState<'today' | '7days' | '30days' | 'all'>('30days');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all'); // delivery, retirada, all
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-30');

  // Cores personalizadas elegantes para os gráficos
  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#64748b'];

  // =========================================================================
  // 1. FECHAMENTO DE CAIXA DIÁRIO (VENDAS POR DIA)
  // =========================================================================

  // Pedidos do dia selecionado
  const dayOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = (order.criadoEm || '').slice(0, 10);
      return orderDate === selectedCashDate && order.status !== 'cancelado';
    });
  }, [orders, selectedCashDate]);

  // Pedidos cancelados do dia
  const dayCancelledOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = (order.criadoEm || '').slice(0, 10);
      return orderDate === selectedCashDate && order.status === 'cancelado';
    });
  }, [orders, selectedCashDate]);

  // Transações/Despesas do dia selecionado
  const dayExpensesTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = (t.data || '').slice(0, 10);
      return tDate === selectedCashDate && t.tipo === 'saida';
    });
  }, [transactions, selectedCashDate]);

  // Totais do dia selecionado
  const dayTotals = useMemo(() => {
    const grossSales = dayOrders.reduce((sum, o) => sum + o.valorTotal, 0);
    const deliveryFees = dayOrders.reduce((sum, o) => sum + (o.taxaEntrega || 0), 0);
    const subtotalProducts = dayOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const totalItems = dayOrders.reduce((sum, o) => {
      return sum + o.itens.reduce((iSum, i) => iSum + i.quantidade, 0);
    }, 0);
    const expenses = dayExpensesTransactions.reduce((sum, t) => sum + t.valor, 0);
    const netCash = grossSales - expenses;
    const ticketMedio = dayOrders.length > 0 ? grossSales / dayOrders.length : 0;

    // Quebra por Forma de Pagamento no dia
    const payments = {
      pix: { total: 0, count: 0 },
      cartao_credito: { total: 0, count: 0 },
      cartao_debito: { total: 0, count: 0 },
      dinheiro: { total: 0, count: 0 }
    };

    dayOrders.forEach(o => {
      const key = o.formaPagamento as keyof typeof payments;
      if (payments[key]) {
        payments[key].total += o.valorTotal;
        payments[key].count += 1;
      }
    });

    // Quebra por Canal no dia
    const channels = {
      delivery: { total: 0, count: 0 },
      retirada: { total: 0, count: 0 }
    };

    dayOrders.forEach(o => {
      if (o.tipoEntrega === 'delivery') {
        channels.delivery.total += o.valorTotal;
        channels.delivery.count += 1;
      } else {
        channels.retirada.total += o.valorTotal;
        channels.retirada.count += 1;
      }
    });

    // Top itens vendidos no dia
    const itemsMap: { [key: string]: { nome: string; qtd: number; subtotal: number } } = {};
    dayOrders.forEach(o => {
      o.itens.forEach(item => {
        if (!itemsMap[item.nomeProduto]) {
          itemsMap[item.nomeProduto] = { nome: item.nomeProduto, qtd: 0, subtotal: 0 };
        }
        itemsMap[item.nomeProduto].qtd += item.quantidade;
        itemsMap[item.nomeProduto].subtotal += item.subtotal;
      });
    });

    const topItems = Object.values(itemsMap).sort((a, b) => b.qtd - a.qtd);

    return {
      grossSales,
      deliveryFees,
      subtotalProducts,
      totalItems,
      expenses,
      netCash,
      ticketMedio,
      payments,
      channels,
      topItems
    };
  }, [dayOrders, dayExpensesTransactions]);

  // Consolidado Histórico de Vendas por Dia (para a tabela comparativa diária)
  const dailyHistoryTable = useMemo(() => {
    // Coleta todas as datas únicas que constam nos pedidos e transações
    const dateSet = new Set<string>();
    
    // Adiciona data atual e dias recentes da semana caso o banco tenha poucos registros
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateSet.add(d.toISOString().slice(0, 10));
    }

    orders.forEach(o => {
      if (o.criadoEm) dateSet.add(o.criadoEm.slice(0, 10));
    });

    const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

    return sortedDates.map(dateKey => {
      const dOrders = orders.filter(o => o.criadoEm?.slice(0, 10) === dateKey && o.status !== 'cancelado');
      const dExpenses = transactions.filter(t => t.data?.slice(0, 10) === dateKey && t.tipo === 'saida');

      let pix = 0;
      let cartao = 0;
      let dinheiro = 0;
      let taxas = 0;
      let totalBruto = 0;

      dOrders.forEach(o => {
        totalBruto += o.valorTotal;
        taxas += o.taxaEntrega || 0;
        if (o.formaPagamento === 'pix') pix += o.valorTotal;
        else if (o.formaPagamento === 'cartao_credito' || o.formaPagamento === 'cartao_debito') cartao += o.valorTotal;
        else if (o.formaPagamento === 'dinheiro') dinheiro += o.valorTotal;
      });

      const totalDespesas = dExpenses.reduce((sum, t) => sum + t.valor, 0);

      // Se for uma data recente sem pedidos mockados, provê valor base representativo de demonstração
      let displayOrdersCount = dOrders.length;
      let displayTotal = totalBruto;
      let displayPix = pix;
      let displayCartao = cartao;
      let displayDinheiro = dinheiro;
      let displayDespesas = totalDespesas;

      // Mock gracioso para os dias anteriores caso estejam vazios
      if (displayOrdersCount === 0) {
        const dateObj = new Date(dateKey + 'T12:00:00');
        const dayOfWeek = dateObj.getDay(); // 0 Dom, 6 Sab
        const weekendFactor = (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) ? 1.8 : 1.0;
        displayOrdersCount = Math.round(18 * weekendFactor);
        displayTotal = Number((displayOrdersCount * 36.50).toFixed(2));
        displayPix = Number((displayTotal * 0.48).toFixed(2));
        displayCartao = Number((displayTotal * 0.38).toFixed(2));
        displayDinheiro = Number((displayTotal - displayPix - displayCartao).toFixed(2));
        displayDespesas = Number((displayTotal * 0.22).toFixed(2));
      }

      const saldoLiquido = displayTotal - displayDespesas;

      return {
        date: dateKey,
        ordersCount: displayOrdersCount,
        pix: displayPix,
        cartao: displayCartao,
        dinheiro: displayDinheiro,
        taxas,
        totalBruto: displayTotal,
        despesas: displayDespesas,
        saldoLiquido,
        isRealOrders: dOrders.length > 0
      };
    });
  }, [orders, transactions]);

  // =========================================================================
  // 1.1 MAPA DE TEMPERATURA (HEATMAP) E DEFINIÇÃO DO HORÁRIO DE PICO
  // =========================================================================

  // Horários de funcionamento típico da pastelaria: das 11:00 às 23:00 (13 faixas horárias)
  const dayPeakAndHeatmap = useMemo(() => {
    const hoursSlots = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

    // Distribuição representativa caso a data consultada não possua pedidos detalhados no mock
    const mockHourlyDistribution: { [hour: number]: number } = {
      11: 0.04, // 11h - Abertura almoço
      12: 0.14, // 12h - Pico de Almoço
      13: 0.09, // 13h - Almoço
      14: 0.03, // 14h - Tarde calma
      15: 0.03, // 15h
      16: 0.06, // 16h - Lanche da tarde
      17: 0.08, // 17h - Happy hour / saída
      18: 0.14, // 18h - Início do turno noturno
      19: 0.23, // 19h - 🔥 PICO MÁXIMO NOTURNO
      20: 0.11, // 20h - Movimento forte
      21: 0.04, // 21h
      22: 0.01, // 22h
      23: 0.00, // 23h - Fechamento
    };

    const hasRealOrders = dayOrders.length > 0;
    const historyItem = dailyHistoryTable.find(h => h.date === selectedCashDate);
    const refOrdersCount = hasRealOrders ? dayOrders.length : (historyItem?.ordersCount || 18);
    const refGross = hasRealOrders ? dayTotals.grossSales : (historyItem?.totalBruto || 650);

    const slots = hoursSlots.map(h => {
      const label = `${h.toString().padStart(2, '0')}:00 às ${(h + 1).toString().padStart(2, '0')}:00`;
      const shortLabel = `${h}h`;

      let ordersCount = 0;
      let revenue = 0;
      let ordersInHour: Order[] = [];

      if (hasRealOrders) {
        ordersInHour = dayOrders.filter(o => {
          if (!o.criadoEm) return false;
          const orderHour = new Date(o.criadoEm).getHours();
          return orderHour === h;
        });
        ordersCount = ordersInHour.length;
        revenue = ordersInHour.reduce((sum, o) => sum + o.valorTotal, 0);
      } else {
        const share = mockHourlyDistribution[h] || 0.02;
        ordersCount = Math.round(refOrdersCount * share);
        revenue = Number((refGross * share).toFixed(2));
      }

      return {
        hour: h,
        label,
        shortLabel,
        ordersCount,
        revenue,
        ordersInHour
      };
    });

    // Maior número de pedidos em uma faixa para normalizar a escala de calor (0 a 100)
    const maxOrders = Math.max(...slots.map(s => s.ordersCount), 1);

    // Determina a faixa de pico absoluto (maior contagem de pedidos, desempate por faturamento)
    let peakSlot = slots[0];
    slots.forEach(s => {
      if (s.ordersCount > peakSlot.ordersCount || (s.ordersCount === peakSlot.ordersCount && s.revenue > peakSlot.revenue)) {
        peakSlot = s;
      }
    });

    // Atribui nível térmico e cor da temperatura para cada slot
    const slotsWithHeat = slots.map(s => {
      const ratio = s.ordersCount / maxOrders;
      let heatLevel: 'cold' | 'mild' | 'warm' | 'hot' | 'peak' = 'cold';
      let temperatureLabel = 'Sem movimento';

      if (s.ordersCount === 0) {
        heatLevel = 'cold';
        temperatureLabel = 'Frio (Sem Pedidos)';
      } else if (s.hour === peakSlot.hour || ratio >= 0.85) {
        heatLevel = 'peak';
        temperatureLabel = 'Pico Máximo (Brasa)';
      } else if (ratio >= 0.60) {
        heatLevel = 'hot';
        temperatureLabel = 'Movimento Intenso';
      } else if (ratio >= 0.30) {
        heatLevel = 'warm';
        temperatureLabel = 'Movimento Moderado';
      } else {
        heatLevel = 'mild';
        temperatureLabel = 'Movimento Baixo';
      }

      return {
        ...s,
        intensity: Math.round(ratio * 100),
        heatLevel,
        temperatureLabel
      };
    });

    const peakShareOrders = refOrdersCount > 0 ? Math.round((peakSlot.ordersCount / refOrdersCount) * 100) : 0;
    const peakShareRevenue = refGross > 0 ? Math.round((peakSlot.revenue / refGross) * 100) : 0;
    const peakTicketMedio = peakSlot.ordersCount > 0 ? peakSlot.revenue / peakSlot.ordersCount : 0;

    return {
      slots: slotsWithHeat,
      peakSlot,
      peakShareOrders,
      peakShareRevenue,
      peakTicketMedio,
      refOrdersCount,
      refGross,
      hasRealOrders
    };
  }, [dayOrders, dailyHistoryTable, selectedCashDate, dayTotals.grossSales]);

  // Matriz Semanal de Calor (Pico Global da Pastelaria: Dia da Semana x Turnos)
  const weeklyHeatmapMatrix = useMemo(() => {
    const days = [
      { key: 'seg', label: 'Segunda-feira', short: 'Seg', factor: 0.8 },
      { key: 'ter', label: 'Terça-feira', short: 'Ter', factor: 0.9 },
      { key: 'qua', label: 'Quarta-feira', short: 'Qua', factor: 1.0 },
      { key: 'qui', label: 'Quinta-feira', short: 'Qui', factor: 1.2 },
      { key: 'sex', label: 'Sexta-feira', short: 'Sex', factor: 1.9 },
      { key: 'sab', label: 'Sábado', short: 'Sáb', factor: 2.2 },
      { key: 'dom', label: 'Domingo', short: 'Dom', factor: 1.7 }
    ];

    const shifts = [
      { key: 'almoco', label: 'Almoço (11h - 14h)', baseOrders: 7, subLabel: 'Turno Diurno' },
      { key: 'tarde', label: 'Tarde / Lanche (14h - 18h)', baseOrders: 4, subLabel: 'Turno Intermediário' },
      { key: 'noite', label: 'Pico Noturno (18h - 21h)', baseOrders: 16, subLabel: 'Turno Nobre' },
      { key: 'fechamento', label: 'Encerramento (21h - 23h)', baseOrders: 5, subLabel: 'Final de Expediente' }
    ];

    let maxShiftOrders = 1;

    const matrix = days.map(d => {
      const shiftData = shifts.map(sh => {
        const ordersEstimate = Math.round(sh.baseOrders * d.factor);
        const revenueEstimate = Math.round(ordersEstimate * 38.0);
        if (ordersEstimate > maxShiftOrders) maxShiftOrders = ordersEstimate;
        return {
          shiftKey: sh.key,
          orders: ordersEstimate,
          revenue: revenueEstimate,
        };
      });
      return {
        day: d,
        shifts: shiftData
      };
    });

    const matrixWithHeat = matrix.map(row => ({
      ...row,
      shifts: row.shifts.map(sh => {
        const ratio = sh.orders / maxShiftOrders;
        let heatLevel: 'cold' | 'mild' | 'warm' | 'hot' | 'peak' = 'cold';
        if (ratio >= 0.85) heatLevel = 'peak';
        else if (ratio >= 0.60) heatLevel = 'hot';
        else if (ratio >= 0.35) heatLevel = 'warm';
        else if (ratio >= 0.15) heatLevel = 'mild';
        else heatLevel = 'cold';

        return {
          ...sh,
          ratio,
          heatLevel
        };
      })
    }));

    return { days, shifts, matrix: matrixWithHeat, maxShiftOrders };
  }, []);

  // Exportar Fechamento de Caixa do Dia como CSV
  const handleExportCashCSV = () => {
    const rows = [
      ['FECHAMENTO DE CAIXA DIARIO - PASTELARIA DE OURO'],
      ['Data de Referencia', selectedCashDate],
      ['Total Bruto Entrado', dayTotals.grossSales.toFixed(2)],
      ['Total Despesas/Sangrias', dayTotals.expenses.toFixed(2)],
      ['Saldo Liquido em Caixa', dayTotals.netCash.toFixed(2)],
      ['Pedidos Atendidos', dayOrders.length.toString()],
      ['Ticket Medio', dayTotals.ticketMedio.toFixed(2)],
      ['Horario de Pico de Atendimento', `${dayPeakAndHeatmap.peakSlot.label} (${dayPeakAndHeatmap.peakSlot.ordersCount} pedidos - R$ ${dayPeakAndHeatmap.peakSlot.revenue.toFixed(2)})`],
      ['Dinheiro Fisico (Gaveta)', dayTotals.payments.dinheiro.total.toFixed(2)],
      ['Pix Recebido', dayTotals.payments.pix.total.toFixed(2)],
      ['Cartao de Credito', dayTotals.payments.cartao_credito.total.toFixed(2)],
      ['Cartao de Debito', dayTotals.payments.cartao_debito.total.toFixed(2)],
      [],
      ['DETALHAMENTO DOS PEDIDOS DO DIA'],
      ['ID', 'Horario', 'Cliente', 'Canal', 'Forma Pagamento', 'Taxa Entrega', 'Total (R$)'],
      ...dayOrders.map(o => [
        `#${o.numeroSequencial}`,
        new Date(o.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        `"${o.clienteNome}"`,
        o.tipoEntrega,
        o.formaPagamento,
        o.taxaEntrega.toFixed(2),
        o.valorTotal.toFixed(2)
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fechamento_caixa_${selectedCashDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // 2. FILTROS & DADOS GERAIS (ABA ANALYTICS & GRÁFICOS)
  // =========================================================================

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (selectedChannel !== 'all' && order.tipoEntrega !== selectedChannel) return false;
      if (selectedPayment !== 'all' && order.formaPagamento !== selectedPayment) return false;
      if (selectedCategory !== 'all') {
        const hasCategoryItem = order.itens.some(item => {
          const prod = products.find(p => p.id === item.produtoId);
          return prod?.categoriaId === selectedCategory;
        });
        if (!hasCategoryItem) return false;
      }
      return true;
    });
  }, [orders, selectedChannel, selectedPayment, selectedCategory, products]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (selectedPayment !== 'all' && t.formaPagamento !== selectedPayment) return false;
      return true;
    });
  }, [transactions, selectedPayment]);

  const totalFaturamento = useMemo(() => {
    return filteredOrders
      .filter(o => o.status !== 'cancelado')
      .reduce((sum, o) => sum + o.valorTotal, 0);
  }, [filteredOrders]);

  const totalPedidos = useMemo(() => {
    return filteredOrders.filter(o => o.status !== 'cancelado').length;
  }, [filteredOrders]);

  const ticketMedio = useMemo(() => {
    return totalPedidos > 0 ? totalFaturamento / totalPedidos : 0;
  }, [totalFaturamento, totalPedidos]);

  const totalDespesas = useMemo(() => {
    return filteredTransactions
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + t.valor, 0);
  }, [filteredTransactions]);

  const lucroOperacional = totalFaturamento - totalDespesas;
  const margemLucro = totalFaturamento > 0 ? (lucroOperacional / totalFaturamento) * 100 : 0;

  // Gráfico Diário
  const dailyChartData = useMemo(() => {
    const daysMap: { [key: string]: { dia: string; faturamento: number; pedidos: number; despesas: number } } = {
      'Seg': { dia: 'Seg (14/09)', faturamento: 450, pedidos: 11, despesas: 120 },
      'Ter': { dia: 'Ter (15/09)', faturamento: 620, pedidos: 15, despesas: 80 },
      'Qua': { dia: 'Qua (16/09)', faturamento: 780, pedidos: 19, despesas: 190 },
      'Qui': { dia: 'Qui (17/09)', faturamento: 910, pedidos: 22, despesas: 140 },
      'Sex': { dia: 'Sex (18/09)', faturamento: 1540, pedidos: 38, despesas: 320 },
      'Sáb': { dia: 'Sáb (19/09)', faturamento: 2180, pedidos: 54, despesas: 410 },
      'Dom': { dia: 'Dom (20/09)', faturamento: 1890, pedidos: 47, despesas: 250 },
    };

    filteredOrders.forEach(order => {
      if (order.status !== 'cancelado') {
        const dateObj = new Date(order.criadoEm);
        const dayKey = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
        const cleanKey = dayKey.charAt(0).toUpperCase() + dayKey.slice(1, 3);
        if (daysMap[cleanKey]) {
          daysMap[cleanKey].faturamento += order.valorTotal * 0.15;
          daysMap[cleanKey].pedidos += 1;
        }
      }
    });

    return Object.values(daysMap);
  }, [filteredOrders]);

  // Gráfico Formas de Pagamento
  const paymentChartData = useMemo(() => {
    const counts: { [key: string]: number } = {
      'Pix': 0,
      'Cartão Crédito': 0,
      'Cartão Débito': 0,
      'Dinheiro': 0
    };

    filteredOrders.forEach(o => {
      if (o.status !== 'cancelado') {
        if (o.formaPagamento === 'pix') counts['Pix'] += o.valorTotal;
        else if (o.formaPagamento === 'cartao_credito') counts['Cartão Crédito'] += o.valorTotal;
        else if (o.formaPagamento === 'cartao_debito') counts['Cartão Débito'] += o.valorTotal;
        else if (o.formaPagamento === 'dinheiro') counts['Dinheiro'] += o.valorTotal;
      }
    });

    if (Object.values(counts).every(v => v === 0)) {
      counts['Pix'] = 1450.50;
      counts['Cartão Crédito'] = 920.00;
      counts['Cartão Débito'] = 680.00;
      counts['Dinheiro'] = 410.00;
    }

    return Object.keys(counts).map(key => ({
      name: key,
      valor: Number(counts[key].toFixed(2))
    }));
  }, [filteredOrders]);

  // Despesas por Categoria
  const expensesCategoryData = useMemo(() => {
    const categoriesMap: { [key: string]: number } = {
      'Ingredientes (Carnes/Queijos)': 450,
      'Embalagens & Sacolas': 120,
      'Gás & Energia': 180,
      'Motoboys / Entregas': 260,
      'Limpeza & Outros': 95,
    };

    filteredTransactions.forEach(t => {
      if (t.tipo === 'saida') {
        const catName = t.categoria === 'ingredientes' ? 'Ingredientes (Carnes/Queijos)' :
                        t.categoria === 'embalagens' ? 'Embalagens & Sacolas' :
                        t.categoria === 'salarios' ? 'Motoboys / Entregas' : 'Limpeza & Outros';
        categoriesMap[catName] = (categoriesMap[catName] || 0) + t.valor;
      }
    });

    return Object.keys(categoriesMap).map(key => ({
      categoria: key,
      valor: categoriesMap[key]
    })).sort((a, b) => b.valor - a.valor);
  }, [filteredTransactions]);

  // Top 5 Produtos
  const topProductsData = useMemo(() => {
    return [
      { nome: 'Pastel Carne c/ Queijo', qtd: 84, faturamento: 1176.00 },
      { nome: 'Pastel Pizza Especial', qtd: 62, faturamento: 806.00 },
      { nome: 'Pastel Frango c/ Catupiry', qtd: 58, faturamento: 812.00 },
      { nome: 'Pastel Doce Nutella/Morango', qtd: 41, faturamento: 656.00 },
      { nome: 'Coca-Cola 350ml', qtd: 96, faturamento: 576.00 },
    ];
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Topo do Módulo com Seletor de Abas */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/15 text-amber-700 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900 tracking-tight">
                Relatórios Financeiros & Vendas
              </h1>
              <p className="text-xs text-stone-500">
                Fechamento de caixa diário por turno e métricas gerenciais da pastelaria
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex items-center gap-2">
          {activeTab === 'fechamento' ? (
            <>
              <button
                type="button"
                onClick={handleExportCashCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-all border border-emerald-200"
                title="Exportar fechamento deste dia para Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar Fechamento (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                title="Imprimir comprovante de fechamento de caixa"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimir Fechamento</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Relatório</span>
            </button>
          )}
        </div>
      </div>

      {/* Navegação Entre as Sub-Abas do Relatório */}
      <div className="flex border-b border-stone-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('fechamento')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-all ${
            activeTab === 'fechamento'
              ? 'border-amber-500 text-amber-800 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <Receipt className="w-4 h-4 text-amber-600" />
          <span>Fechamento de Caixa Diário (Vendas por Dia)</span>
          {dayOrders.length > 0 && (
            <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {dayOrders.length} {dayOrders.length === 1 ? 'pedido' : 'pedidos'}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-all ${
            activeTab === 'analytics'
              ? 'border-amber-500 text-amber-800 bg-amber-50/50 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Painel Analítico & Gráficos</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: FECHAMENTO DE CAIXA DIÁRIO (VENDAS POR DIA) */}
      {/* ========================================================================= */}
      {activeTab === 'fechamento' && (
        <div className="space-y-6">
          
          {/* Barra de Seleção da Data do Fechamento */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Data de Apuração do Caixa
                </span>
                <span className="text-base font-black text-stone-900">
                  {new Date(selectedCashDate + 'T12:00:00').toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {/* Atalhos Rápidos de Data */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCashDate(todayStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCashDate === todayStr 
                    ? 'bg-amber-500 text-stone-950 shadow-xs' 
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  setSelectedCashDate(y.toISOString().slice(0, 10));
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
              >
                Ontem
              </button>

              <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <input
                  type="date"
                  value={selectedCashDate}
                  onChange={(e) => e.target.value && setSelectedCashDate(e.target.value)}
                  className="bg-transparent text-xs text-stone-800 font-bold focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Cards de Resumo do Caixa do Dia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Entrado em Vendas */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-emerald-100 text-xs mb-1">
                <span className="font-bold">Total Entrado em Caixa</span>
                <ArrowDownCircle className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="text-3xl font-black tracking-tight">
                R$ {dayTotals.grossSales.toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-100 mt-2 font-medium flex items-center justify-between">
                <span>{dayOrders.length} {dayOrders.length === 1 ? 'pedido faturado' : 'pedidos faturados'}</span>
                <span>Ticket Médio: R$ {dayTotals.ticketMedio.toFixed(2)}</span>
              </div>
            </div>

            {/* 2. Dinheiro Físico a Conferir na Gaveta */}
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-amber-800 text-xs mb-1">
                <span className="font-bold flex items-center gap-1">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  Dinheiro em Espécie (Gaveta)
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-sm">
                  Conferência Física
                </span>
              </div>
              <div className="text-3xl font-black text-amber-950">
                R$ {dayTotals.payments.dinheiro.total.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-500 mt-2">
                {dayTotals.payments.dinheiro.count} {dayTotals.payments.dinheiro.count === 1 ? 'pedido pago' : 'pedidos pagos'} em dinheiro no caixa
              </div>
            </div>

            {/* 3. Despesas / Saídas do Dia */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span className="font-bold">Despesas / Sangrias do Dia</span>
                <ArrowUpCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-3xl font-black text-rose-600">
                R$ {dayTotals.expenses.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-500 mt-2">
                {dayExpensesTransactions.length} retiradas ou compras de insumos
              </div>
            </div>

            {/* 4. Saldo Líquido do Caixa */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span className="font-bold">Saldo Líquido do Dia</span>
                <Wallet className="w-4 h-4 text-blue-500" />
              </div>
              <div className={`text-3xl font-black ${dayTotals.netCash >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                R$ {dayTotals.netCash.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-500 mt-2 font-medium">
                Vendas líquidas subtraindo saídas
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* HORÁRIO DE PICO & MAPA DE TEMPERATURA (HEATMAP) */}
          {/* ========================================================================= */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            
            {/* Cabeçalho do Mapa de Calor */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-red-500 to-amber-500 text-white rounded-xl shadow-xs">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                    <span>Horário de Pico & Mapa de Temperatura de Atendimento</span>
                    <span className="text-[10px] uppercase font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                      Fluxo Térmico
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Concentração de pedidos e faturamento ao longo dos turnos de atendimento
                  </p>
                </div>
              </div>

              {/* Seletor de Modo de Visualização */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setHeatmapViewMode('day')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    heatmapViewMode === 'day'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hora a Hora do Dia</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapViewMode('weekly')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    heatmapViewMode === 'weekly'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                  <span>Matriz Semanal de Picos</span>
                </button>
              </div>
            </div>

            {/* Banner de Destaque do Horário de Pico Definido */}
            <div className="bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border-2 border-red-200/90 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                <Flame className="w-40 h-40 text-red-600" />
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-xs">
                      <Flame className="w-3 h-3" />
                      Horário de Pico Definido no Dia
                    </span>
                    <span className="text-xs text-red-900/70 font-semibold">
                      {new Date(selectedCashDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-red-950 tracking-tight">
                      {dayPeakAndHeatmap.peakSlot.label}
                    </span>
                    <span className="text-xs font-bold text-red-700 bg-red-100/80 px-2 py-0.5 rounded-md border border-red-200">
                      Pico Máximo de Atendimento
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 max-w-2xl leading-relaxed">
                    Nesta janela de 1 hora foram atendidos <strong className="text-red-900 font-black">{dayPeakAndHeatmap.peakSlot.ordersCount} pedidos</strong>, faturando <strong className="text-red-900 font-black">R$ {dayPeakAndHeatmap.peakSlot.revenue.toFixed(2)}</strong> ({dayPeakAndHeatmap.peakShareRevenue}% de todo o faturamento apurado neste dia).
                  </p>
                </div>

                {/* Métricas Rápidas do Pico */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
                  <div className="bg-white/80 backdrop-blur-xs border border-red-200 rounded-xl p-3 text-center shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Pedidos no Pico</span>
                    <span className="text-lg font-black text-stone-900">{dayPeakAndHeatmap.peakSlot.ordersCount}</span>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xs border border-red-200 rounded-xl p-3 text-center shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Faturamento Pico</span>
                    <span className="text-lg font-black text-red-600">R$ {dayPeakAndHeatmap.peakSlot.revenue.toFixed(0)}</span>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xs border border-red-200 rounded-xl p-3 text-center shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Ticket Médio</span>
                    <span className="text-lg font-black text-stone-900">R$ {dayPeakAndHeatmap.peakTicketMedio.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visualização 1: MAPA DE TEMPERATURA HORA A HORA DO DIA SELECIONADO */}
            {heatmapViewMode === 'day' && (
              <div className="space-y-4">
                {/* Legenda Térmica de Temperatura */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-700 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-amber-600" />
                    Escala de Temperatura:
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-stone-100 border border-stone-300 block" />
                      <span className="text-[11px] text-stone-600 font-medium">Inativo (0)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300 block" />
                      <span className="text-[11px] text-stone-600 font-medium">Suave (1-30%)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-amber-200 border border-amber-400 block" />
                      <span className="text-[11px] text-stone-600 font-medium">Moderado (31-60%)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-orange-400 border border-orange-500 block" />
                      <span className="text-[11px] text-stone-600 font-medium">Intenso (61-85%)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-gradient-to-br from-red-600 to-amber-600 border border-red-700 block shadow-xs" />
                      <span className="text-[11px] text-red-700 font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-red-600" /> Pico Máximo (86-100%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grade Térmica Hora a Hora (Heatmap Cells) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-13 gap-2">
                  {dayPeakAndHeatmap.slots.map(slot => {
                    const isPeak = slot.heatLevel === 'peak';
                    const isHot = slot.heatLevel === 'hot';
                    const isWarm = slot.heatLevel === 'warm';
                    const isMild = slot.heatLevel === 'mild';
                    const isCold = slot.heatLevel === 'cold';

                    return (
                      <div
                        key={slot.hour}
                        className={`rounded-xl p-2.5 transition-all flex flex-col justify-between relative border ${
                          isPeak
                            ? 'bg-gradient-to-b from-red-600 to-amber-600 text-white border-red-700 shadow-sm ring-2 ring-red-400/80 -translate-y-0.5'
                            : isHot
                            ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                            : isWarm
                            ? 'bg-amber-100 text-stone-900 border-amber-300 hover:bg-amber-200'
                            : isMild
                            ? 'bg-emerald-50 text-stone-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-stone-50 text-stone-400 border-stone-200'
                        }`}
                        title={`${slot.label}: ${slot.ordersCount} pedidos (R$ ${slot.revenue.toFixed(2)}) - ${slot.temperatureLabel}`}
                      >
                        {/* Indicador de Pico no Topo */}
                        {isPeak && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-950 text-amber-300 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-xs border border-amber-400/40">
                            <Flame className="w-2.5 h-2.5 text-amber-400" />
                            PICO
                          </div>
                        )}

                        <div className="text-center mb-1">
                          <span className={`text-[11px] font-black block ${
                            isPeak || isHot ? 'text-white' : 'text-stone-900'
                          }`}>
                            {slot.shortLabel}
                          </span>
                          <span className={`text-[9px] block ${
                            isPeak || isHot ? 'text-white/80' : 'text-stone-500'
                          }`}>
                            {slot.label.split(' às ')[0]}
                          </span>
                        </div>

                        {/* Informação Numérica */}
                        <div className="text-center my-1">
                          <div className={`text-base font-black leading-tight ${
                            isPeak || isHot ? 'text-white' : isCold ? 'text-stone-400' : 'text-stone-900'
                          }`}>
                            {slot.ordersCount}
                          </div>
                          <div className={`text-[9px] font-bold ${
                            isPeak || isHot ? 'text-white/85' : isCold ? 'text-stone-400' : 'text-stone-600'
                          }`}>
                            {slot.ordersCount === 1 ? 'pedido' : 'pedidos'}
                          </div>
                        </div>

                        {/* Receita da Hora */}
                        <div className="text-center pt-1 border-t border-white/20">
                          <span className={`text-[10px] font-black block ${
                            isPeak || isHot ? 'text-white' : isCold ? 'text-stone-400' : 'text-stone-800'
                          }`}>
                            R$ {slot.revenue.toFixed(0)}
                          </span>
                        </div>

                        {/* Mini Barra Térmica de Intensidade */}
                        <div className="w-full bg-black/10 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              isPeak ? 'bg-amber-300' : isHot ? 'bg-white' : isWarm ? 'bg-amber-500' : isMild ? 'bg-emerald-500' : 'bg-transparent'
                            }`}
                            style={{ width: `${slot.intensity}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dica Operacional e Resumo da Cozinha */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-950 gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Recomendação de Gestão:</strong> Aqueça as fritadeiras 20 minutos antes das <strong>{dayPeakAndHeatmap.peakSlot.shortLabel}</strong> e escale motoboys extras dedicados para essa faixa de maior temperatura.
                    </span>
                  </div>
                  <span className="text-[11px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md shrink-0">
                    Vazão média: {((dayPeakAndHeatmap.peakSlot.ordersCount) / 1).toFixed(0)} pedidos/hora
                  </span>
                </div>
              </div>
            )}

            {/* Visualização 2: MATRIZ SEMANAL DE PICOS (DIA DA SEMANA x TURNOS) */}
            {heatmapViewMode === 'weekly' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Matriz comparativa de calor histórico para planejamento de equipe:</span>
                  <span className="font-bold text-red-700 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    Sexta e Sábado no Pico Noturno concentram os maiores volumes da pastelaria
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] bg-stone-50">
                        <th className="py-2.5 px-3 font-bold">Dia da Semana</th>
                        {weeklyHeatmapMatrix.shifts.map(sh => (
                          <th key={sh.key} className="py-2.5 px-3 font-bold text-center">
                            <div>{sh.label}</div>
                            <div className="text-[9px] font-normal lowercase text-stone-400">{sh.subLabel}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {weeklyHeatmapMatrix.matrix.map(row => {
                        const isWeekend = row.day.key === 'sex' || row.day.key === 'sab' || row.day.key === 'dom';

                        return (
                          <tr key={row.day.key} className={isWeekend ? 'bg-amber-50/20 font-semibold' : ''}>
                            <td className="py-3 px-3 font-bold text-stone-900 flex items-center gap-2">
                              {isWeekend && <span className="w-2 h-2 rounded-full bg-red-500" />}
                              <span>{row.day.label}</span>
                            </td>

                            {row.shifts.map(sh => {
                              const isPeak = sh.heatLevel === 'peak';
                              const isHot = sh.heatLevel === 'hot';
                              const isWarm = sh.heatLevel === 'warm';
                              const isMild = sh.heatLevel === 'mild';

                              return (
                                <td key={sh.shiftKey} className="py-2 px-2 text-center">
                                  <div className={`p-2.5 rounded-xl border transition-all ${
                                    isPeak 
                                      ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-red-700 shadow-xs font-bold'
                                      : isHot
                                      ? 'bg-orange-500 text-white border-orange-600 shadow-xs font-bold'
                                      : isWarm
                                      ? 'bg-amber-100 text-amber-950 border-amber-300 font-semibold'
                                      : isMild
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                      : 'bg-stone-50 text-stone-400 border-stone-200'
                                  }`}>
                                    <div className="flex items-center justify-center gap-1 text-sm font-black">
                                      {isPeak && <Flame className="w-3.5 h-3.5 text-amber-300" />}
                                      <span>~{sh.orders} ped</span>
                                    </div>
                                    <div className={`text-[10px] mt-0.5 ${
                                      isPeak || isHot ? 'text-white/90 font-medium' : 'text-stone-600'
                                    }`}>
                                      R$ {sh.revenue.toFixed(0)}
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Seção de Conferência por Meio de Pagamento e Canais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Formas de Pagamento (Detalhamento do Caixa) */}
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-600" />
                    Conferência por Meio de Pagamento do Dia
                  </h3>
                  <p className="text-xs text-stone-500">Valores apurados em cada canal financeiro</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Total: R$ {dayTotals.grossSales.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Pix */}
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      Pix (Conta Bancária)
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {dayTotals.payments.pix.count} pedidos
                    </span>
                  </div>
                  <div className="text-xl font-black text-stone-900">
                    R$ {dayTotals.payments.pix.total.toFixed(2)}
                  </div>
                  <div className="mt-1.5 w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${dayTotals.grossSales > 0 ? (dayTotals.payments.pix.total / dayTotals.grossSales) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Cartão de Crédito */}
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Cartão de Crédito (Maquininha)
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {dayTotals.payments.cartao_credito.count} pedidos
                    </span>
                  </div>
                  <div className="text-xl font-black text-stone-900">
                    R$ {dayTotals.payments.cartao_credito.total.toFixed(2)}
                  </div>
                  <div className="mt-1.5 w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${dayTotals.grossSales > 0 ? (dayTotals.payments.cartao_credito.total / dayTotals.grossSales) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Cartão de Débito */}
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      Cartão de Débito (Maquininha)
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {dayTotals.payments.cartao_debito.count} pedidos
                    </span>
                  </div>
                  <div className="text-xl font-black text-stone-900">
                    R$ {dayTotals.payments.cartao_debito.total.toFixed(2)}
                  </div>
                  <div className="mt-1.5 w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all"
                      style={{ width: `${dayTotals.grossSales > 0 ? (dayTotals.payments.cartao_debito.total / dayTotals.grossSales) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Dinheiro Físico */}
                <div className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-amber-600" />
                      Dinheiro Físico (Gaveta)
                    </span>
                    <span className="text-[11px] text-amber-800 font-medium">
                      {dayTotals.payments.dinheiro.count} pedidos
                    </span>
                  </div>
                  <div className="text-xl font-black text-amber-950">
                    R$ {dayTotals.payments.dinheiro.total.toFixed(2)}
                  </div>
                  <div className="mt-1.5 w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full transition-all"
                      style={{ width: `${dayTotals.grossSales > 0 ? (dayTotals.payments.dinheiro.total / dayTotals.grossSales) * 100 : 0}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Divisão por Canal e Taxas */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2 mb-1">
                  <Store className="w-4 h-4 text-stone-700" />
                  Divisão por Canal de Atendimento
                </h3>
                <p className="text-xs text-stone-500 mb-4">Volume faturado entre delivery e balcão</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="text-xs font-bold text-stone-800 block">Delivery (Entrega)</span>
                        <span className="text-[11px] text-stone-500">{dayTotals.channels.delivery.count} entregas</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-stone-900">
                      R$ {dayTotals.channels.delivery.total.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="text-xs font-bold text-stone-800 block">Retirada no Balcão</span>
                        <span className="text-[11px] text-stone-500">{dayTotals.channels.retirada.count} retiradas</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-stone-900">
                      R$ {dayTotals.channels.retirada.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                <span>Taxas de entrega recebidas:</span>
                <span className="font-bold text-stone-900">R$ {dayTotals.deliveryFees.toFixed(2)}</span>
              </div>
            </div>

          </div>

          {/* Tabela dos Pedidos Detalhados do Dia Selecionado */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  Pedidos do Dia ({new Date(selectedCashDate + 'T12:00:00').toLocaleDateString('pt-BR')})
                </h3>
                <p className="text-xs text-stone-500">Relação completa de pedidos faturados nesta data</p>
              </div>
              <span className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg font-bold">
                {dayOrders.length} {dayOrders.length === 1 ? 'pedido listado' : 'pedidos listados'}
              </span>
            </div>

            {dayOrders.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-stone-200 rounded-xl bg-stone-50">
                <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-700">Nenhum pedido registrado nesta data específica.</p>
                <p className="text-xs text-stone-400 mt-1">
                  Selecione outro dia no seletor ou consulte a tabela histórica abaixo para ver os dias com vendas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-2 font-bold">Hora</th>
                      <th className="py-3 px-2 font-bold">Nº Pedido</th>
                      <th className="py-3 px-2 font-bold">Cliente</th>
                      <th className="py-3 px-2 font-bold">Canal</th>
                      <th className="py-3 px-2 font-bold">Itens do Pedido</th>
                      <th className="py-3 px-2 font-bold">Forma Pagto</th>
                      <th className="py-3 px-2 font-bold">Status Pagto</th>
                      <th className="py-3 px-2 font-bold text-right">Taxa Entrega</th>
                      <th className="py-3 px-2 font-bold text-right">Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {dayOrders.map(order => {
                      const timeStr = new Date(order.criadoEm).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                      const itemsSummary = order.itens.map(i => `${i.quantidade}x ${i.nomeProduto}`).join(', ');

                      return (
                        <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-2 font-mono text-stone-500 font-bold">
                            {timeStr}
                          </td>
                          <td className="py-3 px-2 font-mono font-black text-amber-700">
                            #{order.numeroSequencial}
                          </td>
                          <td className="py-3 px-2 font-medium text-stone-800">
                            {order.clienteNome}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              order.tipoEntrega === 'delivery' 
                                ? 'bg-amber-100 text-amber-900' 
                                : 'bg-blue-100 text-blue-900'
                            }`}>
                              {order.tipoEntrega === 'delivery' ? '🛵 Entrega' : '🏪 Balcão'}
                            </span>
                          </td>
                          <td className="py-3 px-2 max-w-xs truncate text-stone-600" title={itemsSummary}>
                            {itemsSummary}
                          </td>
                          <td className="py-3 px-2">
                            <span className="capitalize font-bold text-stone-700">
                              {order.formaPagamento.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.statusPagamento === 'pago'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.statusPagamento === 'pago' ? 'Pago' : 'Na Entrega'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-stone-600">
                            R$ {order.taxaEntrega.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-black text-stone-900">
                            R$ {order.valorTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-stone-300 font-bold text-stone-900 bg-stone-50/60">
                      <td colSpan={7} className="py-3 px-2 text-right uppercase tracking-wider text-[11px]">
                        Total Faturado no Dia:
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-stone-700">
                        R$ {dayTotals.deliveryFees.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-black text-emerald-600 text-sm">
                        R$ {dayTotals.grossSales.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* TABELA CONSOLIDADA: HISTÓRICO DE VENDAS POR DIA */}
          {/* ========================================================= */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Histórico Consolidado de Vendas por Dia (Fechamento Diário)
                </h3>
                <p className="text-xs text-stone-500">
                  Clique em "Ver Fechamento" em qualquer dia para inspecionar os valores daquela data
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] bg-stone-50/50">
                    <th className="py-3 px-3 font-bold">Data</th>
                    <th className="py-3 px-2 font-bold text-center">Pedidos</th>
                    <th className="py-3 px-2 font-bold text-center">Pico Atendimento</th>
                    <th className="py-3 px-2 font-bold text-right">Pix (R$)</th>
                    <th className="py-3 px-2 font-bold text-right">Cartão (R$)</th>
                    <th className="py-3 px-2 font-bold text-right">Dinheiro (R$)</th>
                    <th className="py-3 px-2 font-bold text-right">Total Bruto (R$)</th>
                    <th className="py-3 px-2 font-bold text-right">Despesas (R$)</th>
                    <th className="py-3 px-2 font-bold text-right">Saldo Líquido (R$)</th>
                    <th className="py-3 px-3 font-bold text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {dailyHistoryTable.map(item => {
                    const isSelected = item.date === selectedCashDate;
                    const dateFormatted = new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit'
                    });

                    return (
                      <tr 
                        key={item.date} 
                        className={`transition-colors ${
                          isSelected 
                            ? 'bg-amber-50/80 font-semibold' 
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <td className="py-3 px-3 font-medium text-stone-900 flex items-center gap-2">
                          {isSelected && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                          <span className="capitalize">{dateFormatted}</span>
                          {item.date === todayStr && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-sm">
                              Hoje
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-stone-700">
                          {item.ordersCount}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <Flame className="w-3 h-3 text-red-500" />
                            {item.date === selectedCashDate ? dayPeakAndHeatmap.peakSlot.shortLabel : '19h - 20h'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-stone-700">
                          R$ {item.pix.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-stone-700">
                          R$ {item.cartao.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-amber-900">
                          R$ {item.dinheiro.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-black text-stone-950">
                          R$ {item.totalBruto.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-rose-600">
                          R$ {item.despesas.toFixed(2)}
                        </td>
                        <td className={`py-3 px-2 text-right font-mono font-black ${
                          item.saldoLiquido >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          R$ {item.saldoLiquido.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedCashDate(item.date)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                              isSelected
                                ? 'bg-amber-500 text-stone-950'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            }`}
                          >
                            {isSelected ? 'Selecionado' : 'Ver Fechamento'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: PAINEL ANALÍTICO & GRÁFICOS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Painel de Filtros Avançados */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-amber-600" />
              Filtros Analíticos de Consulta
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Período Predefinido</label>
                <select
                  value={periodPreset}
                  onChange={(e) => setPeriodPreset(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="today">Hoje</option>
                  <option value="7days">Últimos 7 dias</option>
                  <option value="30days">Últimos 30 dias (Mês Atual)</option>
                  <option value="all">Todo o Período</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Categoria de Produto</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Forma de Pagamento</label>
                <select
                  value={selectedPayment}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="all">Todas as Formas</option>
                  <option value="pix">Pix</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="dinheiro">Dinheiro Físico</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Canal de Venda</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="all">Todos os Canais</option>
                  <option value="delivery">Delivery (Entrega em Domicílio)</option>
                  <option value="retirada">Retirada no Balcão</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Data Início / Fim</label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-1/2 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-[11px] text-stone-800"
                  />
                  <span className="text-stone-400 text-xs">a</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-1/2 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-[11px] text-stone-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cards de KPIs Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span>Faturamento Bruto</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-stone-900">
                R$ {totalFaturamento.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+14.2% vs. período anterior</span>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span>Total de Pedidos</span>
                <ShoppingBag className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-stone-900">
                {totalPedidos}
              </div>
              <div className="text-[11px] text-stone-500 mt-2">
                Média de <strong>{(totalPedidos / 7).toFixed(1)}</strong> pedidos/dia
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span>Ticket Médio</span>
                <CreditCard className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-stone-900">
                R$ {ticketMedio.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-500 mt-2">
                Por cliente atendido
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span>Despesas Operacionais</span>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600">
                R$ {totalDespesas.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-500 mt-2">
                Insumos, gás e taxas
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span>Lucro Líquido Estimado</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className={`text-2xl font-black ${lucroOperacional >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                R$ {lucroOperacional.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-600 font-bold mt-2">
                Margem: <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">{margemLucro.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-600" />
                    Evolução Diária de Vendas e Despesas (R$)
                  </h3>
                  <p className="text-xs text-stone-500">Comparativo entre faturamento bruto e custos do dia</p>
                </div>
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-md font-mono">
                  Semana Vigente
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip 
                      formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
                      contentStyle={{ backgroundColor: '#1c1917', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="faturamento" 
                      name="Faturamento Bruto" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorFat)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="despesas" 
                      name="Despesas" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorDesp)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-emerald-600" />
                  Faturamento por Forma de Pagamento
                </h3>
                <p className="text-xs text-stone-500">Distribuição do volume financeiro</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="valor"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']}
                      contentStyle={{ backgroundColor: '#1c1917', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 mt-2">
                {paymentChartData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-stone-700">{item.name}</span>
                    </div>
                    <span className="font-bold text-stone-900">R$ {item.valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  Detalhamento de Custos Operacionais
                </h3>
                <p className="text-xs text-stone-500">Onde a pastelaria mais gasta no período</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={expensesCategoryData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="categoria" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip 
                      formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Custo']}
                      contentStyle={{ backgroundColor: '#1c1917', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="valor" fill="#ef4444" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    Top 5 Itens Mais Vendidos (Curva ABC)
                  </h3>
                  <p className="text-xs text-stone-500">Os pastéis e bebidas que mais geram receita</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                  Mais Vendidos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      <th className="py-2.5 font-bold">Produto</th>
                      <th className="py-2.5 font-bold text-center">Unidades</th>
                      <th className="py-2.5 font-bold text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {topProductsData.map((item, index) => (
                      <tr key={item.nome} className="hover:bg-stone-50 transition-colors">
                        <td className="py-2.5 font-medium text-stone-800 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 font-bold flex items-center justify-center text-[10px]">
                            {index + 1}
                          </span>
                          <span>{item.nome}</span>
                        </td>
                        <td className="py-2.5 text-center font-bold text-stone-700">
                          {item.qtd} un
                        </td>
                        <td className="py-2.5 text-right font-black text-stone-900">
                          R$ {item.faturamento.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

