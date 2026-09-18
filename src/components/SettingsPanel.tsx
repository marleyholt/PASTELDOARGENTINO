import React, { useState } from 'react';
import { 
  Building2, 
  MessageSquare, 
  UtensilsCrossed, 
  QrCode, 
  Truck, 
  Users, 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle,
  Clock,
  DollarSign,
  ShieldCheck,
  Edit2,
  Upload,
  Bike,
  Phone,
  Power,
  ExternalLink
} from 'lucide-react';
import { StoreConfig, Category, Product, ProductExtra, DeliveryZone, UserAccount, RoleType, DeliveryDriver } from '../types';

interface SettingsPanelProps {
  config: StoreConfig;
  onSaveConfig: (newConfig: StoreConfig) => void;
  categories: Category[];
  onSaveCategories: (cats: Category[]) => void;
  products: Product[];
  onSaveProducts: (prods: Product[]) => void;
  extras: ProductExtra[];
  onSaveExtras: (extras: ProductExtra[]) => void;
  deliveryZones: DeliveryZone[];
  onSaveDeliveryZones: (zones: DeliveryZone[]) => void;
  users: UserAccount[];
  onSaveUsers: (users: UserAccount[]) => void;
  drivers?: DeliveryDriver[];
  onSaveDrivers?: (drivers: DeliveryDriver[]) => void;
}

type TabType = 'loja' | 'whatsapp' | 'cardapio' | 'pagamento' | 'entrega' | 'motoboys' | 'usuarios';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onSaveConfig,
  categories,
  onSaveCategories,
  products,
  onSaveProducts,
  extras,
  onSaveExtras,
  deliveryZones,
  onSaveDeliveryZones,
  users,
  onSaveUsers,
  drivers = [],
  onSaveDrivers,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('loja');
  const [formData, setFormData] = useState<StoreConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Estados locais para categorias, extras, zonas e motoboys
  const [driverList, setDriverList] = useState<DeliveryDriver[]>([...drivers]);
  const [isEditingDriver, setIsEditingDriver] = useState<DeliveryDriver | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverVehicle, setDriverVehicle] = useState('Honda CG 160 Fan');
  const [driverPlate, setDriverPlate] = useState('');
  const [driverPix, setDriverPix] = useState('');
  const [driverPixType, setDriverPixType] = useState<'cpf' | 'telefone' | 'email' | 'aleatoria'>('telefone');
  const [driverFee, setDriverFee] = useState('6.00');
  const [driverNotes, setDriverNotes] = useState('');
  const [showDriverForm, setShowDriverForm] = useState(false);

  const [catList, setCatList] = useState<Category[]>([...categories]);
  const [newCatName, setNewCatName] = useState('');

  const [extraList, setExtraList] = useState<ProductExtra[]>([...extras]);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('4.00');

  const [zoneList, setZoneList] = useState<DeliveryZone[]>([...deliveryZones]);
  const [newZoneNeighborhood, setNewZoneNeighborhood] = useState('');
  const [newZoneFee, setNewZoneFee] = useState('6.00');
  const [newZoneTime, setNewZoneTime] = useState('40');

  const [userList, setUserList] = useState<UserAccount[]>([...users]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<RoleType>('caixa');

  // Modal para adicionar/editar produto rápido
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('15.00');
  const [newProdCatId, setNewProdCatId] = useState(categories[0]?.id || '');
  const [newProdImage, setNewProdImage] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);

  const handleSaveGeneralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Gestão de Categorias
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      nome: newCatName.trim(),
      ordem: catList.length + 1,
      ativo: true,
    };
    const updated = [...catList, newCat];
    setCatList(updated);
    onSaveCategories(updated);
    setNewCatName('');
  };

  const handleToggleCategory = (id: string) => {
    const updated = catList.map(c => c.id === id ? { ...c, ativo: !c.ativo } : c);
    setCatList(updated);
    onSaveCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
    const updated = catList.filter(c => c.id !== id);
    setCatList(updated);
    onSaveCategories(updated);
  };

  // Gestão de Adicionais
  const handleAddExtra = () => {
    if (!newExtraName.trim()) return;
    const newExt: ProductExtra = {
      id: `ext-${Date.now()}`,
      nome: newExtraName.trim(),
      preco: parseFloat(newExtraPrice) || 0,
      disponivel: true,
    };
    const updated = [...extraList, newExt];
    setExtraList(updated);
    onSaveExtras(updated);
    setNewExtraName('');
    setNewExtraPrice('4.00');
  };

  const handleToggleExtra = (id: string) => {
    const updated = extraList.map(e => e.id === id ? { ...e, disponivel: !e.disponivel } : e);
    setExtraList(updated);
    onSaveExtras(updated);
  };

  const handleDeleteExtra = (id: string) => {
    const updated = extraList.filter(e => e.id !== id);
    setExtraList(updated);
    onSaveExtras(updated);
  };

  // Gestão de Zonas de Entrega
  const handleAddZone = () => {
    if (!newZoneNeighborhood.trim()) return;
    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      bairro: newZoneNeighborhood.trim(),
      taxa: parseFloat(newZoneFee) || 0,
      tempoEstimadoMin: parseInt(newZoneTime, 10) || 45,
      ativo: true,
    };
    const updated = [...zoneList, newZone];
    setZoneList(updated);
    onSaveDeliveryZones(updated);
    setNewZoneNeighborhood('');
    setNewZoneFee('6.00');
    setNewZoneTime('40');
  };

  const handleToggleZone = (id: string) => {
    const updated = zoneList.map(z => z.id === id ? { ...z, ativo: !z.ativo } : z);
    setZoneList(updated);
    onSaveDeliveryZones(updated);
  };

  const handleDeleteZone = (id: string) => {
    const updated = zoneList.filter(z => z.id !== id);
    setZoneList(updated);
    onSaveDeliveryZones(updated);
  };

  // Gestão de Produtos
  const [productImageFile, setProductImageFile] = useState<string>('');
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const handleImageFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProductImageFile(result);
      setNewProdImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = () => {
    if (!newProdName.trim()) return;
    const priceNum = parseFloat(newProdPrice) || 0;
    const finalImage = productImageFile || newProdImage || 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80';

    if (isEditingProduct) {
      const updated = products.map(p => 
        p.id === isEditingProduct.id 
          ? {
              ...p,
              nome: newProdName,
              descricao: newProdDesc,
              preco: priceNum,
              categoriaId: newProdCatId,
              imagemUrl: finalImage,
            }
          : p
      );
      onSaveProducts(updated);
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        categoriaId: newProdCatId || categories[0]?.id || 'cat-1',
        nome: newProdName,
        descricao: newProdDesc,
        preco: priceNum,
        imagemUrl: finalImage,
        ativo: true,
        destaque: false,
        adicionaisPermitidos: extraList.map(e => e.id),
      };
      onSaveProducts([...products, newProduct]);
    }

    setShowProductModal(false);
    setIsEditingProduct(null);
    setNewProdName('');
    setNewProdDesc('');
    setNewProdPrice('15.00');
    setNewProdImage('');
    setProductImageFile('');
  };

  const handleOpenEditProduct = (prod: Product) => {
    setIsEditingProduct(prod);
    setNewProdName(prod.nome);
    setNewProdDesc(prod.descricao);
    setNewProdPrice(prod.preco.toString());
    setNewProdCatId(prod.categoriaId);
    setNewProdImage(prod.imagemUrl);
    setProductImageFile(prod.imagemUrl);
    setShowProductModal(true);
  };

  const handleToggleProduct = (id: string) => {
    const updated = products.map(p => p.id === id ? { ...p, ativo: !p.ativo } : p);
    onSaveProducts(updated);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    onSaveProducts(updated);
  };

  // Gestão de Usuários
  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const defaultPerms = {
      cardapio: newUserRole === 'admin',
      pedidos: newUserRole === 'admin' || newUserRole === 'caixa',
      cozinha: newUserRole === 'admin' || newUserRole === 'cozinha',
      entregador: newUserRole === 'admin' || newUserRole === 'entregador',
      financeiro: newUserRole === 'admin' || newUserRole === 'caixa',
      configuracoes: newUserRole === 'admin',
    };
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      nome: newUserName.trim(),
      email: newUserEmail.trim(),
      telefone: '(11) 99999-0000',
      cargo: newUserRole,
      ativo: true,
      permissoes: defaultPerms,
      criadoEm: new Date().toISOString(),
    };
    const updated = [...userList, newUser];
    setUserList(updated);
    onSaveUsers(updated);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleToggleUserPermission = (userId: string, moduleKey: keyof UserAccount['permissoes']) => {
    const updated = userList.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          permissoes: {
            ...u.permissoes,
            [moduleKey]: !u.permissoes[moduleKey],
          }
        };
      }
      return u;
    });
    setUserList(updated);
    onSaveUsers(updated);
  };

  // Gestão de Motoboys
  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !driverPhone.trim()) {
      alert('Informe ao menos o nome e o telefone do motoboy.');
      return;
    }

    if (isEditingDriver) {
      const updated = driverList.map(d => 
        d.id === isEditingDriver.id
          ? {
              ...d,
              nome: driverName.trim(),
              telefone: driverPhone.trim(),
              veiculo: driverVehicle.trim(),
              placa: driverPlate.trim().toUpperCase(),
              chavePix: driverPix.trim(),
              tipoChavePix: driverPixType,
              taxaEntregaFixa: parseFloat(driverFee) || 0,
              observacoes: driverNotes.trim(),
            }
          : d
      );
      setDriverList(updated);
      if (onSaveDrivers) onSaveDrivers(updated);
    } else {
      const newDriver: DeliveryDriver = {
        id: `drv-${Date.now()}`,
        nome: driverName.trim(),
        telefone: driverPhone.trim(),
        veiculo: driverVehicle.trim() || 'Moto',
        placa: driverPlate.trim().toUpperCase(),
        chavePix: driverPix.trim(),
        tipoChavePix: driverPixType,
        taxaEntregaFixa: parseFloat(driverFee) || 6.00,
        ativo: true,
        emServico: true,
        observacoes: driverNotes.trim(),
      };
      const updated = [...driverList, newDriver];
      setDriverList(updated);
      if (onSaveDrivers) onSaveDrivers(updated);
    }

    setIsEditingDriver(null);
    setDriverName('');
    setDriverPhone('');
    setDriverVehicle('Honda CG 160 Fan');
    setDriverPlate('');
    setDriverPix('');
    setDriverFee('6.00');
    setDriverNotes('');
    setShowDriverForm(false);
  };

  const handleEditDriver = (driver: DeliveryDriver) => {
    setIsEditingDriver(driver);
    setDriverName(driver.nome);
    setDriverPhone(driver.telefone);
    setDriverVehicle(driver.veiculo);
    setDriverPlate(driver.placa || '');
    setDriverPix(driver.chavePix || '');
    setDriverPixType(driver.tipoChavePix || 'telefone');
    setDriverFee(driver.taxaEntregaFixa?.toString() || '6.00');
    setDriverNotes(driver.observacoes || '');
    setShowDriverForm(true);
  };

  const handleToggleDriverDuty = (id: string) => {
    const updated = driverList.map(d => d.id === id ? { ...d, emServico: !d.emServico } : d);
    setDriverList(updated);
    if (onSaveDrivers) onSaveDrivers(updated);
  };

  const handleToggleDriverActive = (id: string) => {
    const updated = driverList.map(d => d.id === id ? { ...d, ativo: !d.ativo } : d);
    setDriverList(updated);
    if (onSaveDrivers) onSaveDrivers(updated);
  };

  const handleDeleteDriver = (id: string) => {
    if (confirm('Tem certeza que deseja remover este entregador?')) {
      const updated = driverList.filter(d => d.id !== id);
      setDriverList(updated);
      if (onSaveDrivers) onSaveDrivers(updated);
    }
  };

  const tabs = [
    { id: 'loja' as TabType, label: 'Dados da Pastelaria', icon: Building2 },
    { id: 'whatsapp' as TabType, label: 'Integração WhatsApp', icon: MessageSquare },
    { id: 'cardapio' as TabType, label: 'Gestão de Cardápio', icon: UtensilsCrossed },
    { id: 'pagamento' as TabType, label: 'Pix & Pagamentos', icon: QrCode },
    { id: 'entrega' as TabType, label: 'Taxas & Bairros', icon: Truck },
    { id: 'motoboys' as TabType, label: 'Motoboys & Entregadores', icon: Bike },
    { id: 'usuarios' as TabType, label: 'Níveis de Acesso', icon: Users },
  ];

  return (
    <div id="settings-unified-panel" className="max-w-7xl mx-auto px-4 py-6">
      {/* Cabeçalho da Configuração */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-amber-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-amber-950 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-600" />
            Painel Central de Configurações
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Controle total sobre dados da pastelaria, cardápio, WhatsApp, chaves Pix e permissões de funcionários.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg text-sm font-semibold animate-fade-in">
            <Check className="w-5 h-5 text-emerald-600" />
            Configurações salvas com sucesso!
          </div>
        )}
      </div>

      {/* Navegação de Abas */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 border-b border-stone-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-button-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Aba 1: Dados da Pastelaria */}
      {activeTab === 'loja' && (
        <form onSubmit={handleSaveGeneralConfig} className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-stone-900">Identificação & Localização</h2>
            <p className="text-sm text-stone-500">Dados exibidos no cabeçalho do cardápio e no comprovante impresso.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Nome da Pastelaria *
              </label>
              <input
                id="input-store-name"
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                CNPJ ou CPF do Negócio
              </label>
              <input
                id="input-store-doc"
                type="text"
                value={formData.cnpjCpf}
                onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Telefone Fixo / Contato
              </label>
              <input
                id="input-store-phone"
                type="text"
                value={formData.telefoneContato}
                onChange={(e) => setFormData({ ...formData, telefoneContato: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                URL do Logotipo / Imagem
              </label>
              <input
                id="input-store-logo"
                type="url"
                value={formData.logotipoUrl}
                onChange={(e) => setFormData({ ...formData, logotipoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Endereço Completo da Pastelaria
              </label>
              <input
                id="input-store-address"
                type="text"
                value={formData.enderecoCompleto}
                onChange={(e) => setFormData({ ...formData, enderecoCompleto: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Horário de Atendimento
              </label>
              <input
                id="input-store-hours"
                type="text"
                value={formData.horarioFuncionamento}
                onChange={(e) => setFormData({ ...formData, horarioFuncionamento: e.target.value })}
                placeholder="Ex: Terça a Domingo: 17:00 às 23:30"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Pedido Mínimo (R$)
              </label>
              <input
                type="number"
                step="0.50"
                value={formData.pedidoMinimo}
                onChange={(e) => setFormData({ ...formData, pedidoMinimo: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Tempo Retirada (Minutos)
              </label>
              <input
                type="number"
                value={formData.tempoRetiradaMin}
                onChange={(e) => setFormData({ ...formData, tempoRetiradaMin: parseInt(e.target.value, 10) || 20 })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Tempo Entrega Médio (Minutos)
              </label>
              <input
                type="number"
                value={formData.tempoEntregaPadraoMin}
                onChange={(e) => setFormData({ ...formData, tempoEntregaPadraoMin: parseInt(e.target.value, 10) || 45 })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              id="btn-save-store-config"
              type="submit"
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Save className="w-5 h-5" />
              Salvar Dados da Loja
            </button>
          </div>
        </form>
      )}

      {/* Conteúdo da Aba 2: WhatsApp & Mensagens */}
      {activeTab === 'whatsapp' && (
        <form onSubmit={handleSaveGeneralConfig} className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Configuração do WhatsApp Oficial da Pastelaria
            </h2>
            <p className="text-sm text-stone-500">
              Quando o cliente clica em "Finalizar Pedido", essa mensagem é montada automaticamente e enviada para este número.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Número de WhatsApp (com DDD e Código do País 55) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500 font-semibold text-sm">
                    +
                  </span>
                  <input
                    id="input-store-whatsapp"
                    type="text"
                    required
                    value={formData.whatsappOficial}
                    onChange={(e) => setFormData({ ...formData, whatsappOficial: e.target.value.replace(/\D/g, '') })}
                    placeholder="5511987654321"
                    className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Exemplo correto para São Paulo: <strong>5511987654321</strong> (sem traços, sem parênteses).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Template da Mensagem Automática
                </label>
                <textarea
                  id="input-whatsapp-template"
                  rows={9}
                  value={formData.mensagemWhatsappPadrao}
                  onChange={(e) => setFormData({ ...formData, mensagemWhatsappPadrao: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <p className="text-xs text-stone-500 mt-1">
                  Variáveis suportadas: <code className="text-emerald-700 font-bold">{'{loja}'}</code>, <code className="text-emerald-700 font-bold">{'{numero}'}</code>, <code className="text-emerald-700 font-bold">{'{cliente}'}</code>, <code className="text-emerald-700 font-bold">{'{telefone}'}</code>, <code className="text-emerald-700 font-bold">{'{itens}'}</code>, <code className="text-emerald-700 font-bold">{'{total}'}</code>, <code className="text-emerald-700 font-bold">{'{pagamento}'}</code>.
                </p>
              </div>
            </div>

            {/* Simulação em tempo real da mensagem */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Prévia do Balão do WhatsApp (Como o lojista vai receber):
              </label>
              <div className="bg-emerald-900/10 border border-emerald-300 rounded-xl p-4 text-xs font-mono text-stone-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {formData.mensagemWhatsappPadrao
                  .replace('{loja}', formData.nome)
                  .replace('{numero}', '104')
                  .replace('{cliente}', 'Mariana Ribeiro')
                  .replace('{telefone}', '(11) 98888-7777')
                  .replace('{tipo_entrega}', 'Delivery')
                  .replace('{endereco}', '📍 R. Peixoto Gomide, 450 - Consolação')
                  .replace('{itens}', '• 2x Pastel de Carne c/ Queijo (+ Queijo Extra)\n• 1x Guaraná 350ml')
                  .replace('{taxa_entrega}', '7.00')
                  .replace('{total}', '44.00')
                  .replace('{pagamento}', 'PIX (Comprovante em anexo)')
                  .replace('{observacoes}', 'Obs: Massa bem frita!')}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              id="btn-save-whatsapp-config"
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Save className="w-5 h-5" />
              Salvar Configuração do WhatsApp
            </button>
          </div>
        </form>
      )}

      {/* Conteúdo da Aba 3: Gestão de Cardápio (Produtos, Categorias, Adicionais) */}
      {activeTab === 'cardapio' && (
        <div className="space-y-6">
          {/* Sub-bloco: Categorias & Adicionais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categorias */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 mb-3 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                Categorias do Cardápio
              </h2>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Nova categoria (ex: Pastéis Especiais)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {catList.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-sm">
                    <span className={`font-medium ${cat.ativo ? 'text-stone-800' : 'text-stone-400 line-through'}`}>
                      {cat.nome}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(cat.id)}
                        className={`px-2 py-1 text-xs rounded-md font-semibold ${
                          cat.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {cat.ativo ? 'Ativa' : 'Inativa'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-stone-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Adicionais / Bordas / Extras */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 mb-3 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" />
                Adicionais & Bordas (Extras do Pastel)
              </h2>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Nome do extra (ex: Borda Recheada)"
                  value={newExtraName}
                  onChange={(e) => setNewExtraName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  step="0.50"
                  placeholder="R$"
                  value={newExtraPrice}
                  onChange={(e) => setNewExtraPrice(e.target.value)}
                  className="w-20 px-2 py-2 border border-stone-300 rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddExtra}
                  className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {extraList.map(ext => (
                  <div key={ext.id} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-sm">
                    <div>
                      <span className={`font-medium ${ext.disponivel ? 'text-stone-800' : 'text-stone-400 line-through'}`}>
                        {ext.nome}
                      </span>
                      <span className="text-xs text-amber-700 font-bold ml-2">
                        + R$ {ext.preco.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleExtra(ext.id)}
                        className={`px-2 py-1 text-xs rounded-md font-semibold ${
                          ext.disponivel ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {ext.disponivel ? 'Disponível' : 'Esgotado'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExtra(ext.id)}
                        className="text-stone-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-bloco: Listagem de Produtos com Botão de Novo */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Cardápio de Pastéis & Bebidas Cadastrados</h2>
                <p className="text-xs text-stone-500">Ative ou pause itens instantaneamente sem precisar alterar código.</p>
              </div>
              <button
                id="btn-open-new-product-modal"
                type="button"
                onClick={() => {
                  setIsEditingProduct(null);
                  setNewProdName('');
                  setNewProdDesc('');
                  setNewProdPrice('16.00');
                  setNewProdCatId(catList[0]?.id || '');
                  setNewProdImage('');
                  setShowProductModal(true);
                }}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" /> Cadastrar Novo Pastel / Produto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(prod => {
                const cat = catList.find(c => c.id === prod.categoriaId);
                return (
                  <div 
                    key={prod.id} 
                    className={`border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
                      prod.ativo ? 'bg-white border-stone-200 shadow-xs hover:shadow-md' : 'bg-stone-100 border-stone-300 opacity-60'
                    }`}
                  >
                    {/* Capa do Produto */}
                    <div className="relative h-40 w-full bg-stone-100 overflow-hidden">
                      <img 
                        src={prod.imagemUrl || 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80'} 
                        alt={prod.nome}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider bg-amber-400/90 backdrop-blur-xs px-2.5 py-1 rounded-md shadow-xs">
                          {cat?.nome || 'Geral'}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleToggleProduct(prod.id)}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold shadow-xs transition-all ${
                            prod.ativo ? 'bg-emerald-500 text-white' : 'bg-stone-600 text-white'
                          }`}
                        >
                          {prod.ativo ? 'Ativo' : 'Pausado'}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-stone-900 text-base leading-snug">{prod.nome}</h3>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1">{prod.descricao}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-base font-black text-stone-900">
                          R$ {prod.preco.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editar pastel e trocar foto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir pastel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal de Adicionar / Editar Produto */}
          {showProductModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <h3 className="text-lg font-black text-stone-900">
                    {isEditingProduct ? 'Editar Pastel / Item' : 'Novo Pastel no Cardápio'}
                  </h3>
                  <button 
                    onClick={() => setShowProductModal(false)}
                    className="text-stone-400 hover:text-stone-600 text-lg font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Upload de Foto de Capa do Produto */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Foto de Capa do Produto *
                  </label>
                  
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                    onDragLeave={() => setIsDraggingImage(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(false);
                      if (e.dataTransfer.files?.[0]) {
                        handleImageFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                      isDraggingImage 
                        ? 'border-amber-500 bg-amber-50/50' 
                        : (productImageFile || newProdImage)
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-stone-300 hover:border-amber-400 bg-stone-50'
                    }`}
                  >
                    {(productImageFile || newProdImage) ? (
                      <div className="space-y-3">
                        <div className="relative w-full h-44 rounded-lg overflow-hidden border border-stone-200 shadow-inner">
                          <img 
                            src={productImageFile || newProdImage} 
                            alt="Preview do pastel" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-xs">
                            Foto de Capa Atual
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors">
                            Trocar Foto
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageFileSelect(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setProductImageFile('');
                              setNewProdImage('');
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-800">
                            Arraste uma foto aqui ou clique para fazer upload
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Formatos suportados: PNG, JPG ou WebP (Foto de capa do pastel)
                          </p>
                        </div>
                        <label className="inline-block cursor-pointer bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs mt-2 transition-all">
                          Selecionar Foto no Computador / Celular
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleImageFileSelect(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Atalhos rápidos de fotos prontas */}
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                      Ou escolha uma foto de pastel pronta:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { title: 'Pastel de Carne', url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80' },
                        { title: 'Pastel de Queijo', url: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=500&auto=format&fit=crop&q=80' },
                        { title: 'Pastel Doce', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80' },
                        { title: 'Bebidas/Refri', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80' },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setProductImageFile(preset.url);
                            setNewProdImage(preset.url);
                          }}
                          className="group relative h-14 rounded-lg overflow-hidden border border-stone-200 hover:border-amber-500 transition-all text-left"
                        >
                          <img src={preset.url} alt={preset.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                            <span className="text-[9px] font-bold text-white truncate">{preset.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Item *</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="Ex: Pastel de Palmito Especial"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Preço de Venda (R$) *</label>
                    <input
                      type="number"
                      step="0.50"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria *</label>
                    <select
                      value={newProdCatId}
                      onChange={(e) => setNewProdCatId(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    >
                      {catList.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição / Ingredientes</label>
                  <textarea
                    rows={2}
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    placeholder="Ex: Palmito refogado com tempero verde, queijo e azeitonas..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm font-semibold hover:bg-stone-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProduct}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold shadow-xs"
                  >
                    Salvar Produto
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 4: Pagamento & Pix */}
      {activeTab === 'pagamento' && (
        <form onSubmit={handleSaveGeneralConfig} className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-600" />
              Configuração de Recebimento via Pix & Formas de Pagamento
            </h2>
            <p className="text-sm text-stone-500">
              Esses dados serão apresentados ao cliente quando ele escolher pagar por Pix antes de gerar a mensagem no WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Tipo da Chave Pix *
                </label>
                <select
                  value={formData.tipoChavePix}
                  onChange={(e) => setFormData({ ...formData, tipoChavePix: e.target.value as any })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                >
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="telefone">Telefone / Celular</option>
                  <option value="aleatoria">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Chave Pix Oficial *
                </label>
                <input
                  type="text"
                  required
                  value={formData.chavePix}
                  onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                  placeholder="sua-chave-pix@aqui.com"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Nome do Titular da Conta (Recebedor)
                </label>
                <input
                  type="text"
                  value={formData.nomeTitularPix}
                  onChange={(e) => setFormData({ ...formData, nomeTitularPix: e.target.value })}
                  placeholder="Nome Fantasia ou Razão Social"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Instrução para a Fita de Caixa & Entregadores
                </h4>
                <p className="text-xs text-amber-800">
                  Para pagamentos no ato da entrega (Dinheiro / Cartão na maquininha móvel), a taxa e troco são calculados automaticamente no fechamento do carrinho.
                </p>
              </div>
            </div>

            {/* Cartão demonstrativo Pix */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex flex-col items-center text-center">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                Exibição do Pix no Checkout
              </span>
              <div className="w-36 h-36 bg-white border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center p-2 mb-3 shadow-inner">
                <QrCode className="w-20 h-20 text-stone-700" />
                <span className="text-[10px] text-stone-500 font-bold uppercase mt-1">QR Code Estático</span>
              </div>
              <p className="text-xs font-mono font-bold text-stone-800 bg-white px-2 py-1 border rounded-md break-all">
                {formData.chavePix || 'Chave não cadastrada'}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {formData.nomeTitularPix || 'Titular da Conta'}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              id="btn-save-pix-config"
              type="submit"
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all"
            >
              <Save className="w-5 h-5" />
              Salvar Dados de Pagamento
            </button>
          </div>
        </form>
      )}

      {/* Conteúdo da Aba 5: Taxas & Bairros de Entrega */}
      {activeTab === 'entrega' && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              Tabela de Taxas de Entrega por Bairro / Região
            </h2>
            <p className="text-sm text-stone-500">
              Defina os bairros atendidos e a taxa respectiva. Ao selecionar o bairro, o cliente terá o valor somado no pedido.
            </p>
          </div>

          {/* Adicionar novo bairro */}
          <div className="flex flex-wrap gap-3 items-end p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Bairro / Região</label>
              <input
                type="text"
                placeholder="Ex: Jardim das Flores"
                value={newZoneNeighborhood}
                onChange={(e) => setNewZoneNeighborhood(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Taxa (R$)</label>
              <input
                type="number"
                step="0.50"
                value={newZoneFee}
                onChange={(e) => setNewZoneFee(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Tempo (min)</label>
              <input
                type="number"
                value={newZoneTime}
                onChange={(e) => setNewZoneTime(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddZone}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xs h-[38px]"
            >
              <Plus className="w-4 h-4" /> Adicionar Região
            </button>
          </div>

          {/* Tabela de bairros */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-700 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Bairro / Região</th>
                  <th className="px-4 py-3">Taxa de Entrega</th>
                  <th className="px-4 py-3">Tempo Médio Estimado</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {zoneList.map((zone) => (
                  <tr key={zone.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-semibold text-stone-900">{zone.bairro}</td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">R$ {zone.taxa.toFixed(2)}</td>
                    <td className="px-4 py-3 text-stone-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {zone.tempoEstimadoMin} min
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleZone(zone.id)}
                        className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                          zone.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {zone.ativo ? 'Atendido' : 'Pausado'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteZone(zone.id)}
                        className="text-stone-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba Motoboys: Gestão & Configuração dos Entregadores */}
      {activeTab === 'motoboys' && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Bike className="w-5 h-5 text-amber-600" />
                Cadastro & Configuração de Motoboys
              </h2>
              <p className="text-sm text-stone-500">
                Cadastre os entregadores da pastelaria para atribuí-los a cada pedido delivery no Kanban e acompanhar o status das corridas.
              </p>
            </div>

            <button
              type="button"
              id="btn-add-driver-toggle"
              onClick={() => {
                if (showDriverForm) {
                  setShowDriverForm(false);
                  setIsEditingDriver(null);
                } else {
                  setIsEditingDriver(null);
                  setDriverName('');
                  setDriverPhone('');
                  setDriverVehicle('Honda CG 160 Fan');
                  setDriverPlate('');
                  setDriverPix('');
                  setDriverFee('6.00');
                  setDriverNotes('');
                  setShowDriverForm(true);
                }
              }}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              {showDriverForm ? 'Fechar Formulário' : 'Novo Motoboy'}
            </button>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">Total de Entregadores</span>
              <div className="text-2xl font-black text-stone-900 mt-0.5">{driverList.length}</div>
              <span className="text-[10px] text-stone-500">Cadastrados no sistema</span>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Em Serviço Agora</span>
              <div className="text-2xl font-black text-emerald-900 mt-0.5">
                {driverList.filter(d => d.emServico && d.ativo).length}
              </div>
              <span className="text-[10px] text-emerald-700">Disponíveis para corridas</span>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">Taxa Média de Repasse</span>
              <div className="text-2xl font-black text-amber-950 font-mono mt-0.5">
                R$ {(driverList.reduce((acc, d) => acc + (d.taxaEntregaFixa || 0), 0) / (driverList.length || 1)).toFixed(2)}
              </div>
              <span className="text-[10px] text-amber-700">Por pedido entregue</span>
            </div>
          </div>

          {/* Formulário de Cadastro / Edição de Motoboy */}
          {showDriverForm && (
            <form onSubmit={handleSaveDriver} className="p-5 bg-stone-50 rounded-2xl border-2 border-amber-300 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h3 className="font-black text-sm text-amber-950 flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-amber-600" />
                  {isEditingDriver ? `Editar Motoboy: ${isEditingDriver.nome}` : 'Cadastrar Novo Motoboy'}
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowDriverForm(false); setIsEditingDriver(null); }}
                  className="text-xs text-stone-500 hover:text-stone-800 font-bold"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nome Completo do Motoboy *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo da Silva"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: (11) 98888-1122"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Veículo / Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Honda CG 160 Fan (Vermelha)"
                    value={driverVehicle}
                    onChange={(e) => setDriverVehicle(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Placa do Veículo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: BRA2E19"
                    value={driverPlate}
                    onChange={(e) => setDriverPlate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tipo de Chave PIX
                  </label>
                  <select
                    value={driverPixType}
                    onChange={(e) => setDriverPixType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    <option value="telefone">Telefone</option>
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Chave PIX (para repasse)
                  </label>
                  <input
                    type="text"
                    placeholder="Chave PIX do motoboy"
                    value={driverPix}
                    onChange={(e) => setDriverPix(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Taxa Fixa Repassada (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    placeholder="6.00"
                    value={driverFee}
                    onChange={(e) => setDriverFee(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Observações / Turno de Trabalho
                </label>
                <input
                  type="text"
                  placeholder="Ex: Turno da noite (18h às 23h30) • Terça a Domingo"
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDriverForm(false); setIsEditingDriver(null); }}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-xs font-black shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {isEditingDriver ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          )}

          {/* Tabela de Motoboys Cadastrados */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-700 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Motoboy & Contato</th>
                  <th className="px-4 py-3">Veículo & Placa</th>
                  <th className="px-4 py-3">Taxa Repasse</th>
                  <th className="px-4 py-3">Chave PIX</th>
                  <th className="px-4 py-3 text-center">Em Serviço</th>
                  <th className="px-4 py-3 text-center">Cadastro</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {driverList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-stone-400 text-xs">
                      Nenhum motoboy cadastrado ainda. Clique em "+ Novo Motoboy" acima para adicionar.
                    </td>
                  </tr>
                ) : (
                  driverList.map((driver) => {
                    const cleanPhone = driver.telefone.replace(/\D/g, '');
                    const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : '#';

                    return (
                      <tr key={driver.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${driver.emServico ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                            {driver.nome}
                          </div>
                          <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                            <span>{driver.telefone}</span>
                            {cleanPhone && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold flex items-center gap-0.5"
                              >
                                <MessageSquare className="w-3 h-3" /> WhatsApp
                              </a>
                            )}
                          </div>
                          {driver.observacoes && (
                            <span className="text-[10px] text-stone-400 block mt-0.5">
                              {driver.observacoes}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-stone-800 font-semibold text-xs flex items-center gap-1">
                            <Bike className="w-3.5 h-3.5 text-stone-400" />
                            {driver.veiculo}
                          </div>
                          {driver.placa && (
                            <span className="inline-block mt-0.5 text-[10px] font-mono font-bold bg-stone-100 border border-stone-300 px-1.5 py-0.2 rounded text-stone-700">
                              {driver.placa}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-emerald-800 text-xs">
                          R$ {(driver.taxaEntregaFixa || 0).toFixed(2)}
                        </td>

                        <td className="px-4 py-3">
                          {driver.chavePix ? (
                            <div>
                              <span className="font-mono text-xs text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                                {driver.chavePix}
                              </span>
                              <span className="text-[10px] text-stone-400 block uppercase mt-0.5">
                                {driver.tipoChavePix}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-400 italic">Não informada</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleDriverDuty(driver.id)}
                            className={`px-2.5 py-1 text-xs rounded-full font-bold transition-all shadow-xs ${
                              driver.emServico
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                            }`}
                          >
                            {driver.emServico ? '🟢 Em Serviço' : '⚪ Fora de Turno'}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleDriverActive(driver.id)}
                            className={`px-2 py-0.5 text-[11px] rounded font-bold ${
                              driver.ativo ? 'bg-blue-50 text-blue-700' : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {driver.ativo ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleEditDriver(driver)}
                            className="text-stone-400 hover:text-amber-700 p-1 rounded hover:bg-stone-100"
                            title="Editar dados"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="text-stone-400 hover:text-red-600 p-1 rounded hover:bg-stone-100"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 6: Controle de Usuários & Níveis de Acesso */}
      {activeTab === 'usuarios' && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              Níveis de Acesso e Permissões por Usuário
            </h2>
            <p className="text-sm text-stone-500">
              Defina o que cada funcionário (Cozinha, Entregador, Caixa ou Gerente) pode visualizar ou alterar no sistema.
            </p>
          </div>

          {/* Adicionar Usuário */}
          <div className="flex flex-wrap gap-3 items-end p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome Completo</label>
              <input
                type="text"
                placeholder="Ex: Roberto da Silva"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail de Login</label>
              <input
                type="email"
                placeholder="roberto@pastelaria.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-semibold text-stone-700 mb-1">Cargo / Função</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as RoleType)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
              >
                <option value="admin">Administrador</option>
                <option value="caixa">Caixa / Balcão</option>
                <option value="cozinha">Cozinha / KDS</option>
                <option value="entregador">Entregador</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddUser}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xs h-[38px]"
            >
              <Plus className="w-4 h-4" /> Cadastrar Usuário
            </button>
          </div>

          {/* Matriz de Permissões */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-700 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Usuário & Cargo</th>
                  <th className="px-3 py-3 text-center">Cardápio</th>
                  <th className="px-3 py-3 text-center">Kanban/Pedidos</th>
                  <th className="px-3 py-3 text-center">Cozinha (KDS)</th>
                  <th className="px-3 py-3 text-center">Entregas</th>
                  <th className="px-3 py-3 text-center">Financeiro</th>
                  <th className="px-3 py-3 text-center rounded-r-lg">Configurações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {userList.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-stone-900">{user.nome}</div>
                      <div className="text-xs text-stone-500">{user.email} • <span className="uppercase font-semibold text-amber-700">{user.cargo}</span></div>
                    </td>
                    {(['cardapio', 'pedidos', 'cozinha', 'entregador', 'financeiro', 'configuracoes'] as const).map((mod) => (
                      <td key={mod} className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={user.permissoes[mod]}
                          onChange={() => handleToggleUserPermission(user.id, mod)}
                          className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
