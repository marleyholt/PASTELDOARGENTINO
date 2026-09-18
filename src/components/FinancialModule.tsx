import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Calendar, 
  CreditCard, 
  Receipt, 
  Lock, 
  Unlock 
} from 'lucide-react';
import { Order, FinancialTransaction, PaymentMethod } from '../types';

interface FinancialModuleProps {
  orders: Order[];
  transactions: FinancialTransaction[];
  onAddTransaction: (trx: FinancialTransaction) => void;
}

export const FinancialModule: React.FC<FinancialModuleProps> = ({
  orders,
  transactions,
  onAddTransaction,
}) => {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseValue, setExpenseValue] = useState('');
  const [expenseCat, setExpenseCat] = useState<FinancialTransaction['categoria']>('ingredientes');
  const [expensePayment, setExpensePayment] = useState<PaymentMethod>('pix');
  const [cashRegisterOpen, setCashRegisterOpen] = useState(true);
  const [initialCash, setInitialCash] = useState(150.00); // Fundo de troco do dia

  // Calcular totais de vendas finalizadas
  const completedOrders = orders.filter(o => o.status === 'entregue' || o.statusPagamento === 'pago');
  
  const totalSales = completedOrders.reduce((sum, o) => sum + o.valorTotal, 0);
  
  const salesByPayment: Record<PaymentMethod, number> = {
    pix: 0,
    cartao_credito: 0,
    cartao_debito: 0,
    dinheiro: 0,
  };

  completedOrders.forEach(o => {
    salesByPayment[o.formaPagamento] = (salesByPayment[o.formaPagamento] || 0) + o.valorTotal;
  });

  const totalExpenses = transactions
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + t.valor, 0);

  const netBalance = totalSales - totalExpenses;
  const cashInDrawer = initialCash + (salesByPayment.dinheiro || 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(expenseValue);
    if (!expenseDesc.trim() || isNaN(val) || val <= 0) return;

    const newTrx: FinancialTransaction = {
      id: `trx-${Date.now()}`,
      tipo: 'saida',
      categoria: expenseCat,
      descricao: expenseDesc.trim(),
      valor: val,
      formaPagamento: expensePayment,
      data: new Date().toISOString(),
    };

    onAddTransaction(newTrx);
    setShowExpenseModal(false);
    setExpenseDesc('');
    setExpenseValue('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-amber-600" />
            Gestão Financeira & Fechamento de Caixa
          </h1>
          <p className="text-xs text-stone-600">
            Controle de fluxo de caixa, divisão por forma de pagamento (Pix, Cartão, Dinheiro) e despesas do dia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCashRegisterOpen(!cashRegisterOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              cashRegisterOpen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-stone-200 text-stone-700 border-stone-300'
            }`}
          >
            {cashRegisterOpen ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4" />}
            {cashRegisterOpen ? 'Caixa Aberto (Operando)' : 'Caixa Encerrado'}
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            Lançar Despesa / Saída
          </button>
        </div>
      </div>

      {/* Cartões de Indicadores Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento Bruto</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            R$ {totalSales.toFixed(2)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {completedOrders.length} pedidos concluídos
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Despesas / Saídas</span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-700">
            R$ {totalExpenses.toFixed(2)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Custos operacionais e insumos
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Resultado Líquido</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className={`text-2xl font-black ${netBalance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            R$ {netBalance.toFixed(2)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Entradas - Despesas
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Dinheiro na Gaveta</span>
            <Receipt className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900">
            R$ {cashInDrawer.toFixed(2)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Troco inicial (R$ {initialCash.toFixed(2)}) + vendas
          </p>
        </div>
      </div>

      {/* Detalhamento por Forma de Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs lg:col-span-1">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            Entradas por Forma de Pagamento
          </h2>

          <div className="space-y-3">
            {[
              { label: '💠 Pix Online / QR', val: salesByPayment.pix, color: 'bg-emerald-500' },
              { label: '💳 Cartão de Crédito', val: salesByPayment.cartao_credito, color: 'bg-blue-500' },
              { label: '💳 Cartão de Débito', val: salesByPayment.cartao_debito, color: 'bg-cyan-500' },
              { label: '💵 Dinheiro em Espécie', val: salesByPayment.dinheiro, color: 'bg-amber-500' },
            ].map(item => {
              const pct = totalSales > 0 ? (item.val / totalSales) * 100 : 0;
              return (
                <div key={item.label} className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-stone-700">{item.label}</span>
                    <span className="text-stone-900">R$ {item.val.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-right text-[10px] text-stone-400 mt-0.5">{pct.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Extrato Recente de Transações / Despesas */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              Lançamentos Financeiros do Turno
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5 rounded-l-lg">Tipo</th>
                    <th className="px-3 py-2.5">Descrição</th>
                    <th className="px-3 py-2.5">Categoria</th>
                    <th className="px-3 py-2.5">Pagamento</th>
                    <th className="px-3 py-2.5 text-right rounded-r-lg">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-stone-50">
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                          t.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-stone-900 font-semibold">{t.descricao}</td>
                      <td className="px-3 py-2.5 text-stone-500 capitalize">{t.categoria.replace('_', ' ')}</td>
                      <td className="px-3 py-2.5 text-stone-600 uppercase text-[10px]">{t.formaPagamento}</td>
                      <td className={`px-3 py-2.5 text-right font-black ${
                        t.tipo === 'entrada' ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {t.tipo === 'entrada' ? '+' : '-'} R$ {t.valor.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Demonstrativo financeiro integrado em tempo real aos pedidos.</span>
          </div>
        </div>
      </div>

      {/* Modal de Lançar Despesa */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateExpense} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">
              Lançamento de Despesa / Saída de Caixa
            </h3>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Descrição do Gasto *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Compra de 2 botijões de gás P45"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  required
                  placeholder="120.00"
                  value={expenseValue}
                  onChange={(e) => setExpenseValue(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <select
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                >
                  <option value="ingredientes">Ingredientes / Recheios</option>
                  <option value="embalagens">Embalagens & Sacos</option>
                  <option value="salarios">Diárias & Pagamentos</option>
                  <option value="utilidades">Gás, Luz & Água</option>
                  <option value="outros">Outros Gastos</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Saiu de Onde? (Forma de Pagamento)
              </label>
              <select
                value={expensePayment}
                onChange={(e) => setExpensePayment(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="dinheiro">Dinheiro da Gaveta do Caixa</option>
                <option value="pix">Conta Bancária / Pix</option>
                <option value="cartao_debito">Cartão de Débito da Pastelaria</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm font-semibold hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-xs"
              >
                Registrar Despesa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
