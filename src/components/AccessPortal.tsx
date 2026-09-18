import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Bike, 
  ShieldCheck, 
  ChefHat, 
  MapPin, 
  ChevronDown, 
  Clock, 
  Sparkles,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { StoreConfig, DeliveryDriver, UserSession } from '../types';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AccessPortalProps {
  config: StoreConfig;
  drivers: DeliveryDriver[];
  onSelectProfile: (session: UserSession, targetView?: 'menu' | 'tracker' | 'delivery' | 'kitchen' | 'kanban') => void;
}

export const AccessPortal: React.FC<AccessPortalProps> = ({
  config,
  drivers,
  onSelectProfile,
}) => {
  // Modal do Motoboy
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverRegisterInput, setDriverRegisterInput] = useState('');
  const [driverPasswordInput, setDriverPasswordInput] = useState('');
  const [driverError, setDriverError] = useState<string | null>(null);

  // Modal da Cozinha (KDS com Senha)
  const [showKitchenModal, setShowKitchenModal] = useState(false);
  const [kitchenPasswordInput, setKitchenPasswordInput] = useState('');
  const [kitchenError, setKitchenError] = useState<string | null>(null);

  // Modal do Administrador (Google OAuth)
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Manipulador de login do Motoboy por número de registro e senha
  const handleDriverLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = driverRegisterInput.trim().toLowerCase();

    if (!cleanInput) {
      setDriverError('Digite o seu número de registro ou identificação.');
      return;
    }

    if (!driverPasswordInput.trim()) {
      setDriverError('Digite a sua senha de acesso.');
      return;
    }

    // Busca o motoboy pelo registro (ex: "1", "2"), pelo ID ("drv-1") ou pelo telefone
    const matchedDriver = drivers.find(d => {
      const registro = (d.codigoRegistro || '').toLowerCase().trim();
      const idNumber = d.id.replace(/\D/g, '');
      const idMatch = d.id.toLowerCase() === cleanInput;
      const regMatch = registro === cleanInput;
      const numMatch = idNumber && idNumber === cleanInput;
      const phoneMatch = d.telefone.replace(/\D/g, '').includes(cleanInput.replace(/\D/g, ''));
      const nameMatch = d.nome.toLowerCase().includes(cleanInput);

      return regMatch || idMatch || numMatch || phoneMatch || nameMatch;
    });

    if (!matchedDriver) {
      setDriverError(`Número de registro "${driverRegisterInput}" não encontrado. Verifique com a administração.`);
      return;
    }

    const expectedPassword = matchedDriver.senha || '123';
    if (driverPasswordInput.trim() !== expectedPassword.trim()) {
      setDriverError(`Senha incorreta para o entregador ${matchedDriver.nome}. Verifique sua senha.`);
      return;
    }

    setDriverError(null);
    setShowDriverModal(false);
    setDriverPasswordInput('');
    onSelectProfile({
      perfil: 'motoboy',
      driverId: matchedDriver.id,
      driverName: matchedDriver.nome,
      driverRegistro: matchedDriver.codigoRegistro || matchedDriver.id.replace('drv-', ''),
    }, 'delivery');
  };

  // Manipulador de login da Cozinha por senha
  const handleKitchenLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPassword = config.senhaCozinha || '1234';

    if (kitchenPasswordInput.trim() !== expectedPassword.trim()) {
      setKitchenError('Senha da cozinha incorreta. Solicite a senha correta à gerência.');
      return;
    }

    setKitchenError(null);
    setShowKitchenModal(false);
    setKitchenPasswordInput('');
    onSelectProfile({ perfil: 'cozinha', nome: 'Equipe da Cozinha' }, 'kitchen');
  };

  // Manipulador de login com Google OAuth para o Administrador
  const handleGoogleAdminLogin = async () => {
    setAdminLoading(true);
    setAdminError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      onSelectProfile({
        perfil: 'admin',
        adminEmail: user.email || 'admin@pasteldeouro.com.br',
        nome: user.displayName || 'Administrador',
      }, 'kanban');
    } catch (err: any) {
      console.warn('[Google OAuth] Erro ou popup fechado:', err?.message);
      // Se popup estiver bloqueado no iframe, orienta o usuário e oferece acesso direto
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        setAdminError('O navegador bloqueou a janela pop-up do Google. Você pode liberar pop-ups ou clicar em "Entrar Direto como Administrador" abaixo para testar.');
      } else {
        setAdminError(`Tentativa com Google: ${err?.message || 'Login cancelado'}. Use o botão de acesso direto para continuar.`);
      }
    } finally {
      setAdminLoading(false);
    }
  };

  // Entrada direta administrativa (garante acesso mesmo se o Google OAuth for bloqueado pelo iframe da pré-visualização)
  const handleBypassAdminLogin = () => {
    onSelectProfile({
      perfil: 'admin',
      adminEmail: 'admin@pasteldeouro.com.br',
      nome: 'Administrador Master',
    }, 'kanban');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-between text-stone-900 font-sans">
      
      {/* ========================================================= */}
      {/* 1. SEÇÃO PRINCIPAL (PRIMEIRA DOBRA - PARA O CLIENTE) */}
      {/* ========================================================= */}
      <section className="min-h-screen flex flex-col justify-between p-4 sm:p-8 max-w-4xl mx-auto w-full">
        
        {/* Topo do Portal */}
        <header className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Pastelaria Aberta • Fritura na Hora</span>
          </div>

          <div className="text-xs text-stone-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{config.horarioFuncionamento}</span>
          </div>
        </header>

        {/* Bloco Central do Cliente */}
        <div className="my-auto py-8 text-center flex flex-col items-center">
          
          {/* Foto / Logotipo da Pastelaria */}
          <div className="relative mb-6">
            <img
              src={config.logotipoUrl}
              alt={config.nome}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover shadow-2xl border-4 border-white ring-4 ring-amber-400/30"
            />
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-stone-950 p-2 rounded-2xl shadow-lg font-black text-xl">
              🥟
            </div>
          </div>

          {/* Nome e Apresentação */}
          <h1 className="text-3xl sm:text-5xl font-black text-stone-950 tracking-tight max-w-xl">
            {config.nome}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-stone-600 max-w-lg leading-relaxed">
            Massa sequinha, crocante e com recheio farto! Escolha seus pastéis favoritos e receba quentinho na sua casa.
          </p>

          {/* ========================================================= */}
          {/* BOTÃO PRINCIPAL GIGANTE: LEVA DIRETO AO CARDÁPIO */}
          {/* ========================================================= */}
          <div className="mt-8 w-full max-w-md space-y-3">
            <button
              id="btn-portal-cardapio"
              type="button"
              onClick={() => onSelectProfile({ perfil: 'cliente' }, 'menu')}
              className="w-full group bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-lg sm:text-xl py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-3 border-2 border-amber-300"
            >
              <ShoppingBag className="w-7 h-7 group-hover:scale-110 transition-transform text-stone-950" />
              <span>FAZER PEDIDO / VER CARDÁPIO</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Botão Secundário do Cliente: Rastrear Pedido */}
            <button
              type="button"
              onClick={() => onSelectProfile({ perfil: 'cliente' }, 'tracker')}
              className="w-full bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm py-3.5 px-6 rounded-xl border border-stone-300 shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Já tem um pedido em andamento? Rastrear Entrega</span>
            </button>
          </div>

          {/* Informações de Localização e Entrega */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="text-amber-600 font-bold">📍</span> {config.enderecoCompleto}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">🛵</span> Entrega média em {config.tempoEntregaPadraoMin} min
            </span>
          </div>
        </div>

        {/* Indicador de rolagem para acesso da equipe */}
        <div className="text-center pb-4 pt-6">
          <a
            href="#area-equipe"
            className="inline-flex flex-col items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors animate-bounce"
          >
            <span>Acesso da equipe (Motoboy & Administração)</span>
            <ChevronDown className="w-5 h-5 text-amber-600" />
          </a>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SEÇÃO INFERIOR (ROLAGEM - ÁREA RESTRITA DA EQUIPE) */}
      {/* ========================================================= */}
      <section id="area-equipe" className="bg-stone-900 text-stone-100 py-16 px-4 sm:px-8 border-t border-stone-800">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-stone-800 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 border border-stone-700">
              <Lock className="w-3.5 h-3.5" />
              <span>Área de Acesso Restrito</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Acesso de Colaboradores & Operação
            </h2>
            <p className="text-sm text-stone-400 mt-1 max-w-md mx-auto">
              Selecione o seu perfil de trabalho abaixo para acessar as ferramentas do seu turno.
            </p>
          </div>

          {/* Grid de Botões de Acesso da Equipe */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. MOTOBOY / ENTREGADOR */}
            <div className="bg-stone-800/90 border border-stone-700 hover:border-amber-500/60 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <Bike className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">Área do Motoboy</h3>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  Acesse com o seu número de registro fornecido pela gerência para ver apenas as suas entregas e rotas no GPS.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDriverError(null);
                  setShowDriverModal(true);
                }}
                className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Entrar como Motoboy</span>
              </button>
            </div>

            {/* 2. ADMINISTRAÇÃO (LOGIN COM GOOGLE) */}
            <div className="bg-stone-800/90 border border-stone-700 hover:border-blue-500/60 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">Painel do Administrador</h3>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  Controle total sobre cardápio, caixa financeiro, kanban de pedidos, taxas de entrega e equipe.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAdminError(null);
                  setShowAdminModal(true);
                }}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-sm py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Entrar na Administração</span>
              </button>
            </div>

            {/* 3. COZINHA (KDS) */}
            <div className="bg-stone-800/90 border border-stone-700 hover:border-orange-500/60 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
                  <ChefHat className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">Cozinha (KDS)</h3>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  Monitor para fritura e montagem de pastéis com contagem regressiva por pedido e alerta sonoro.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setKitchenError(null);
                  setKitchenPasswordInput('');
                  setShowKitchenModal(true);
                }}
                className="mt-6 w-full bg-stone-700 hover:bg-stone-600 text-amber-300 font-black text-sm py-3 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                <span>Acessar Monitor KDS</span>
              </button>
            </div>

          </div>

          <div className="mt-12 text-center text-xs text-stone-500 border-t border-stone-800 pt-6">
            © {new Date().getFullYear()} {config.nome} • Sistema de Gestão e Delivery
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MODAL: LOGIN DO MOTOBOY POR NÚMERO DE REGISTRO E SENHA */}
      {/* ========================================================= */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 text-white border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-stone-950 rounded-xl">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Acesso do Entregador</h3>
                  <p className="text-xs text-stone-400">Informe seu número de registro e sua senha</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="text-stone-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDriverLogin} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  Número de Registro / ID do Motoboy
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={driverRegisterInput}
                  onChange={(e) => setDriverRegisterInput(e.target.value)}
                  placeholder="Ex: 1, 2, drv-1"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white font-mono text-base focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Senha de Acesso Pessoal
                </label>
                <input
                  type="password"
                  required
                  value={driverPasswordInput}
                  onChange={(e) => setDriverPasswordInput(e.target.value)}
                  placeholder="Digite sua senha cadastrada"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {driverError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{driverError}</span>
                </div>
              )}

              {/* Dica amigável dos motoboys cadastrados */}
              <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700/60 text-[11px] text-stone-400 space-y-1">
                <span className="font-bold text-amber-400 block">💡 Entregadores de teste disponíveis:</span>
                {drivers.map(d => (
                  <div key={d.id} className="flex justify-between items-center text-stone-300">
                    <span>• {d.nome}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDriverRegisterInput(d.codigoRegistro || d.id.replace('drv-', ''));
                        setDriverPasswordInput(d.senha || '123');
                      }}
                      className="text-amber-400 hover:underline font-mono text-[10px]"
                    >
                      Reg: <strong>{d.codigoRegistro || d.id.replace('drv-', '')}</strong> (Senha: {d.senha || '123'})
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-3 rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Entrar no Turno</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LOGIN DA COZINHA COM SENHA */}
      {/* ========================================================= */}
      {showKitchenModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 text-white border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500 text-white rounded-xl">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Acesso à Cozinha (KDS)</h3>
                  <p className="text-xs text-stone-400">Insira a senha do módulo de fritura</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKitchenModal(false)}
                className="text-stone-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleKitchenLogin} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                  Senha de Acesso da Cozinha
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={kitchenPasswordInput}
                  onChange={(e) => setKitchenPasswordInput(e.target.value)}
                  placeholder="Digite a senha da equipe"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              {kitchenError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{kitchenError}</span>
                </div>
              )}

              <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-700/60 text-[11px] text-stone-400 flex items-center justify-between">
                <span>Senha padrão: <strong>{config.senhaCozinha || '1234'}</strong></span>
                <button
                  type="button"
                  onClick={() => setKitchenPasswordInput(config.senhaCozinha || '1234')}
                  className="text-orange-400 hover:underline font-bold"
                >
                  Preencher
                </button>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowKitchenModal(false)}
                  className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-3 rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-400 text-stone-950 font-black py-3 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Acessar Monitor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LOGIN DO ADMINISTRADOR (GOOGLE OAUTH) */}
      {/* ========================================================= */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 text-white border border-stone-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Login Administrativo</h3>
                  <p className="text-xs text-stone-400">Acesso via conta Google (OAuth)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="text-stone-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-xs text-stone-300 leading-relaxed">
                O acesso à gerência da pastelaria utiliza autenticação segura do Google. Clique no botão abaixo para escolher seu e-mail e autenticar.
              </p>

              {/* Botão Oficial do Google */}
              <button
                type="button"
                onClick={handleGoogleAdminLogin}
                disabled={adminLoading}
                className="w-full bg-white hover:bg-stone-100 text-stone-800 font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-3 border border-stone-300 disabled:opacity-50"
              >
                {adminLoading ? (
                  <span className="text-xs font-bold text-stone-600 animate-pulse">Conectando com o Google...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="text-sm">Continuar com o Google</span>
                  </>
                )}
              </button>

              {adminError && (
                <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200">
                  {adminError}
                </div>
              )}

              {/* Botão de Contingência Direta (Caso popups estejam bloqueados no ambiente de teste) */}
              <div className="border-t border-stone-800 pt-3">
                <button
                  type="button"
                  onClick={handleBypassAdminLogin}
                  className="w-full text-center text-xs text-stone-400 hover:text-amber-400 font-semibold py-2 transition-colors"
                >
                  ⚡ Entrar direto como Administrador (Modo Desenvolvimento)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
