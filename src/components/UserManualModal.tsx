import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  CheckCircle2, 
  Sparkles, 
  ChefHat, 
  Truck, 
  Kanban, 
  DollarSign, 
  Settings, 
  ShoppingBag, 
  Clock, 
  Printer, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight,
  HelpCircle,
  Zap,
  BadgeCheck
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop escuro com desfoque */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Janela Principal do Manual */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho do Modal */}
        <div className="bg-stone-900 text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              🥟
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Manual de Operação Passo a Passo
                </h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Pastel do Argentino
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Guia prático para a equipe de atendimento, caixa, cozinha e entregadores.
              </p>
            </div>
          </div>

          {/* Botões do Topo */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-bold transition-all border border-stone-700"
              title="Imprimir ou Salvar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              aria-label="Fechar manual"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Conteúdo com rolagem suave */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 text-stone-800">
          <div className="space-y-8">
            
            {/* Introdução Amigável */}
            <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  Como o sistema organiza sua pastelaria
                </h3>
                <p className="text-xs sm:text-sm text-amber-900/80 mt-1 max-w-3xl">
                  Este sistema foi pensado para acabar com papéis perdidos, erros de anotação de pedidos no balcão e confusão de troco com motoboys. Ele conecta o cliente, a fritadeira e as entregas em uma única esteira sincronizada a cada 15 segundos.
                </p>
              </div>

              <div className="bg-white/90 border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-900 shrink-0 text-center">
                <span className="block text-amber-600 font-extrabold text-sm">100% Digital</span>
                Sem comandas de papel
              </div>
            </div>

            {/* Seletor Rápido de Etapas Operacionais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { num: 1, title: '1. Ajustes Iniciais', icon: Settings },
                { num: 2, title: '2. Cardápio & Pedidos', icon: ShoppingBag },
                { num: 3, title: '3. Pipeline Kanban', icon: Kanban },
                { num: 4, title: '4. Cozinha / KDS', icon: ChefHat },
                { num: 5, title: '5. Entrega & Motoboy', icon: Truck },
                { num: 6, title: '6. Fechamento de Caixa', icon: DollarSign },
                { num: 7, title: '7. Alertas Sonoros', icon: Zap },
              ].map(step => {
                const Icon = step.icon;
                const isCurrent = activeStep === step.num;

                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => setActiveStep(step.num)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                      isCurrent
                        ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-102'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-amber-600'}`} />
                    <span className="text-[11px] font-black leading-tight line-clamp-2">
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Detalhamento do Passo Selecionado */}
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-5 sm:p-7 shadow-xs">
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
                    <Settings className="w-4 h-4" /> Passo 1 de 7 • Preparação
                  </div>
                  <h3 className="text-xl font-black text-stone-900">
                    Configurações Iniciais da Pastelaria
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Antes de abrir a loja no primeiro dia, o administrador ajusta as informações básicas na aba <strong>Configurações</strong>:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Zonas e Taxas de Entrega
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Cadastre os bairros que você atende e o valor do frete (ex: Centro R$ 5,00, Bairro Norte R$ 8,00). O cardápio calcula o total sozinho com base no bairro selecionado pelo cliente.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Cardápio & Recheios Extras
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Defina seus pastéis tradicionais, especiais, doces e bebidas. Adicione opcionais lucrativos (ex: catupiry original, queijo dobro, bacon, milho) com seus respectivos preços.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Cadastro de Motoboys
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Adicione cada entregador pelo nome, número de registro (ex: "1", "2") e senha simples. Isso permite que ele acerte o caixa e veja suas corridas individualmente.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Senha da Cozinha e Caixa
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        O chapeiro e o operador de caixa podem logar com senhas rápidas direto na tela inicial sem precisar expor senhas mestras de administrador.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
                    <ShoppingBag className="w-4 h-4" /> Passo 2 de 7 • Atendimento
                  </div>
                  <h3 className="text-xl font-black text-stone-900">
                    Como o Cliente Faz o Pedido (Cardápio Digital)
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    O link do cardápio pode ser enviado pelo WhatsApp ou colocado na biografia do Instagram:
                  </p>
                  <ol className="space-y-3 pt-2 text-sm text-stone-700">
                    <li className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                      <div>
                        <strong className="text-stone-900">Seleção dos Pastéis:</strong>
                        <p className="text-xs text-stone-500 mt-0.5">O cliente escolhe entre sabores doces e salgados, adiciona adicionais como Catupiry ou Queijo Extra, e pode digitar observações (ex: "Sem azeitona", "Massa bem fritinha").</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                      <div>
                        <strong className="text-stone-900">Forma de Retirada ou Entrega:</strong>
                        <p className="text-xs text-stone-500 mt-0.5">Ele escolhe "Entrega em Casa" (selecionando o bairro e endereço completo) ou "Retirar no Balcão" da pastelaria.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                      <div>
                        <strong className="text-stone-900">Pagamento & Troco Automático:</strong>
                        <p className="text-xs text-stone-500 mt-0.5">Se escolher Dinheiro, ele informa se precisa de troco (ex: "Troco para R$ 50,00"). Se for Pix, o sistema gera a chave Copia e Cola na tela. Ao confirmar, o pedido cai automaticamente na esteira do restaurante!</p>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
                    <Kanban className="w-4 h-4" /> Passo 3 de 7 • Salão & Despacho
                  </div>
                  <h3 className="text-xl font-black text-stone-900">
                    Gerenciando o Pipeline Kanban em Tempo Real
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    A tela do Kanban é o centro de controle da pastelaria. Os pedidos percorrem as colunas até a entrega final:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                      <div className="font-bold text-xs text-amber-900 mb-1">1. Novo Pedido</div>
                      <p className="text-[11px] text-amber-800 leading-snug">Acabou de chegar. O atendente confere e envia para a cozinha com um clique.</p>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-2xl border border-orange-200">
                      <div className="font-bold text-xs text-orange-900 mb-1">2. Na Cozinha</div>
                      <p className="text-[11px] text-orange-800 leading-snug">Está sendo recheado e frito na temperatura ideal na fritadeira.</p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                      <div className="font-bold text-xs text-blue-900 mb-1">3. Pronto / Despacho</div>
                      <p className="text-[11px] text-blue-800 leading-snug">Pastel escorrido e embalado no saquinho térmico aguardando o motoboy.</p>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200">
                      <div className="font-bold text-xs text-purple-900 mb-1">4. Em Rota</div>
                      <p className="text-[11px] text-purple-800 leading-snug">Saiu na bag do entregador a caminho da casa do cliente.</p>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                      <div className="font-bold text-xs text-emerald-900 mb-1">5. Concluído</div>
                      <p className="text-[11px] text-emerald-800 leading-snug">Entregue com sucesso e pagamento computado no caixa.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
                    <ChefHat className="w-4 h-4" /> Passo 4 de 7 • Fritadeira
                  </div>
                  <h3 className="text-xl font-black text-stone-900">
                    Display da Cozinha (KDS sem Papel)
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Coloque um tablet ou monitor barato na frente da bancada da cozinha. Ele substitui 100% as impressões em papel:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        Temporizador Visual
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Cada comanda mostra os minutos corridos desde a entrada do pedido. Cartões que passam de 15 minutos mudam de cor para avisar urgência na fritura.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Checklist Interativo de Itens
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        O chapeiro toca na tela em cima de cada pastel recheado para riscar e confirmar. Quando todos os pastéis da comanda estiverem prontos, clica em "Marcar Pronto" para chamar o motoboy.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
                    <Truck className="w-4 h-4" /> Passo 5 de 7 • Rua & Entregadores
                  </div>
                  <h3 className="text-xl font-black text-stone-900">
                    Módulo dos Motoboys (App do Entregador)
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    O entregador faz login com seu nome ou código e tem todas as informações na palma da mão:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <strong className="text-xs font-bold text-stone-900 block mb-1">🗺️ Rota no GPS com 1 Toque</strong>
                      <p className="text-xs text-stone-600">Botão direto que abre o Google Maps ou Waze com a localização exata da casa do cliente.</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <strong className="text-xs font-bold text-stone-900 block mb-1">💵 Alerta de Troco Explícito</strong>
                      <p className="text-xs text-stone-600">Se o cliente vai pagar em dinheiro vivo, a tela avisa exatamente quanto de troco o motoboy precisa levar no bolso.</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <strong className="text-xs font-bold text-stone-900 block mb-1">✅ Confirmação de Entrega</strong>
                      <p className="text-xs text-stone-600">Ao entregar o pastel, o motoboy confirma na tela e o pedido vai para "Concluído" automaticamente.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
                    <DollarSign className="w-4 h-4" /> Passo 6 de 7 • Financeiro
                  </div>
                  <h3 className="text-xl font-black text-stone-900">
                    Fechamento de Caixa e Acerto dos Entregadores
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    No final do expediente, na aba <strong>Caixa</strong>, o gerente faz o fechamento com precisão:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <h4 className="font-bold text-stone-900 text-sm mb-1.5">Acerto Individual por Motoboy</h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        O sistema calcula exatamente quanto cada motoboy recolheu em dinheiro na rua, quantas entregas fez e qual o valor que deve repassar para o caixa da loja.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-stone-200">
                      <h4 className="font-bold text-stone-900 text-sm mb-1.5">Totalizadores por Forma de Pagamento</h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Separação limpa entre Pix, Cartão de Crédito/Débito e Dinheiro Vivo, permitindo conferência contra o extrato bancário e a maquininha física de cartão.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 7 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
                    <Zap className="w-4 h-4" /> Passo 7 de 7 • Automação
                  </div>
                  <h3 className="text-xl font-black text-stone-900">
                    Sons de Alerta e Auto-Check a cada 15 Segundos
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Você não precisa ficar apertando F5 ou recarregando a página. O sistema monitora o banco de dados do <strong>Pastel do Argentino</strong> a cada 15 segundos:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300">
                      <strong className="text-xs font-black text-amber-950 block">🔔 Novo Pedido</strong>
                      <p className="text-xs text-amber-900 mt-1">Toca sino de pedido e notifica no topo da tela com os dados do cliente.</p>
                    </div>

                    <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-300">
                      <strong className="text-xs font-black text-orange-950 block">👨‍🍳 Saiu da Cozinha</strong>
                      <p className="text-xs text-orange-900 mt-1">Avisa o despachante com sino metálico que a fritura está pronta para embalo.</p>
                    </div>

                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300">
                      <strong className="text-xs font-black text-emerald-950 block">🛵 Pedido Entregue</strong>
                      <p className="text-xs text-emerald-900 mt-1">Confirma a entrega e atualiza o acerto financeiro do motoboy no Kanban.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé com atalho rápido */}
        <div className="bg-stone-100 border-t border-stone-200 p-3 sm:p-4 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Pastel do Argentino • Manual Operacional Passo a Passo</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-400">Pressione ESC para fechar</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold transition-colors"
            >
              Fechar Manual
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
