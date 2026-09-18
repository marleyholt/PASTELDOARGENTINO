import { Category, DeliveryZone, DeliveryDriver, Order, Product, ProductExtra, StoreConfig, UserAccount, FinancialTransaction } from '../types';

export const initialConfig: StoreConfig = {
  nome: "Pastelaria Pastel de Ouro",
  cnpjCpf: "12.345.678/0001-90",
  telefoneContato: "(11) 98765-4321",
  whatsappOficial: "5511987654321",
  logotipoUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop",
  enderecoCompleto: "Av. Paulista, 1500 - Bela Vista, São Paulo - SP",
  horarioFuncionamento: "Terça a Domingo: 17:00 às 23:30",
  chavePix: "pastelaria@pasteldeouro.com.br",
  tipoChavePix: "email",
  nomeTitularPix: "Pastel de Ouro Alimentos Ltda",
  mensagemWhatsappPadrao: `🥟 *NOVO PEDIDO - {loja}* 🥟
━━━━━━━━━━━━━━━━━━━━
📌 *Pedido #{numero}*
👤 *Cliente:* {cliente}
📱 *WhatsApp:* {telefone}
📍 *Entrega:* {tipo_entrega}
{endereco}
━━━━━━━━━━━━━━━━━━━━
🛒 *ITENS DO PEDIDO:*
{itens}
━━━━━━━━━━━━━━━━━━━━
🛵 *Taxa de Entrega:* R$ {taxa_entrega}
💰 *TOTAL:* R$ {total}
💳 *Pagamento:* {pagamento}
{observacoes}
━━━━━━━━━━━━━━━━━━━━
Aguarde a confirmação da pastelaria!`,
  pedidoMinimo: 20.00,
  tempoRetiradaMin: 25,
  tempoEntregaPadraoMin: 45,
  permiteRetirada: true,
  permiteEntrega: true,
};

export const initialCategories: Category[] = [
  { id: 'cat-1', nome: 'Pastéis Tradicionais', ordem: 1, ativo: true },
  { id: 'cat-2', nome: 'Pastéis Especiais & Gourmet', ordem: 2, ativo: true },
  { id: 'cat-3', nome: 'Pastéis Doces', ordem: 3, ativo: true },
  { id: 'cat-4', nome: 'Combos & Porções', ordem: 4, ativo: true },
  { id: 'cat-5', nome: 'Bebidas & Sucos', ordem: 5, ativo: true },
];

export const initialExtras: ProductExtra[] = [
  { id: 'ext-1', nome: 'Queijo Mussarela Extra', preco: 4.50, disponivel: true },
  { id: 'ext-2', nome: 'Catupiry Original Extra', preco: 5.00, disponivel: true },
  { id: 'ext-3', nome: 'Bacon Crocante em Cubos', preco: 4.00, disponivel: true },
  { id: 'ext-4', nome: 'Azeitona sem caroço', preco: 2.00, disponivel: true },
  { id: 'ext-5', nome: 'Massa com Borda Recheada de Catupiry', preco: 6.00, disponivel: true },
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    categoriaId: 'cat-1',
    nome: 'Pastel de Carne com Queijo',
    descricao: 'Carne moída especial de primeira bem temperada com queijo mussarela derretido e azeitonas.',
    preco: 14.00,
    imagemUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
    ativo: true,
    destaque: true,
    adicionaisPermitidos: ['ext-1', 'ext-2', 'ext-3', 'ext-5'],
  },
  {
    id: 'prod-2',
    categoriaId: 'cat-1',
    nome: 'Pastel de Frango com Catupiry',
    descricao: 'Peito de frango desfiado suculento com Catupiry legítimo e milho selecionado.',
    preco: 14.50,
    imagemUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
    ativo: true,
    destaque: true,
    adicionaisPermitidos: ['ext-1', 'ext-2', 'ext-3', 'ext-5'],
  },
  {
    id: 'prod-3',
    categoriaId: 'cat-1',
    nome: 'Pastel Pizza Especial',
    descricao: 'Mussarela derretida, presunto ralado, rodelas de tomate fresco e orégano chileno.',
    preco: 13.00,
    imagemUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
    ativo: true,
    adicionaisPermitidos: ['ext-1', 'ext-3'],
  },
  {
    id: 'prod-4',
    categoriaId: 'cat-2',
    nome: 'Pastel Especial de Costela Desfiada',
    descricao: 'Costela bovina assada por 12 horas, desfiada com queijo provolone e molho barbecue artesanal.',
    preco: 22.00,
    imagemUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
    ativo: true,
    destaque: true,
    adicionaisPermitidos: ['ext-1', 'ext-2', 'ext-3', 'ext-5'],
  },
  {
    id: 'prod-5',
    categoriaId: 'cat-3',
    nome: 'Pastel de Nutella com Morango',
    descricao: 'Massa crocante recheada com generosa camada de Nutella e morangos frescos picados.',
    preco: 18.00,
    imagemUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=300&fit=crop',
    ativo: true,
    destaque: true,
  },
  {
    id: 'prod-6',
    categoriaId: 'cat-5',
    nome: 'Refrigerante Guaraná Antarctica 350ml',
    descricao: 'Lata gelada 350ml.',
    preco: 6.00,
    imagemUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop',
    ativo: true,
  },
  {
    id: 'prod-7',
    categoriaId: 'cat-5',
    nome: 'Caldo de Cana Natural 500ml',
    descricao: 'Caldo de cana moído na hora com opção de limão.',
    preco: 8.50,
    imagemUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=300&fit=crop',
    ativo: true,
  }
];

export const initialDeliveryZones: DeliveryZone[] = [
  { id: 'zone-1', bairro: 'Bela Vista / Centro', taxa: 5.00, tempoEstimadoMin: 35, ativo: true },
  { id: 'zone-2', bairro: 'Consolação / Higienópolis', taxa: 7.00, tempoEstimadoMin: 40, ativo: true },
  { id: 'zone-3', bairro: 'Jardins / Cerqueira César', taxa: 8.00, tempoEstimadoMin: 45, ativo: true },
  { id: 'zone-4', bairro: 'Paraíso / Vila Mariana', taxa: 9.50, tempoEstimadoMin: 50, ativo: true },
  { id: 'zone-5', bairro: 'Pinheiros / Perdizes', taxa: 12.00, tempoEstimadoMin: 55, ativo: true },
];

export const initialDrivers: DeliveryDriver[] = [
  {
    id: 'drv-1',
    nome: 'Carlos Eduardo Motoboy',
    telefone: '(11) 98888-1122',
    veiculo: 'Honda CG 160 Fan (Vermelha)',
    placa: 'BRA2E19',
    chavePix: '11988881122',
    tipoChavePix: 'telefone',
    taxaEntregaFixa: 6.00,
    ativo: true,
    emServico: true,
    observacoes: 'Turno da noite (18h às 23h30)',
  },
  {
    id: 'drv-2',
    nome: 'Marcos Vinícius Entregador',
    telefone: '(11) 97777-3344',
    veiculo: 'Yamaha Fazer 250 (Preta)',
    placa: 'XYZ9A88',
    chavePix: 'marcos.entregas@gmail.com',
    tipoChavePix: 'email',
    taxaEntregaFixa: 7.00,
    ativo: true,
    emServico: true,
    observacoes: 'Entregas rápidas e finais de semana',
  },
  {
    id: 'drv-3',
    nome: 'Lucas Silva (Bike / Express)',
    telefone: '(11) 96666-5566',
    veiculo: 'Bicicleta Elétrica Caloi',
    placa: '',
    chavePix: 'lucas.silva.pix@banco.com',
    tipoChavePix: 'email',
    taxaEntregaFixa: 4.50,
    ativo: true,
    emServico: false,
    observacoes: 'Atende pedidos em um raio de até 2.5km (Centro)',
  },
];

export const initialUsers: UserAccount[] = [
  {
    id: 'usr-1',
    nome: 'Carlos Eduardo (Gerente)',
    email: 'carlos@pasteldeouro.com',
    telefone: '(11) 99999-1111',
    cargo: 'admin',
    ativo: true,
    permissoes: {
      cardapio: true,
      pedidos: true,
      cozinha: true,
      entregador: true,
      financeiro: true,
      configuracoes: true,
    },
    criadoEm: '2026-01-10T10:00:00Z',
  },
  {
    id: 'usr-2',
    nome: 'Maria Clara (Operadora de Caixa)',
    email: 'maria@pasteldeouro.com',
    telefone: '(11) 98888-2222',
    cargo: 'caixa',
    ativo: true,
    permissoes: {
      cardapio: false,
      pedidos: true,
      cozinha: false,
      entregador: false,
      financeiro: true,
      configuracoes: false,
    },
    criadoEm: '2026-01-15T14:00:00Z',
  },
  {
    id: 'usr-3',
    nome: 'Seu Zé (Fritador / Chefe de Cozinha)',
    email: 'cozinha@pasteldeouro.com',
    telefone: '(11) 97777-3333',
    cargo: 'cozinha',
    ativo: true,
    permissoes: {
      cardapio: false,
      pedidos: false,
      cozinha: true,
      entregador: false,
      financeiro: false,
      configuracoes: false,
    },
    criadoEm: '2026-02-01T08:00:00Z',
  },
  {
    id: 'usr-4',
    nome: 'Lucas Motoboy',
    email: 'lucas.entrega@pasteldeouro.com',
    telefone: '(11) 96666-4444',
    cargo: 'entregador',
    ativo: true,
    permissoes: {
      cardapio: false,
      pedidos: false,
      cozinha: false,
      entregador: true,
      financeiro: false,
      configuracoes: false,
    },
    criadoEm: '2026-02-10T12:00:00Z',
  },
];

export const initialOrders: Order[] = [
  {
    id: 'ord-101',
    numeroSequencial: 101,
    clienteNome: 'João Silva',
    clienteTelefone: '(11) 98765-1122',
    tipoEntrega: 'delivery',
    enderecoEntrega: {
      logradouro: 'Rua Augusta',
      numero: '1250',
      complemento: 'Apto 42',
      bairro: 'Consolação / Higienópolis',
      cidade: 'São Paulo - SP',
      cep: '01304-001',
    },
    itens: [
      {
        id: 'item-1',
        produtoId: 'prod-1',
        nomeProduto: 'Pastel de Carne com Queijo',
        precoUnitario: 14.00,
        quantidade: 2,
        observacao: 'Bem frito e crocante',
        adicionais: [{ id: 'ext-1', nome: 'Queijo Mussarela Extra', preco: 4.50 }],
        subtotal: 37.00,
      },
      {
        id: 'item-2',
        produtoId: 'prod-6',
        nomeProduto: 'Guaraná Antarctica 350ml',
        precoUnitario: 6.00,
        quantidade: 2,
        adicionais: [],
        subtotal: 12.00,
      }
    ],
    subtotal: 49.00,
    taxaEntrega: 7.00,
    desconto: 0,
    valorTotal: 56.00,
    formaPagamento: 'pix',
    statusPagamento: 'pago',
    status: 'preparando',
    observacoesGerais: 'Tocar o interfone do 42',
    criadoEm: new Date(Date.now() - 15 * 60000).toISOString(),
    atualizadoEm: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'ord-102',
    numeroSequencial: 102,
    clienteNome: 'Renata Albuquerque',
    clienteTelefone: '(11) 97654-9988',
    tipoEntrega: 'delivery',
    enderecoEntrega: {
      logradouro: 'Alameda Santos',
      numero: '800',
      bairro: 'Bela Vista / Centro',
      cidade: 'São Paulo - SP',
      cep: '01418-100',
    },
    itens: [
      {
        id: 'item-3',
        produtoId: 'prod-4',
        nomeProduto: 'Pastel de Costela Desfiada',
        precoUnitario: 22.00,
        quantidade: 1,
        observacao: 'Sem cebola se tiver',
        adicionais: [{ id: 'ext-2', nome: 'Catupiry Original Extra', preco: 5.00 }],
        subtotal: 27.00,
      },
      {
        id: 'item-4',
        produtoId: 'prod-5',
        nomeProduto: 'Pastel de Nutella com Morango',
        precoUnitario: 18.00,
        quantidade: 1,
        adicionais: [],
        subtotal: 18.00,
      }
    ],
    subtotal: 45.00,
    taxaEntrega: 5.00,
    desconto: 0,
    valorTotal: 50.00,
    formaPagamento: 'cartao_credito',
    statusPagamento: 'na_entrega',
    status: 'pronto',
    criadoEm: new Date(Date.now() - 25 * 60000).toISOString(),
    atualizadoEm: new Date(Date.now() - 5 * 60000).toISOString(),
    entregadorId: 'usr-4',
    entregadorNome: 'Lucas Motoboy',
  },
  {
    id: 'ord-103',
    numeroSequencial: 103,
    clienteNome: 'Marcos Vinicius',
    clienteTelefone: '(11) 91234-5678',
    tipoEntrega: 'retirada',
    itens: [
      {
        id: 'item-5',
        produtoId: 'prod-2',
        nomeProduto: 'Pastel de Frango com Catupiry',
        precoUnitario: 14.50,
        quantidade: 3,
        adicionais: [{ id: 'ext-5', nome: 'Borda Recheada Catupiry', preco: 6.00 }],
        subtotal: 61.50,
      }
    ],
    subtotal: 61.50,
    taxaEntrega: 0,
    desconto: 0,
    valorTotal: 61.50,
    formaPagamento: 'pix',
    statusPagamento: 'pago',
    status: 'novo',
    observacoesGerais: 'Vou retirar em 20 minutos no balcão',
    criadoEm: new Date(Date.now() - 5 * 60000).toISOString(),
    atualizadoEm: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'ord-100',
    numeroSequencial: 100,
    clienteNome: 'Ana Paula Souza',
    clienteTelefone: '(11) 98877-6655',
    tipoEntrega: 'delivery',
    enderecoEntrega: {
      logradouro: 'Rua Bela Cintra',
      numero: '950',
      bairro: 'Consolação / Higienópolis',
      cidade: 'São Paulo - SP',
      cep: '01415-000',
    },
    itens: [
      {
        id: 'item-6',
        produtoId: 'prod-3',
        nomeProduto: 'Pastel Pizza Especial',
        precoUnitario: 13.00,
        quantidade: 2,
        adicionais: [],
        subtotal: 26.00,
      },
      {
        id: 'item-7',
        produtoId: 'prod-7',
        nomeProduto: 'Caldo de Cana 500ml',
        precoUnitario: 8.50,
        quantidade: 2,
        observacao: 'Com muito limão',
        adicionais: [],
        subtotal: 17.00,
      }
    ],
    subtotal: 43.00,
    taxaEntrega: 7.00,
    desconto: 0,
    valorTotal: 50.00,
    formaPagamento: 'dinheiro',
    statusPagamento: 'pago',
    trocoPara: 100.00,
    status: 'entregue',
    criadoEm: new Date(Date.now() - 70 * 60000).toISOString(),
    atualizadoEm: new Date(Date.now() - 20 * 60000).toISOString(),
    entregadorId: 'usr-4',
    entregadorNome: 'Lucas Motoboy',
  }
];

export const initialTransactions: FinancialTransaction[] = [
  {
    id: 'trx-1',
    tipo: 'entrada',
    categoria: 'venda_pedido',
    descricao: 'Venda Pedido #100 - Ana Paula',
    valor: 50.00,
    formaPagamento: 'dinheiro',
    pedidoId: 'ord-100',
    data: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: 'trx-2',
    tipo: 'entrada',
    categoria: 'venda_pedido',
    descricao: 'Venda Pedido #101 - João Silva (PIX)',
    valor: 56.00,
    formaPagamento: 'pix',
    pedidoId: 'ord-101',
    data: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'trx-3',
    tipo: 'saida',
    categoria: 'ingredientes',
    descricao: 'Compra de 5kg de Queijo Mussarela fresco',
    valor: 145.00,
    formaPagamento: 'pix',
    data: new Date(Date.now() - 180 * 60000).toISOString(),
  },
  {
    id: 'trx-4',
    tipo: 'saida',
    categoria: 'embalagens',
    descricao: 'Reposição de Sacos kraft térmicos para pastel',
    valor: 80.00,
    formaPagamento: 'cartao_debito',
    data: new Date(Date.now() - 240 * 60000).toISOString(),
  }
];
