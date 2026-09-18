import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Order, Product, Category, Driver, FinancialTransaction, OrderStatus } from '../types';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Inicialização segura
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = (firebaseConfigJson as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfigJson as any).firestoreDatabaseId) 
  : getFirestore(app);
export const auth = getAuth(app);

// Teste de conexão obrigatório pelo Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Conexão com Firestore confirmada com sucesso.');
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('[Firebase] O cliente Firestore está offline no momento.');
    } else {
      console.log('[Firebase] Inicialização concluída.');
    }
    return false;
  }
}

// Inicializa o teste de conexão
testConnection();

// ==========================================
// SERVIÇOS DE SINCRONIZAÇÃO EM TEMPO REAL
// ==========================================

// 1. Sincronização de Pedidos
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void, 
  onError?: (error: any) => void
) {
  const q = query(collection(db, 'pedidos'), orderBy('criadoEm', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) return;
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      onUpdate(list);
    },
    (err) => {
      console.warn('[Firebase] Erro ao sincronizar pedidos:', err);
      onError?.(err);
    }
  );
}

export async function saveOrderToFirestore(order: Order): Promise<void> {
  try {
    const docRef = doc(db, 'pedidos', order.id);
    await setDoc(docRef, { ...order, atualizadoEm: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('[Firebase] Erro ao salvar pedido:', err);
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string, 
  newStatus: OrderStatus, 
  statusPagamento?: 'pendente' | 'a_pagar_entrega' | 'pago'
): Promise<void> {
  try {
    const docRef = doc(db, 'pedidos', orderId);
    const payload: any = { status: newStatus, atualizadoEm: new Date().toISOString() };
    if (statusPagamento) payload.statusPagamento = statusPagamento;
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.error('[Firebase] Erro ao atualizar status:', err);
  }
}

export async function updateOrderPriorityInFirestore(
  orderId: string,
  prioridadeEntrega: number,
  observacaoEntrega?: string
): Promise<void> {
  try {
    const docRef = doc(db, 'pedidos', orderId);
    const payload: any = { 
      prioridadeEntrega, 
      atualizadoEm: new Date().toISOString() 
    };
    if (observacaoEntrega !== undefined) {
      payload.observacaoEntrega = observacaoEntrega;
    }
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.error('[Firebase] Erro ao atualizar prioridade:', err);
  }
}

// 2. Sincronização de Produtos do Cardápio
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void
) {
  return onSnapshot(
    collection(db, 'produtos'),
    (snapshot) => {
      if (snapshot.empty) return;
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      onUpdate(list);
    },
    (err) => console.warn('[Firebase] Erro ao sincronizar produtos:', err)
  );
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const docRef = doc(db, 'produtos', product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (err) {
    console.error('[Firebase] Erro ao salvar produto:', err);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'produtos', productId));
  } catch (err) {
    console.error('[Firebase] Erro ao deletar produto:', err);
  }
}

// 3. Sincronização de Entregadores / Motoboys
export function subscribeToDrivers(
  onUpdate: (drivers: Driver[]) => void
) {
  return onSnapshot(
    collection(db, 'entregadores'),
    (snapshot) => {
      if (snapshot.empty) return;
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Driver));
      onUpdate(list);
    },
    (err) => console.warn('[Firebase] Erro ao sincronizar entregadores:', err)
  );
}

export async function saveDriverToFirestore(driver: Driver): Promise<void> {
  try {
    const docRef = doc(db, 'entregadores', driver.id);
    await setDoc(docRef, driver, { merge: true });
  } catch (err) {
    console.error('[Firebase] Erro ao salvar motoboy:', err);
  }
}

// 4. Sincronização de Transações Financeiras
export function subscribeToTransactions(
  onUpdate: (transactions: FinancialTransaction[]) => void
) {
  const q = query(collection(db, 'transacoes_financeiras'), orderBy('data', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) return;
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FinancialTransaction));
      onUpdate(list);
    },
    (err) => console.warn('[Firebase] Erro ao sincronizar finanças:', err)
  );
}

export async function saveTransactionToFirestore(transaction: FinancialTransaction): Promise<void> {
  try {
    const docRef = doc(db, 'transacoes_financeiras', transaction.id);
    await setDoc(docRef, transaction, { merge: true });
  } catch (err) {
    console.error('[Firebase] Erro ao salvar transação:', err);
  }
}
