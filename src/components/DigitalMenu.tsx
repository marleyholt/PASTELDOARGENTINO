import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  Send, 
  QrCode, 
  Check, 
  Clock, 
  MapPin, 
  Copy,
  AlertCircle,
  MessageCircle,
  Navigation,
  Store,
  Lock,
  Calendar
} from 'lucide-react';
import { Product, Category, ProductExtra, DeliveryZone, StoreConfig, Order, OrderItem, PaymentMethod } from '../types';

interface DigitalMenuProps {
  config: StoreConfig;
  categories: Category[];
  products: Product[];
  extras: ProductExtra[];
  deliveryZones: DeliveryZone[];
  onCreateOrder: (order: Order) => void;
  onOpenTracking?: (orderId: string) => void;
}

export const DigitalMenu: React.FC<DigitalMenuProps> = ({
  config,
  categories,
  products,
  extras,
  deliveryZones,
  onCreateOrder,
  onOpenTracking,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showStoreClosedModal, setShowStoreClosedModal] = useState(false);

  // Status da loja (default: aberta)
  const isStoreOpen = config.lojaAberta !== false;

  // Modal de Personalização do Pastel
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [itemNote, setItemNote] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Dados do Checkout do Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'retirada'>('delivery');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(deliveryZones[0]?.id || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [changeFor, setChangeFor] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderFinished, setOrderFinished] = useState<Order | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const activeCategories = categories.filter(c => c.ativo);
  // Itens pausados (esgotados) são retirados temporariamente do cardápio do cliente
  const activeProducts = products.filter(p => p.ativo && !p.pausado && (selectedCategory === 'all' || p.categoriaId === selectedCategory));

  const openCustomizer = (product: Product) => {
    if (product.pausado) return;
    if (!isStoreOpen) {
      setShowStoreClosedModal(true);
      return;
    }
    setCustomizingProduct(product);
    setSelectedExtras([]);
    setItemNote('');
    setItemQuantity(1);
  };

  const toggleExtra = (extra: ProductExtra) => {
    if (selectedExtras.some(e => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const handleAddToCart = () => {
    if (!customizingProduct) return;

    const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.preco, 0);
    const unitPrice = customizingProduct.preco + extrasTotal;
    const subtotal = unitPrice * itemQuantity;

    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      produtoId: customizingProduct.id,
      nomeProduto: customizingProduct.nome,
      precoUnitario: customizingProduct.preco,
      quantidade: itemQuantity,
      observacao: itemNote.trim(),
      adicionais: selectedExtras.map(e => ({ id: e.id, nome: e.nome, preco: e.preco })),
      subtotal: subtotal,
    };

    const productName = customizingProduct.nome;
    const qty = itemQuantity;

    setCart([...cart, newItem]);
    // Fecha o modal do pastel e PERMANECE no cardápio para o cliente escolher mais itens
    setCustomizingProduct(null);

    // Feedback visual amigável confirmando adição
    setAddedToast(`✓ ${qty}x "${productName}" adicionado à sacola! Escolha mais itens ou clique em "Ver Pedido".`);
    setTimeout(() => {
      setAddedToast(null);
    }, 4000);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId);
  const deliveryFee = orderType === 'delivery' ? (selectedZone?.taxa || 0) : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(config.chavePix);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleFinishOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStoreOpen) {
      setShowStoreClosedModal(true);
      return;
    }
    if (cart.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor, informe seu Nome e Telefone/WhatsApp.');
      return;
    }

    if (orderType === 'delivery' && (!streetAddress.trim() || !streetNumber.trim())) {
      alert('Por favor, informe o endereço e número para a entrega.');
      return;
    }

    // Validação estrita do troco para pagamento em dinheiro
    let finalChangeValue: number | undefined = undefined;
    if (paymentMethod === 'dinheiro') {
      const changeNum = parseFloat(changeFor);
      if (isNaN(changeNum) || changeNum < cartTotal) {
        alert(`Para pagamento em dinheiro, é obrigatório informar com quanto vai pagar (valor igual ou maior que R$ ${cartTotal.toFixed(2)}) para calcularmos o troco exato.`);
        return;
      }
      finalChangeValue = changeNum;
    }

    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      numeroSequencial: orderNumber,
      clienteNome: customerName.trim(),
      clienteTelefone: customerPhone.trim(),
      tipoEntrega: orderType,
      enderecoEntrega: orderType === 'delivery' ? {
        logradouro: streetAddress.trim(),
        numero: streetNumber.trim(),
        complemento: complement.trim(),
        bairro: selectedZone?.bairro || 'Centro',
      } : undefined,
      itens: cart,
      subtotal: cartSubtotal,
      taxaEntrega: deliveryFee,
      desconto: 0,
      valorTotal: cartTotal,
      formaPagamento: paymentMethod,
      statusPagamento: paymentMethod === 'pix' ? 'pago' : 'na_entrega',
      trocoPara: finalChangeValue,
      status: 'novo',
      observacoesGerais: orderNotes.trim(),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    onCreateOrder(newOrder);
    setOrderFinished(newOrder);
    setCart([]);
  };

  const generateWhatsAppUrl = (order: Order) => {
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

    let msg = config.mensagemWhatsappPadrao
      .replace('{loja}', config.nome)
      .replace('{numero}', order.numeroSequencial.toString())
      .replace('{cliente}', order.clienteNome)
      .replace('{telefone}', order.clienteTelefone)
      .replace('{tipo_entrega}', order.tipoEntrega === 'delivery' ? 'Entrega em Domicílio' : 'Retirada no Balcão')
      .replace('{endereco}', addressText)
      .replace('{itens}', itemsText.trim())
      .replace('{taxa_entrega}', order.taxaEntrega.toFixed(2))
      .replace('{total}', order.valorTotal.toFixed(2))
      .replace('{pagamento}', paymentNames[order.formaPagamento])
      .replace('{observacoes}', order.observacoesGerais ? `📝 *Observação:* ${order.observacoesGerais}` : '');

    return `https://wa.me/${config.whatsappOficial}?text=${encodeURIComponent(msg)}`;
  };

  const generateWhatsAppProofUrl = (order: Order) => {
    const proofMsg = `Olá, equipe da *${config.nome}*! 👋\n` +
      `Acabei de fazer o *Pedido #${order.numeroSequencial}* no valor de *R$ ${order.valorTotal.toFixed(2)}* e estou enviando o meu comprovante de pagamento via PIX.\n\n` +
      `👤 *Cliente:* ${order.clienteNome}\n` +
      `📱 *Telefone:* ${order.clienteTelefone}\n\n` +
      `Segue a foto/comprovante em anexo! Obrigado! 🥟`;
    return `https://wa.me/${config.whatsappOficial}?text=${encodeURIComponent(proofMsg)}`;
  };

  return (
    <div id="digital-menu-container" className="max-w-4xl mx-auto px-4 py-6 relative">
      {/* Toast flutuante de item adicionado */}
      {addedToast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 animate-fade-in">
          <div className="bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between text-xs font-bold border border-amber-500/50">
            <span className="text-amber-300">{addedToast}</span>
            <button
              type="button"
              onClick={() => setAddedToast(null)}
              className="ml-2 text-stone-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Banner / Cabeçalho da Pastelaria */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-6 text-white mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <img
            src={config.logotipoUrl}
            alt={config.nome}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40 shadow-sm"
          />
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-black tracking-tight">{config.nome}</h1>
            <p className="text-amber-100 text-xs mt-0.5 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {config.enderecoCompleto}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="bg-amber-900/40 text-amber-200 text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> {config.horarioFuncionamento}
              </span>
              {isStoreOpen ? (
                <span className="bg-emerald-500/30 text-emerald-100 text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  🥟 Loja Aberta
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowStoreClosedModal(true)}
                  className="bg-rose-500 text-white text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 hover:bg-rose-400 cursor-pointer shadow-xs animate-pulse"
                >
                  <Lock className="w-3 h-3" /> Loja Fechada Agora
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner de Loja Fechada com Mensagem de Desculpas e Horários */}
      {!isStoreOpen && (
        <div id="banner-loja-fechada-cliente" className="mb-6 bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 border-2 border-rose-500/70 rounded-2xl p-5 text-white shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center shrink-0 text-rose-300">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                    Loja Fechada no Momento
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-1">
                  Pedimos desculpas, a loja está fechada agora.
                </h2>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  No momento não estamos aceitando novos pedidos fora do nosso horário de atendimento.
                  Por favor, confira nossos horários de funcionamento abaixo para planejar o seu pedido!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowStoreClosedModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow-md shrink-0 flex items-center gap-2 active:scale-95"
            >
              <Clock className="w-4 h-4 text-stone-950" />
              <span>Ver Horários de Atendimento</span>
            </button>
          </div>

          {/* Horários cadastrados em destaque */}
          <div className="mt-4 pt-3 border-t border-rose-500/30 flex flex-wrap items-center gap-3 text-xs text-rose-200">
            <div className="flex items-center gap-1.5 font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Horário Cadastrado:</span>
            </div>
            <span className="bg-stone-950/70 px-3 py-1 rounded-lg border border-rose-500/40 font-mono font-bold text-amber-300">
              {config.horarioFuncionamento || 'Terça a Domingo: 17:00 às 23:30'}
            </span>
          </div>
        </div>
      )}

      {/* Barra de Categorias */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          Todos os Itens
        </button>
        {activeCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {cat.nome}
          </button>
        ))}
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeProducts.map(prod => (
          <div
            key={prod.id}
            onClick={() => openCustomizer(prod)}
            className="bg-white border border-stone-200 rounded-2xl overflow-hidden cursor-pointer hover:border-amber-400 hover:shadow-lg transition-all group flex flex-col justify-between"
          >
            {/* Foto de Capa do Produto */}
            <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
              <img
                src={prod.imagemUrl || 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80'}
                alt={prod.nome}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-black px-2.5 py-1 rounded-lg">
                R$ {prod.preco.toFixed(2)}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-base group-hover:text-amber-700 transition-colors leading-snug">
                  {prod.nome}
                </h3>
                <p className="text-xs text-stone-500 line-clamp-2 mt-1.5 leading-relaxed">
                  {prod.descricao}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                <span className="font-black text-amber-950 text-base font-mono">
                  R$ {prod.preco.toFixed(2)}
                </span>
                {isStoreOpen ? (
                  <span className="text-xs bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </span>
                ) : (
                  <span className="text-xs bg-rose-100 text-rose-700 font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs">
                    <Lock className="w-3.5 h-3.5" /> Fechado
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botão Flutuante do Carrinho */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 inset-x-4 max-w-md mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between font-bold text-base transition-transform active:scale-98"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs font-bold">
                {cart.reduce((s, i) => s + i.quantidade, 0)} itens
              </span>
              <span>Ver Pedido</span>
            </div>
            <span>R$ {cartSubtotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modal de Personalização do Pastel (Borda, Adicionais e Observação) */}
      {customizingProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-lg">{customizingProduct.nome}</h3>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-stone-600">{customizingProduct.descricao}</p>

              {/* Adicionais disponíveis */}
              {extras.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Deseja adicionar algo no pastel? (Opcional)
                  </h4>
                  <div className="space-y-2">
                    {extras.map(extra => {
                      const isSelected = selectedExtras.some(e => e.id === extra.id);
                      return (
                        <div
                          key={extra.id}
                          onClick={() => toggleExtra(extra)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/50'
                              : 'border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-amber-600 rounded border-stone-300"
                            />
                            <span className="text-sm font-medium text-stone-800">{extra.nome}</span>
                          </div>
                          <span className="text-xs font-bold text-amber-800">
                            + R$ {extra.preco.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observação */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Observações para a cozinha
                </label>
                <input
                  type="text"
                  placeholder="Ex: sem cebola, massa bem frita, etc."
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              {/* Quantidade */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-bold text-stone-800">Quantidade</span>
                <div className="flex items-center gap-3 bg-stone-100 px-3 py-1.5 rounded-xl">
                  <button
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-xs font-bold text-stone-700"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-stone-900 w-4 text-center">{itemQuantity}</span>
                  <button
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-xs font-bold text-stone-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-100">
              <button
                onClick={handleAddToCart}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-between px-4"
              >
                <span>Adicionar ao Pedido</span>
                <span>
                  R$ {((customizingProduct.preco + selectedExtras.reduce((s, e) => s + e.preco, 0)) * itemQuantity).toFixed(2)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carrinho / Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl animate-slide-left">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-amber-600 text-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <h3 className="font-black text-lg">Meu Pedido</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleFinishOrder} className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Itens do Carrinho */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Itens Escolhidos</h4>
                {cart.map((item, index) => (
                  <div key={item.id} className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">
                          {item.quantidade}x {item.nomeProduto}
                        </span>
                        <span className="text-xs font-bold text-amber-800 ml-auto">
                          R$ {item.subtotal.toFixed(2)}
                        </span>
                      </div>
                      {item.adicionais.length > 0 && (
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          + {item.adicionais.map(a => a.nome).join(', ')}
                        </p>
                      )}
                      {item.observacao && (
                        <p className="text-[11px] text-stone-500 italic mt-0.5">
                          "{item.observacao}"
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(index)}
                      className="text-stone-400 hover:text-red-500 p-1 self-start"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Tipo de Entrega */}
              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Forma de Entrega</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      orderType === 'delivery'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    🛵 Entrega em Domicílio
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('retirada')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      orderType === 'retirada'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    🏪 Retirar no Balcão
                  </button>
                </div>
              </div>

              {/* Identificação do Cliente */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Seus Dados</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Seu Nome *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">WhatsApp / Celular *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço (se delivery) */}
              {orderType === 'delivery' && (
                <div className="space-y-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Endereço de Entrega</h4>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Bairro / Região *</label>
                    <select
                      value={selectedZoneId}
                      onChange={(e) => setSelectedZoneId(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white font-medium"
                    >
                      {deliveryZones.filter(z => z.ativo).map(z => (
                        <option key={z.id} value={z.id}>
                          {z.bairro} (+ R$ {z.taxa.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Rua / Avenida *</label>
                      <input
                        type="text"
                        required
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="Nome da rua"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Número *</label>
                      <input
                        type="text"
                        required
                        value={streetNumber}
                        onChange={(e) => setStreetNumber(e.target.value)}
                        placeholder="123"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Complemento / Ponto de Referência</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto 12, Bloco B / Próximo à praça"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Forma de Pagamento */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Forma de Pagamento</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pix' as PaymentMethod, label: '💠 Pix Online' },
                    { id: 'cartao_credito' as PaymentMethod, label: '💳 Cartão de Crédito' },
                    { id: 'cartao_debito' as PaymentMethod, label: '💳 Cartão de Débito' },
                    { id: 'dinheiro' as PaymentMethod, label: '💵 Dinheiro' },
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-2.5 rounded-lg border text-xs font-semibold text-left ${
                        paymentMethod === method.id
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                          : 'border-stone-200 text-stone-700'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                {/* Se PIX selecionado */}
                {paymentMethod === 'pix' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                    <p className="font-bold text-emerald-900 mb-1">Pague via PIX Copia e Cola:</p>
                    <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-md border border-emerald-300 font-mono text-[11px]">
                      <span className="truncate mr-2">{config.chavePix}</span>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold shrink-0"
                      >
                        {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPix ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-1">
                      Titular: <strong>{config.nomeTitularPix}</strong>. Anexe o comprovante na conversa do WhatsApp após enviar!
                    </p>
                  </div>
                )}

                {/* Se Dinheiro selecionado */}
                {paymentMethod === 'dinheiro' && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-amber-950">
                        Com quanto vai pagar em dinheiro? *
                      </label>
                      <button
                        type="button"
                        onClick={() => setChangeFor(cartTotal.toFixed(2))}
                        className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline"
                      >
                        Tenho o valor exato
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">R$</span>
                        <input
                          type="number"
                          step="1"
                          required
                          placeholder={cartTotal > 0 ? (Math.ceil(cartTotal / 10) * 10).toFixed(2) : '50.00'}
                          value={changeFor}
                          onChange={(e) => setChangeFor(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-black text-stone-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setChangeFor('50.00')}
                        className="px-3 py-2 text-xs font-black bg-white border border-amber-300 rounded-lg hover:bg-amber-100 shadow-xs"
                      >
                        R$ 50
                      </button>
                      <button
                        type="button"
                        onClick={() => setChangeFor('100.00')}
                        className="px-3 py-2 text-xs font-black bg-white border border-amber-300 rounded-lg hover:bg-amber-100 shadow-xs"
                      >
                        R$ 100
                      </button>
                    </div>

                    {/* Cálculo em tempo real do troco */}
                    {changeFor && !isNaN(parseFloat(changeFor)) && (
                      <div className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-between ${
                        parseFloat(changeFor) >= cartTotal 
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' 
                          : 'bg-red-100 text-red-900 border border-red-300'
                      }`}>
                        {parseFloat(changeFor) >= cartTotal ? (
                          <>
                            <span>Troco calculado a devolver:</span>
                            <span className="font-mono text-sm font-black text-emerald-800 bg-white px-2 py-0.5 rounded shadow-xs">
                              R$ {(parseFloat(changeFor) - cartTotal).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span>⚠️ O valor informado deve ser no mínimo R$ {cartTotal.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Observação Geral */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Alguma observação geral para o pedido?
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ex: Tocar o interfone, embalar bem quente..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              {/* Resumo Financeiro */}
              <div className="border-t border-stone-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal dos itens:</span>
                  <span>R$ {cartSubtotal.toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-stone-600">
                    <span>Taxa de Entrega ({selectedZone?.bairro}):</span>
                    <span>R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-stone-900 pt-1 border-t border-dashed">
                  <span>Total Final:</span>
                  <span className="text-amber-900">R$ {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Botão de Finalizar */}
              {isStoreOpen ? (
                <button
                  id="btn-submit-order"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Check className="w-5 h-5" />
                  Confirmar Pedido & Enviar para Cozinha
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowStoreClosedModal(true)}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Lock className="w-5 h-5" />
                  Loja Fechada no Momento - Não Aceita Pedidos
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal de Sucesso com Acompanhamento e Envio de PIX */}
      {orderFinished && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-fade-in border border-stone-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-9 h-9" />
            </div>

            <div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Pedido Registrado no Kanban
              </span>
              <h3 className="text-2xl font-black text-stone-900 mt-1">
                Pedido #{orderFinished.numeroSequencial} Recebido!
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Sua solicitação já entrou em nossa fila de produção e a cozinha começou os preparativos.
              </p>
            </div>

            {/* Caixa Informativa */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-1">
              <div className="flex justify-between font-bold text-stone-800">
                <span>Cliente:</span>
                <span>{orderFinished.clienteNome}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-800">
                <span>Valor Total:</span>
                <span className="text-emerald-700 font-mono text-sm">R$ {orderFinished.valorTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Forma:</span>
                <span className="capitalize">{orderFinished.formaPagamento.replace('_', ' ')}</span>
              </div>
              {orderFinished.formaPagamento === 'dinheiro' && orderFinished.trocoPara && (
                <div className="flex justify-between text-amber-900 font-bold border-t border-stone-200 pt-1">
                  <span>Troco a receber:</span>
                  <span className="font-mono">R$ {(orderFinished.trocoPara - orderFinished.valorTotal).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Se PIX: botão para envio do comprovante pelo WhatsApp */}
            {orderFinished.formaPagamento === 'pix' && (
              <a
                href={generateWhatsAppProofUrl(orderFinished)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar Comprovante do PIX no WhatsApp
              </a>
            )}

            {/* Botão de Acompanhar Pedido ao Vivo */}
            <button
              type="button"
              onClick={() => {
                if (onOpenTracking) {
                  onOpenTracking(orderFinished.id);
                }
                setOrderFinished(null);
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <Navigation className="w-4 h-4" />
              Acompanhar Pedido & Rota do Motoboy no Mapa
            </button>

            <button
              type="button"
              onClick={() => setOrderFinished(null)}
              className="text-xs text-stone-400 hover:text-stone-600 font-semibold"
            >
              Fechar e Voltar ao Cardápio
            </button>
          </div>
        </div>
      )}

      {/* Modal de Desculpas e Horários de Funcionamento (Loja Fechada) */}
      {showStoreClosedModal && (
        <div 
          id="modal-loja-fechada-desculpas" 
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-stone-200 relative">
            <button
              type="button"
              onClick={() => setShowStoreClosedModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Store className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 inline-block mb-1.5">
                Fora do Horário de Atendimento
              </span>
              <h3 className="text-xl font-black text-stone-900 leading-snug">
                Pedimos desculpas, a loja está fechada agora!
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                No momento não estamos aceitando novos pedidos pelo cardápio digital. Confira abaixo os nossos horários de funcionamento para planejar o seu pedido!
              </p>
            </div>

            {/* Quadro com os Horários Configurados da Loja */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-stone-900 uppercase tracking-wide">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Horários de Atendimento Configurados</span>
              </div>

              {/* Horário Principal Cadastrado no Sistema */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block">
                  Horário Oficial de Atendimento:
                </span>
                <p className="text-sm font-black text-amber-950 mt-0.5 font-mono">
                  {config.horarioFuncionamento || 'Terça a Domingo: 17:00 às 23:30'}
                </p>
              </div>

              {/* Lista detalhada por turnos e dias da semana */}
              <div className="space-y-1.5 text-xs text-stone-700">
                <div className="flex items-center justify-between py-1.5 border-b border-stone-200/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-semibold">Segunda-feira:</span>
                  </div>
                  <span className="text-rose-600 font-black text-[11px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    Fechado (Folga Geral)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-stone-200/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-semibold">Terça a Sexta-feira:</span>
                  </div>
                  <span className="text-emerald-700 font-black text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                    17:00 às 23:30
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-stone-200/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-semibold">Sábado e Domingo:</span>
                  </div>
                  <span className="text-emerald-700 font-black text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                    17:00 às 00:00
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-semibold">Feriados:</span>
                  </div>
                  <span className="text-amber-800 font-black text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-mono">
                    17:00 às 23:30
                  </span>
                </div>
              </div>

              {config.enderecoCompleto && (
                <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{config.enderecoCompleto}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {config.whatsappOficial && (
                <a
                  href={`https://wa.me/${config.whatsappOficial}?text=${encodeURIComponent('Olá! Vi que a loja está fechada no momento, gostaria de tirar uma dúvida sobre os horários e cardápio.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <MessageCircle className="w-4 h-4" />
                  Dúvidas? Fale Conosco no WhatsApp
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowStoreClosedModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs transition-colors"
              >
                Continuar Vendo o Cardápio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
