import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  ShoppingBag, 
  Kanban, 
  ChefHat, 
  Truck, 
  DollarSign, 
  BarChart3, 
  Navigation, 
  Menu, 
  X, 
  Bike, 
  LogOut, 
  UserCheck, 
  ShieldCheck, 
  Sparkles,
  Wifi,
  WifiOff,
  BookOpen,
  Presentation
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
  DriverLocation,
  UserSession,
  AppProfile
} from './types';

import { AccessPortal } from './components/AccessPortal';
import { SettingsPanel } from './components/SettingsPanel';
import { DigitalMenu } from './components/DigitalMenu';
import { KanbanBoard } from './components/KanbanBoard';
import { KitchenKDS } from './components/KitchenKDS';
import { DeliveryModule } from './components/DeliveryModule';
import { FinancialModule } from './components/FinancialModule';
import { AdvancedReports } from './components/AdvancedReports';
import { OrderTracker } from './components/OrderTracker';
import { OrderAlertToast, OrderNotification } from './components/OrderAlertToast';
import { UserManualModal } from './components/UserManualModal';

import { 
  subscribeToOrders, 
  saveOrderToFirestore, 
  updateOrderStatusInFirestore, 
  updateOrderPriorityInFirestore,
  saveTransactionToFirestore, 
  subscribeToProducts, 
  subscribeToDrivers, 
  subscribeToTransactions,
  fetchOrdersDirectly
} from './lib/firebase';

import { localCache } from './lib/cache';
import { dispatchOrderWebhook } from './lib/webhook';
import { compareOrders } from './lib/orderMonitor';
import { soundAlert } from './lib/soundAlert';

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
  // Sessão atual com persistência em cache
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() => {
    return localCache.get<UserSession | null>('pastel_session', null);
  });

  const [currentView, setCurrentView] = useState<MainView>('menu');
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | null>(null);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  // Modal do Manual do Usuário Passo a Passo
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);

  // Estados centrais com cache inteligente para economizar requisições do Firebase
  const [config, setConfig] = useState<StoreConfig>(() => {
    return localCache.get<StoreConfig>('pastel_config', initialConfig);
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    return localCache.get<Category[]>('pastel_categories', initialCategories);
  });

  const [products, setProducts] = useState<Product[]>(() => {
    return localCache.get<Product[]>('pastel_products', initialProducts);
  });

  const [extras, setExtras] = useState<ProductExtra[]>(() => {
    return localCache.get<ProductExtra[]>('pastel_extras', initialExtras);
  });

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(() => {
    return localCache.get<DeliveryZone[]>('pastel_zones', initialDeliveryZones);
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    return localCache.get<UserAccount[]>('pastel_users', initialUsers);
  });

  const [drivers, setDrivers] = useState<DeliveryDriver[]>(() => {
    return localCache.get<DeliveryDriver[]>('pastel_drivers', initialDrivers);
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    return localCache.get<Order[]>('pastel_orders', initialOrders);
  });

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    return localCache.get<FinancialTransaction[]>('pastel_transactions', initialTransactions);
  });

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

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Estados do ciclo de checagem a cada 15 segundos
  const [secondsToNextCheck, setSecondsToNextCheck] = useState<number>(15);
  const [isCheckingOrders, setIsCheckingOrders] = useState<boolean>(false);
  const [activeNotification, setActiveNotification] = useState<OrderNotification | null>(null);

  // Referência atualizada dos pedidos para comparação precisa
  const ordersRef = React.useRef<Order[]>(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Função central de checagem a cada 15 segundos
  const runOrderCheck = async () => {
    if (isCheckingOrders) return;
    setIsCheckingOrders(true);

    try {
      const cloudOrders = await fetchOrdersDirectly();
      if (cloudOrders && cloudOrders.length > 0) {
        const diff = compareOrders(ordersRef.current, cloudOrders);

        if (diff.hasChanges) {
          // Atualiza os pedidos no estado (Kanban e Cozinha atualizam automaticamente!)
          setOrders(cloudOrders);
          localCache.set('pastel_orders', cloudOrders);
          ordersRef.current = cloudOrders;

          // 1. Entrou um novo pedido
          if (diff.newOrders.length > 0) {
            soundAlert.playNewOrderSound();
            const seqs = diff.newOrders.map(o => `#${o.numeroSequencial}`).join(', ');
            const first = diff.newOrders[0];
            setActiveNotification({
              id: `notif-${Date.now()}`,
              type: 'new',
              title: `🔔 Novo Pedido Recebido! (${seqs})`,
              description: `Cliente: ${first.clienteNome} • Valor: R$ ${first.valorTotal.toFixed(2)} (${first.formaPagamento}). Atualizado na Cozinha e no Kanban.`,
              timestamp: Date.now(),
            });
          }
          // 2. Pedido saiu da cozinha
          else if (diff.leftKitchenOrders.length > 0) {
            soundAlert.playKitchenDoneSound();
            const seqs = diff.leftKitchenOrders.map(o => `#${o.numeroSequencial}`).join(', ');
            setActiveNotification({
              id: `notif-${Date.now()}`,
              type: 'kitchen_done',
              title: `👨‍🍳 Pedido Pronto / Saiu da Cozinha (${seqs})`,
              description: `Fritura finalizada! O pedido está pronto na expedição para entrega/retirada.`,
              timestamp: Date.now(),
            });
          }
          // 3. Pedido entregue pelo motoboy
          else if (diff.deliveredOrders.length > 0) {
            soundAlert.playDeliveredSound();
            const seqs = diff.deliveredOrders.map(o => `#${o.numeroSequencial}`).join(', ');
            setActiveNotification({
              id: `notif-${Date.now()}`,
              type: 'delivered',
              title: `🛵 Pedido Entregue pelo Motoboy (${seqs})`,
              description: `Entrega confirmada com sucesso! Atualizado no pipeline do Kanban.`,
              timestamp: Date.now(),
            });
          }
        }
        // SE NÃO HOUVER MUDANÇA: Mantém a tela atual exatamente como está, sem piscar ou recarregar!
      }
    } catch (err) {
      console.warn('[Monitor 15s] Erro na verificação:', err);
    } finally {
      setIsCheckingOrders(false);
      setSecondsToNextCheck(15);
    }
  };

  // Timer de 15 segundos contínuo que executa a verificação
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsToNextCheck(prev => {
        if (prev <= 1) {
          runOrderCheck();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sincronização em tempo real com Firebase Firestore com atualização de cache
  useEffect(() => {
    const unsubOrders = subscribeToOrders((cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders);
        ordersRef.current = cloudOrders;
        localCache.set('pastel_orders', cloudOrders);
      }
    }, () => setIsFirebaseConnected(false));

    const unsubProducts = subscribeToProducts((cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
        localCache.set('pastel_products', cloudProducts);
      }
    });

    const unsubDrivers = subscribeToDrivers((cloudDrivers) => {
      if (cloudDrivers && cloudDrivers.length > 0) {
        setDrivers(cloudDrivers);
        localCache.set('pastel_drivers', cloudDrivers);
      }
    });

    const unsubTrx = subscribeToTransactions((cloudTrx) => {
      if (cloudTrx && cloudTrx.length > 0) {
        setTransactions(cloudTrx);
        localCache.set('pastel_transactions', cloudTrx);
      }
    });

    return () => {
      unsubOrders();
      unsubProducts();
      unsubDrivers();
      unsubTrx();
    };
  }, []);

  // Ao selecionar um perfil no Portal de Acesso
  const handleSelectProfile = (session: UserSession) => {
    setCurrentSession(session);
    localCache.set('pastel_session', session);

    // Redirecionamento inteligente baseado no perfil escolhido
    if (session.perfil === 'cliente') {
      setCurrentView('menu');
    } else if (session.perfil === 'motoboy') {
      setCurrentView('delivery');
    } else if (session.perfil === 'cozinha') {
      setCurrentView('kitchen');
    } else if (session.perfil === 'admin') {
      setCurrentView('kanban');
    }
  };

  // Logout / Trocar de Perfil
  const handleLogout = () => {
    setCurrentSession(null);
    localCache.remove('pastel_session');
    setIsNavDrawerOpen(false);
  };

  // Atualização de localização GPS dos entregadores
  const handleUpdateDriverLocation = (location: DriverLocation) => {
    setDriverLocations(prev => ({
      ...prev,
      [location.entregadorId]: location,
    }));
  };

  // Confirmar pagamento manualmente pelo Administrador no Kanban
  const handleMarkAsPaid = (orderId: string) => {
    setOrders(prev => {
      const updatedList = prev.map(o => {
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
          setTransactions(t => {
            const nextTrx = [newTrx, ...t];
            localCache.set('pastel_transactions', nextTrx);
            return nextTrx;
          });

          // Grava no Firestore
          updateOrderStatusInFirestore(orderId, o.status, 'pago');
          saveTransactionToFirestore(newTrx);

          return updated;
        }
        return o;
      });

      localCache.set('pastel_orders', updatedList);
      return updatedList;
    });
  };

  // Criação de novos pedidos com webhook automático para WhatsApp
  const handleCreateOrder = (newOrder: Order) => {
    setOrders(prev => {
      const updated = [newOrder, ...prev];
      localCache.set('pastel_orders', updated);
      return updated;
    });

    // Salva no Firestore
    saveOrderToFirestore(newOrder);

    // Dispara Webhook automático para WhatsApp se configurado
    dispatchOrderWebhook(newOrder, config).catch(err => {
      console.warn('[Webhook] Erro no disparo assíncrono:', err);
    });

    // Se já pago no Pix na finalização, cria entrada financeira
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
      setTransactions(prev => {
        const nextTrx = [newTrx, ...prev];
        localCache.set('pastel_transactions', nextTrx);
        return nextTrx;
      });
      saveTransactionToFirestore(newTrx);
    }
  };

  // Atualização de status do pedido
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id === orderId) {
          const item = { ...o, status: newStatus, atualizadoEm: new Date().toISOString() };
          updateOrderStatusInFirestore(orderId, newStatus);
          return item;
        }
        return o;
      });
      localCache.set('pastel_orders', updated);
      return updated;
    });
  };

  // Atualização de prioridade e observação de entrega
  const handleUpdateOrderPriority = (orderId: string, priority: number, observation?: string) => {
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            prioridadeEntrega: priority,
            observacaoEntrega: observation !== undefined ? observation : o.observacaoEntrega,
            atualizadoEm: new Date().toISOString(),
          };
        }
        return o;
      });
      localCache.set('pastel_orders', updated);
      return updated;
    });
    updateOrderPriorityInFirestore(orderId, priority, observation);
  };

  // Aplicação de rota otimizada por IA
  const handleApplyOptimizedRoute = (optimizedOrders: Order[]) => {
    setOrders(prev => {
      const idMap = new Map(optimizedOrders.map(o => [o.id, o]));
      const updated = prev.map(o => idMap.get(o.id) || o);
      localCache.set('pastel_orders', updated);
      return updated;
    });

    optimizedOrders.forEach(o => {
      updateOrderPriorityInFirestore(o.id, o.prioridadeEntrega || 1, o.observacaoEntrega);
    });
  };

  // Atribuição de entrega
  const handleAssignDelivery = (orderId: string, driverId: string, driverName: string) => {
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id === orderId) {
          const item = {
            ...o,
            entregadorId: driverId,
            entregadorNome: driverName,
            status: 'em_entrega' as const,
            atualizadoEm: new Date().toISOString(),
          };
          saveOrderToFirestore(item);
          return item;
        }
        return o;
      });
      localCache.set('pastel_orders', updated);
      return updated;
    });
  };

  const handleAddTransaction = (newTrx: FinancialTransaction) => {
    setTransactions(prev => {
      const updated = [newTrx, ...prev];
      localCache.set('pastel_transactions', updated);
      return updated;
    });
    saveTransactionToFirestore(newTrx);
  };

  // DEFINIÇÃO RIGOROSA DAS ABAS PERMITIDAS POR PERFIL DE USUÁRIO
  const allowedNavItems = useMemo(() => {
    const perfil = currentSession?.perfil || 'cliente';

    const allItems = [
      { 
        id: 'menu' as MainView, 
        label: 'Cardápio', 
        icon: ShoppingBag, 
        allowed: ['cliente', 'admin'] 
      },
      { 
        id: 'tracker' as MainView, 
        label: 'Rastrear Pedido', 
        icon: Navigation, 
        badgeText: 'GPS', 
        allowed: ['cliente', 'admin'] 
      },
      { 
        id: 'delivery' as MainView, 
        label: 'Entregador (GPS)', 
        icon: Truck, 
        badge: orders.filter(o => {
          if (perfil === 'motoboy' && currentSession?.driverId) {
            return o.entregadorId === currentSession.driverId && o.status !== 'cancelado';
          }
          return o.tipoEntrega === 'delivery' && (o.status === 'pronto' || o.status === 'em_entrega');
        }).length,
        allowed: ['motoboy', 'admin'] 
      },
      { 
        id: 'kitchen' as MainView, 
        label: 'Cozinha (KDS)', 
        icon: ChefHat, 
        badge: orders.filter(o => o.status === 'preparando' || o.status === 'novo').length,
        allowed: ['cozinha', 'admin'] 
      },
      { 
        id: 'kanban' as MainView, 
        label: 'Pipeline Kanban', 
        icon: Kanban, 
        badge: orders.filter(o => o.status !== 'entregue' && o.status !== 'cancelado').length,
        allowed: ['admin'] 
      },
      { 
        id: 'financial' as MainView, 
        label: 'Financeiro & Caixa', 
        icon: DollarSign, 
        allowed: ['admin'] 
      },
      { 
        id: 'reports' as MainView, 
        label: 'Relatórios Avançados', 
        icon: BarChart3, 
        badgeText: 'Gráficos', 
        allowed: ['admin'] 
      },
      { 
        id: 'settings' as MainView, 
        label: 'Configurações Gerais', 
        icon: Settings, 
        highlight: true, 
        allowed: ['admin'] 
      },
    ];

    return allItems.filter(item => item.allowed.includes(perfil));
  }, [currentSession, orders]);

  // Se o usuário ainda não escolheu um perfil, exibe a tela de abertura inicial (AccessPortal)
  if (!currentSession) {
    return (
      <>
        <AccessPortal 
          config={config} 
          drivers={drivers} 
          onSelectProfile={handleSelectProfile} 
          onOpenManual={() => {
            setIsUserManualOpen(true);
          }}
        />

        {/* Modal do Manual do Usuário Passo a Passo */}
        <UserManualModal
          isOpen={isUserManualOpen}
          onClose={() => setIsUserManualOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* 1. BARRA SUPERIOR UNIFICADA (DESKTOP E MOBILE) COM BOTÃO SANDUÍCHE NO CANTO ESQUERDO */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-30 shadow-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Botão Tipo Sanduíche para Abrir Navegação Retrátil (Desktop & Mobile) */}
          <button
            id="btn-app-sanduiche"
            onClick={() => setIsNavDrawerOpen(true)}
            className="p-2 -ml-2 rounded-xl bg-stone-800 text-stone-200 hover:text-white hover:bg-stone-700 transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-500 flex items-center gap-1.5"
            aria-label="Abrir Menu de Navegação"
            title="Abrir Menu"
          >
            <Menu className="w-5 h-5 text-amber-400" />
            <span className="hidden sm:inline text-xs font-bold text-stone-300">Menu</span>
          </button>

          {/* Logo e Nome da Loja */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-xs text-base shrink-0">
              🥟
            </div>
            <div>
              <span className="font-black tracking-tight text-white text-sm sm:text-base leading-tight block">
                {config.nome}
              </span>
              <span className="text-[10px] text-stone-400 hidden sm:block">
                WhatsApp: +{config.whatsappOficial}
              </span>
            </div>
          </div>
        </div>

        {/* Centro: Atalhos Rápidos da Visão do Administrador (Kanban, Cozinha, Entregador) */}
        {currentSession.perfil === 'admin' && (
          <div className="flex items-center gap-1 sm:gap-2 bg-stone-950/80 p-1 rounded-xl border border-stone-800 shadow-inner">
            {/* Atalho 1: Pipeline Kanban */}
            <button
              id="header-shortcut-kanban"
              type="button"
              onClick={() => setCurrentView('kanban')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'kanban'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
              title="Ir para o Pipeline Kanban"
            >
              <Kanban className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Kanban</span>
              {orders.filter(o => o.status !== 'entregue' && o.status !== 'cancelado').length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  currentView === 'kanban'
                    ? 'bg-stone-950 text-amber-400'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {orders.filter(o => o.status !== 'entregue' && o.status !== 'cancelado').length}
                </span>
              )}
            </button>

            {/* Atalho 2: Cozinha (KDS) */}
            <button
              id="header-shortcut-kitchen"
              type="button"
              onClick={() => setCurrentView('kitchen')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'kitchen'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
              title="Ir para a Cozinha (KDS)"
            >
              <ChefHat className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Cozinha</span>
              {orders.filter(o => o.status === 'preparando' || o.status === 'novo').length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  currentView === 'kitchen'
                    ? 'bg-stone-950 text-orange-300'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}>
                  {orders.filter(o => o.status === 'preparando' || o.status === 'novo').length}
                </span>
              )}
            </button>

            {/* Atalho 3: Entregador (GPS) */}
            <button
              id="header-shortcut-delivery"
              type="button"
              onClick={() => setCurrentView('delivery')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'delivery'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
              title="Ir para o Módulo do Entregador (GPS)"
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Entregador</span>
              {orders.filter(o => o.tipoEntrega === 'delivery' && (o.status === 'pronto' || o.status === 'em_entrega')).length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  currentView === 'delivery'
                    ? 'bg-stone-950 text-blue-300'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {orders.filter(o => o.tipoEntrega === 'delivery' && (o.status === 'pronto' || o.status === 'em_entrega')).length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Lado Direito: Botão do Manual, Badge do Perfil e Trocar Perfil */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão de Acesso ao Manual do Usuário */}
          <button
            id="btn-manual-usuario-header"
            type="button"
            onClick={() => {
              setIsUserManualOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition-all shadow-xs"
            title="Abrir o Manual do Usuário"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-950" />
            <span className="hidden lg:inline">Manual do Usuário</span>
            <span className="lg:hidden">Manual</span>
          </button>

          {/* Identificador do Perfil Logado */}
          <div className="flex items-center gap-1.5 bg-stone-800 border border-stone-700 px-2.5 py-1 rounded-lg text-xs font-bold">
            {currentSession.perfil === 'cliente' && (
              <>
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-200">Cliente</span>
              </>
            )}
            {currentSession.perfil === 'motoboy' && (
              <>
                <Bike className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 truncate max-w-[120px]">
                  {currentSession.driverName} #{currentSession.driverRegistro}
                </span>
              </>
            )}
            {currentSession.perfil === 'cozinha' && (
              <>
                <ChefHat className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-orange-200">Cozinha</span>
              </>
            )}
            {currentSession.perfil === 'admin' && (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Admin</span>
              </>
            )}
          </div>

          {/* Botão Sair / Trocar de Perfil */}
          <button
            id="btn-trocar-perfil"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-rose-300 text-xs font-semibold transition-colors border border-stone-700"
            title="Voltar ao portal e trocar de perfil"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trocar Perfil</span>
          </button>
        </div>
      </header>

      {/* 2. MENU GAVETA RETRÁTIL (DRAWER) MODERNO - FUNCIONA EM DESKTOP E MOBILE */}
      {isNavDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop escuro com clique para fechar */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsNavDrawerOpen(false)}
          />

          {/* Painel lateral de navegação */}
          <div className="relative w-72 max-w-[85vw] bg-stone-900 text-white h-full flex flex-col z-50 shadow-2xl border-r border-stone-800">
            {/* Topo do Drawer */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-xs text-lg">
                  🥟
                </div>
                <div>
                  <span className="font-black text-white text-sm block">
                    {config.nome}
                  </span>
                  <span className="text-[11px] text-amber-400 font-semibold capitalize">
                    Perfil: {currentSession.perfil}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsNavDrawerOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Navegação com apenas as opções autorizadas */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              <div className="text-[10px] font-black uppercase tracking-wider text-stone-500 px-3 pt-2 pb-1">
                Módulos Disponíveis
              </div>

              {allowedNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsNavDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-stone-300 hover:text-white hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.badgeText && (
                        <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs">
                          {item.badgeText}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Rodapé do Menu Drawer */}
            <div className="p-3 border-t border-stone-800 text-[11px] text-stone-400 bg-stone-950/70 space-y-2">
              {/* Atalho para o Manual de Operação */}
              <div className="pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsNavDrawerOpen(false);
                    setIsUserManualOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs py-2 px-3 rounded-xl transition-all shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Manual de Operação Passo a Passo</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-stone-800/80">
                <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Firebase Conectado
                </span>
                <span className="text-[10px] text-stone-500 font-mono">v2.5</span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-stone-800 hover:bg-rose-950 hover:text-rose-200 text-stone-300 text-xs font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair / Escolher Outro Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ÁREA PRINCIPAL DE CONTEÚDO (LARGURA TOTAL DESIMPEDIDA) */}
      <main className="flex-1 min-w-0 min-h-screen overflow-y-auto bg-stone-100 pb-16">
        {currentView === 'settings' && currentSession.perfil === 'admin' && (
          <SettingsPanel
            config={config}
            onSaveConfig={(newCfg) => {
              setConfig(newCfg);
              localCache.set('pastel_config', newCfg);
            }}
            categories={categories}
            onSaveCategories={(newCats) => {
              setCategories(newCats);
              localCache.set('pastel_categories', newCats);
            }}
            products={products}
            onSaveProducts={(newProds) => {
              setProducts(newProds);
              localCache.set('pastel_products', newProds);
            }}
            extras={extras}
            onSaveExtras={(newExtras) => {
              setExtras(newExtras);
              localCache.set('pastel_extras', newExtras);
            }}
            deliveryZones={deliveryZones}
            onSaveDeliveryZones={(newZones) => {
              setDeliveryZones(newZones);
              localCache.set('pastel_zones', newZones);
            }}
            users={users}
            onSaveUsers={(newUsers) => {
              setUsers(newUsers);
              localCache.set('pastel_users', newUsers);
            }}
            drivers={drivers}
            onSaveDrivers={(newDrivers) => {
              setDrivers(newDrivers);
              localCache.set('pastel_drivers', newDrivers);
            }}
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

        {currentView === 'kanban' && currentSession.perfil === 'admin' && (
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
            secondsRemaining={secondsToNextCheck}
            isChecking={isCheckingOrders}
            onForceCheck={runOrderCheck}
          />
        )}

        {currentView === 'kitchen' && (currentSession.perfil === 'cozinha' || currentSession.perfil === 'admin') && (
          <KitchenKDS
            orders={orders}
            onSetReady={(orderId) => handleUpdateOrderStatus(orderId, 'pronto')}
            secondsRemaining={secondsToNextCheck}
            isChecking={isCheckingOrders}
            onForceCheck={runOrderCheck}
          />
        )}

        {currentView === 'delivery' && (currentSession.perfil === 'motoboy' || currentSession.perfil === 'admin') && (
          <DeliveryModule
            orders={orders}
            onMarkDelivered={(orderId) => handleUpdateOrderStatus(orderId, 'entregue')}
            onUpdateDriverLocation={handleUpdateDriverLocation}
            currentRole={currentSession.perfil === 'admin' ? 'admin' : 'motoboy'}
            driverId={currentSession.driverId}
            driverName={currentSession.driverName}
            onUpdateOrderPriority={handleUpdateOrderPriority}
            onApplyOptimizedRoute={handleApplyOptimizedRoute}
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

        {currentView === 'financial' && currentSession.perfil === 'admin' && (
          <FinancialModule
            orders={orders}
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
          />
        )}

        {currentView === 'reports' && currentSession.perfil === 'admin' && (
          <AdvancedReports
            orders={orders}
            transactions={transactions}
            categories={categories}
            products={products}
          />
        )}
      </main>

      {/* Toast flutuante de notificação automática de novos pedidos e mudanças */}
      <OrderAlertToast
        notification={activeNotification}
        onDismiss={() => setActiveNotification(null)}
      />

      {/* Modal do Manual do Usuário Passo a Passo */}
      <UserManualModal
        isOpen={isUserManualOpen}
        onClose={() => setIsUserManualOpen(false)}
      />
    </div>
  );
}
