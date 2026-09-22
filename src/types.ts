export type RoleType = 'admin' | 'caixa' | 'cozinha' | 'entregador';

export interface ModulePermissions {
  cardapio: boolean;
  pedidos: boolean;
  cozinha: boolean;
  entregador: boolean;
  financeiro: boolean;
  configuracoes: boolean;
}

export interface UserAccount {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: RoleType;
  ativo: boolean;
  permissoes: ModulePermissions;
  criadoEm: string;
}

export interface ProductExtra {
  id: string;
  nome: string;
  preco: number;
  disponivel: boolean;
}

export interface Product {
  id: string;
  categoriaId: string;
  nome: string;
  descricao: string;
  preco: number;
  imagemUrl: string;
  ativo: boolean;
  destaque?: boolean;
  adicionaisPermitidos?: string[]; // IDs de adicionais
  pausado?: boolean; // Se true, o item está pausado temporariamente (esgotado)
}

export interface Category {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

export interface DeliveryZone {
  id: string;
  bairro: string;
  taxa: number;
  tempoEstimadoMin: number;
  ativo: boolean;
}

export interface DeliveryDriver {
  id: string;
  nome: string;
  telefone: string;
  veiculo: string; // Ex: Honda CG 160 Fan, Yamaha Fazer 250, Bicicleta
  placa?: string;
  chavePix?: string;
  tipoChavePix?: 'cpf' | 'telefone' | 'email' | 'aleatoria';
  taxaEntregaFixa?: number; // Repasse por corrida em R$
  ativo: boolean; // Se está cadastrado e ativo
  emServico: boolean; // Se está online no turno atual
  observacoes?: string;
  codigoRegistro?: string; // Número de registro do motoboy (ex: 1, 2, 101)
  senha?: string; // Senha de acesso individual do entregador
}

export interface StoreConfig {
  nome: string;
  cnpjCpf: string;
  telefoneContato: string;
  whatsappOficial: string;
  logotipoUrl: string;
  enderecoCompleto: string;
  horarioFuncionamento: string;
  chavePix: string;
  tipoChavePix: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  nomeTitularPix: string;
  mensagemWhatsappPadrao: string;
  pedidoMinimo: number;
  tempoRetiradaMin: number;
  tempoEntregaPadraoMin: number;
  permiteRetirada: boolean;
  permiteEntrega: boolean;
  senhaCozinha?: string; // Senha do módulo da cozinha (KDS)
  webhookWhatsappUrl?: string;
  webhookWhatsappToken?: string;
  webhookWhatsappAtivo?: boolean;
  lojaAberta?: boolean; // Controle manual para abrir / fechar a loja (default: true)
  mensagemFechamentoPersonalizada?: string;
}

export type OrderStatus = 
  | 'novo' 
  | 'preparando' 
  | 'pronto' 
  | 'em_entrega' 
  | 'entregue' 
  | 'cancelado';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro';
export type PaymentStatus = 'pendente' | 'pago' | 'na_entrega';

export interface OrderItemExtra {
  id: string;
  nome: string;
  preco: number;
}

export interface OrderItem {
  id: string;
  produtoId: string;
  nomeProduto: string;
  precoUnitario: number;
  quantidade: number;
  observacao?: string;
  adicionais: OrderItemExtra[];
  subtotal: number;
}

export interface Order {
  id: string;
  numeroSequencial: number;
  clienteNome: string;
  clienteTelefone: string;
  tipoEntrega: 'delivery' | 'retirada';
  enderecoEntrega?: {
    logradouro: string;
    numero: string;
    bairro: string;
    complemento?: string;
    cep?: string;
    cidade?: string;
  };
  itens: OrderItem[];
  subtotal: number;
  taxaEntrega: number;
  desconto: number;
  valorTotal: number;
  formaPagamento: PaymentMethod;
  statusPagamento: PaymentStatus;
  trocoPara?: number;
  status: OrderStatus;
  observacoesGerais?: string;
  criadoEm: string;
  atualizadoEm: string;
  entregadorId?: string;
  entregadorNome?: string;
  prioridadeEntrega?: number; // 1 = primeira entrega, 2 = segunda, etc.
  observacaoEntrega?: string; // Observação específica definida pelo administrador para o motoboy
  ordemRotaSugerida?: number; // Sugestão gerada pela inteligência de rota
}

export type AppProfile = 'portal' | 'cliente' | 'motoboy' | 'cozinha' | 'admin';

export interface UserSession {
  perfil: AppProfile;
  nome?: string;
  driverId?: string;
  driverName?: string;
  driverRegistro?: string;
  adminEmail?: string;
}

export type Driver = DeliveryDriver;

export interface FinancialTransaction {
  id: string;
  tipo: 'entrada' | 'saida';
  categoria: 'venda_pedido' | 'ingredientes' | 'embalagens' | 'salarios' | 'utilidades' | 'outros';
  descricao: string;
  valor: number;
  formaPagamento: PaymentMethod;
  pedidoId?: string;
  data: string; // ISO String
}

export interface CashRegister {
  id: string;
  dataAbertura: string;
  dataFechamento?: string;
  saldoInicial: number;
  saldoFinalDinheiro?: number;
  totalEntradas: number;
  totalSaidas: number;
  status: 'aberto' | 'fechado';
  responsavel: string;
}

export interface DriverLocation {
  entregadorId: string;
  entregadorNome: string;
  latitude: number;
  longitude: number;
  velocidade?: number;
  precisao?: number;
  ultimaAtualizacao: string; // ISO
  ativo: boolean;
}
