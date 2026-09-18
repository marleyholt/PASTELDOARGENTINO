import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShoppingBag, 
  Kanban, 
  ChefHat, 
  Truck, 
  DollarSign, 
  Server, 
  Store,
  ChevronRight,
  BarChart3,
  Navigation,
  Menu,
  X,
  Bike,
  CloudCheck,
  Cloud
} from 'lucide-react';

import { 
  initialConfig, 
  initialCategories, 
  initialProducts, 
  initialExtras, 
  initialDeliveryZones, 
  initialUsers, 
  initialDrivers,
  initialOrders, 
  initialTransactions 
} from './data/mockData';

import { 
  StoreConfig, 
  Category, 
  Product, 
  ProductExtra, 
  DeliveryZone, 
  UserAccount, 
  DeliveryDriver,
  Order, 
  FinancialTransaction,
  OrderStatus,
  DriverLocation 
} from './types';

import { SettingsPanel } from './components/SettingsPanel';
import { DigitalMenu } from './components/DigitalMenu';
import { KanbanBoard } from './components/KanbanBoard';
import { KitchenKDS } from './components/KitchenKDS';
import { DeliveryModule } from './components/DeliveryModule';
import { FinancialModule } from './components/FinancialModule';
import { AdvancedReports } from './components/AdvancedReports';
import { OrderTracker } from './components/OrderTracker';
import { 
  subscribeToOrders, 
  saveOrderToFirestore, 
  updateOrderStatusInFirestore, 
  saveTransactionToFirestore,
  subscribeToProducts,
  subscribeToDrivers,
  subscribeToTransactions
} from './lib/firebase';

type MainView = 
  | 'settings' 
  | 'menu' 
  | 'kanban' 
  | 'kitchen' 
  | 'delivery' 
  | 'tracker'
  | 'financial' 
  | 'reports';

export default function App() {
  const [currentView, setCurrentView] = useState<MainView>('settings');
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados centrais da aplicação
  const [config, setConfig] = useState<StoreConfig>(initialConfig);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [extras, setExtras] = useState<ProductExtra[]>(initialExtras);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(initialDeliveryZones);
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>(initialDrivers);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(initialTransactions);
  const [driverLocations, setDriverLocations] = useState<Record<string, DriverLocation>>({
    'user-entregador-1': {
      entregadorId: 'user-entregador-1',
      entregadorNome: 'Carlos Entregador',
      latitude: -23.55052,
      longitude: -46.633308,
      velocidade: 34,
      precisao: 6,
      ultimaAtualizacao: new Date().toISOString(),
      ativo: true,
    }
  });

  // Sincronização em tempo real com o Firebase Firestore
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  useEffect(() => {
    // Escuta em tempo real dos pedidos
    const unsubOrders = subscribeToOrders((cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders);
      }
    }, () => setIsFirebaseConnected(false));

    // Escuta em tempo real do cardápio
    const unsubProducts = subscribeToProducts((cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
      }
    });

    // Escuta dos motoboys
    const unsubDrivers = subscribeToDrivers((cloudDrivers) => {
      if (cloudDrivers && cloudDrivers.length > 0) {
        setDrivers(cloudDrivers);
      }
    });

    // Escuta do caixa financeiro
    const unsubTrx = subscribeToTransactions((cloudTrx) => {
      if (cloudTrx && cloudTrx.length > 0) {
        setTransactions(cloudTrx);
      }
    });

    return () => {
      unsubOrders();
      unsubProducts();
      unsubDrivers();
      unsubTrx();
    };
  }, []);

  // Atualização da localização de motoboys em tempo real (GPS compartilhado)
  const handleUpdateDriverLocation = (location: DriverLocation) => {
    setDriverLocations(prev => ({
      ...prev,
      [location.entregadorId]: location,
    }));
  };

  // Confirmar pagamento manualmente pelo Kanban ou pelo Entregador
  const handleMarkAsPaid = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = { 
          ...o, 
          statusPagamento: 'pago' as const, 
          atualizadoEm: new Date().toISOString() 
        };
        const newTrx: FinancialTransaction = {
          id: `trx-${Date.now()}`,
          tipo: 'entrada',
          categoria: 'venda_pedido',
          descricao: `Recebimento Pedido #${o.numeroSequencial} (${o.formaPagamento}) - ${o.clienteNome}`,
          valor: o.valorTotal,
          formaPagamento: o.formaPagamento,
          pedidoId: o.id,
          data: new Date().toISOString(),
        };
        setTransactions(t => [newTrx, ...t]);

        // Grava no Firebase Firestore
        updateOrderStatusInFirestore(orderId, o.status, 'pago');
        saveTransactionToFirestore(newTrx);

        return updated;
      }
      return o;
    }));
  };

  // Manipuladores de Pedidos
  const handleCreateOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);

    // Persiste no Firebase Firestore
    saveOrderToFirestore(newOrder);

    // Se já pago no Pix, cria entrada financeira
    if (newOrder.statusPagamento === 'pago') {
      const newTrx: FinancialTransaction = {
        id: `trx-${Date.now()}`,
        tipo: 'entrada',
        categoria: 'venda_pedido',
        descricao: `Venda Pedido #${newOrder.numeroSequencial} - ${newOrder.clienteNome}`,
        valor: newOrder.valorTotal,
        formaPagamento: newOrder.formaPagamento,
        pedidoId: newOrder.id,
        data: new Date().toISOString(),
      };
      setTransactions(prev => [newTrx, ...prev]);
      saveTransactionToFirestore(newTrx);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        // Ao mudar para 'entregue', o pedido muda de status mas PERMANECE com statusPagamento (ex: 'a_pagar_entrega')
        // Ele só entra para o financeiro e vai para 'Pagos & Arquivados' quando o administrador clicar em 'Confirmar Pagamento'
        const updated = { ...o, status: newStatus, atualizadoEm: new Date().toISOString() };
        updateOrderStatusInFirestore(orderId, newStatus);
        return updated;
      }
      return o;
    }));
  };

  const handleAssignDelivery = (orderId: string, driverId: string, driverName: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated = {
          ...o,
          entregadorId: driverId,
          entregadorNome: driverName,
          status: 'em_entrega' as const,
          atualizadoEm: new Date().toISOString(),
        };
        saveOrderToFirestore(updated);
        return updated;
      }
      return o;
    }));
  };

  const handleAddTransaction = (newTrx: FinancialTransaction) => {
    setTransactions(prev => [newTrx, ...prev]);
    saveTransactionToFirestore(newTrx);
  };

  const navItems = [
    { id: 'settings' as MainView, label: 'Configurações Gerais', icon: Settings, highlight: true },
    { id: 'menu' as MainView, label: 'Cardápio / WhatsApp', icon: ShoppingBag },
    { id: 'kanban' as MainView, label: 'Pipeline Kanban', icon: Kanban, badge: orders.filter(o => o.status !== 'entregue' && o.status !== 'cancelado').length },
    { id: 'kitchen' as MainView, label: 'Cozinha (KDS)', icon: ChefHat, badge: orders.filter(o => o.status === 'preparando' || o.status === 'novo').length },
    { id: 'delivery' as MainView, label: 'Entregador (GPS)', icon: Truck, badge: orders.filter(o => o.tipoEntrega === 'delivery' && (o.status === 'pronto' || o.status === 'em_entrega')).length },
    { id: 'tracker' as MainView, label: 'Rastrear Pedido (Cliente)', icon: Navigation, badgeText: 'GPS' },
    { id: 'financial' as MainView, label: 'Financeiro & Caixa', icon: DollarSign },
    { id: 'reports' as MainView, label: 'Relatórios Avançados', icon: BarChart3, badgeText: 'Gráficos' },
  ];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col md:flex-row font-sans">
      {/* 1. SIDEBAR LATERAL FIXA PARA PC / DESKTOP (Menus um em cima do outro) */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-stone-900 text-white flex-col shrink-0 border-r border-stone-800 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {/* Topo da Sidebar: Identificação da Loja */}
        <div className="p-5 border-b border-stone-800 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm text-xl shrink-0">
            🥟
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black tracking-tight text-white text-base truncate">
                {config.nome}
              </span>
              {/* Texto em laranja mantido apenas no Desktop */}
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                Gestão & Pedidos
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              WhatsApp: +{config.whatsappOficial}
            </p>
            <p className="text-[10px] text-stone-500 truncate">
              {config.horarioFuncionamento}
            </p>
          </div>
        </div>

        {/* Navegação no Desktop: ITENS DISPOSTOS VERTICALMENTE (UM EM CIMA DO OUTRO) */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-black uppercase tracking-wider text-stone-500 px-3 pt-2 pb-1">
            Menu de Gestão & Operação
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.id === 'financial' ? 'text-emerald-400' : 'text-stone-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}

                  {item.badgeText && (
                    <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                      {item.badgeText}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-3 border-t border-stone-800 text-[11px] text-stone-400 bg-stone-950/40">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sistema Conectado
            </span>
            <span className="text-[10px] text-stone-500 font-mono">Pastel v2.5</span>
          </div>
        </div>
      </aside>

      {/* 2. TOPO MOBILE COMPACTO COM BOTÃO SANDUÍCHE NO CANTO SUPERIOR ESQUERDO */}
      <header className="md:hidden bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-30 shadow-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Botão Tipo Sanduíche no Canto Superior Esquerdo */}
          <button
            id="btn-mobile-sanduiche"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-xl bg-stone-800 text-stone-200 hover:text-white hover:bg-stone-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Abrir Menu Sanduíche"
          >
            <Menu className="w-6 h-6 text-amber-400" />
          </button>

          {/* Ao lado do botão: Ícone e Nome da Loja (TEXTO EM LARANJA 'Gestão & Pedidos' REMOVIDO NO MOBILE) */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm text-sm shrink-0">
              🥟
            </div>
            <div>
              <span className="font-black tracking-tight text-white text-sm block leading-tight">
                {config.nome}
              </span>
            </div>
          </div>
        </div>

        {/* Indicador da Tela Atual */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold bg-stone-800 text-amber-300 px-2.5 py-1 rounded-lg border border-stone-700 max-w-[140px] truncate">
            {navItems.find(i => i.id === currentView)?.label}
          </span>
        </div>
      </header>

      {/* 3. MENU GAVETA (DRAWER) NO MOBILE COM TODOS OS MENUS DISPOSTOS VERTICALMENTE */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop escuro com clique para fechar */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Painel do Menu Lateral */}
          <div className="relative w-72 max-w-[85vw] bg-stone-900 text-white h-full flex flex-col z-50 shadow-2xl border-r border-stone-800">
            {/* Topo do Drawer */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm text-sm">
                  🥟
                </div>
                <div>
                  <span className="font-black text-white text-sm block">
                    {config.nome}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Selecione um módulo
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Itens de Navegação Mobile (UM EM CIMA DO OUTRO) */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-${item.id}`}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-stone-300 hover:text-white hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.id === 'financial' ? 'text-emerald-400' : 'text-stone-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.badgeText && (
                        <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                          {item.badgeText}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Rodapé Mobile */}
            <div className="p-3 border-t border-stone-800 text-[11px] text-stone-400 bg-stone-950/40">
              <p className="text-[10px] text-stone-500">
                WhatsApp: +{config.whatsappOficial}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. ÁREA PRINCIPAL DE CONTEÚDO */}
      <main className="flex-1 min-w-0 min-h-screen overflow-y-auto bg-stone-100 pb-16">
        {currentView === 'settings' && (
          <SettingsPanel
            config={config}
            onSaveConfig={setConfig}
            categories={categories}
            onSaveCategories={setCategories}
            products={products}
            onSaveProducts={setProducts}
            extras={extras}
            onSaveExtras={setExtras}
            deliveryZones={deliveryZones}
            onSaveDeliveryZones={setDeliveryZones}
            users={users}
            onSaveUsers={setUsers}
            drivers={drivers}
            onSaveDrivers={setDrivers}
          />
        )}

        {currentView === 'menu' && (
          <DigitalMenu
            config={config}
            categories={categories}
            products={products}
            extras={extras}
            deliveryZones={deliveryZones}
            onCreateOrder={handleCreateOrder}
            onOpenTracking={(orderId) => {
              setSelectedTrackingOrderId(orderId);
              setCurrentView('tracker');
            }}
          />
        )}

        {currentView === 'kanban' && (
          <KanbanBoard
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            users={users}
            deliveryDrivers={drivers}
            onAssignDelivery={handleAssignDelivery}
            onMarkAsPaid={handleMarkAsPaid}
            driverLocations={driverLocations}
            onOpenTracker={(orderId) => {
              setSelectedTrackingOrderId(orderId);
              setCurrentView('tracker');
            }}
          />
        )}

        {currentView === 'kitchen' && (
          <KitchenKDS
            orders={orders}
            onSetReady={(orderId) => handleUpdateOrderStatus(orderId, 'pronto')}
          />
        )}

        {currentView === 'delivery' && (
          <DeliveryModule
            orders={orders}
            onMarkDelivered={(orderId) => handleUpdateOrderStatus(orderId, 'entregue')}
            onUpdateDriverLocation={handleUpdateDriverLocation}
          />
        )}

        {currentView === 'tracker' && (
          <OrderTracker
            orders={orders}
            config={config}
            initialOrderId={selectedTrackingOrderId || undefined}
            driverLocations={driverLocations}
            onBackToMenu={() => setCurrentView('menu')}
          />
        )}

        {currentView === 'financial' && (
          <FinancialModule
            orders={orders}
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
          />
        )}

        {currentView === 'reports' && (
          <AdvancedReports
            orders={orders}
            transactions={transactions}
            categories={categories}
            products={products}
          />
        )}
      </main>
    </div>
  );
}
