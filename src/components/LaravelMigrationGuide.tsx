import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Terminal, 
  FileCode, 
  Copy, 
  Check, 
  HelpCircle, 
  FolderTree, 
  CheckCircle2, 
  AlertTriangle,
  Shield,
  MessageSquare,
  BarChart3
} from 'lucide-react';

export const LaravelMigrationGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'rbac' | 'whatsapp' | 'reports' | 'commands'>('tables');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const copyToClipboard = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(key);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  // 1. Script SQL com Índices de Alta Performance
  const sqlCode = `-- ==========================================================
-- SCRIPT SQL OTIMIZADO PARA MYSQL 8 / MARIADB NO UBUNTU
-- Inclui Índices Compostos para Relatórios Financeiros Ultra Rápidos
-- ==========================================================

CREATE DATABASE IF NOT EXISTS pastelaria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pastelaria_db;

-- 1. TABELA DE CONFIGURAÇÕES GERAIS
CREATE TABLE IF NOT EXISTS store_configs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj_cpf VARCHAR(30) NULL,
    telefone_contato VARCHAR(30) NULL,
    whatsapp_oficial VARCHAR(30) NOT NULL,
    logotipo_url VARCHAR(255) NULL,
    endereco_completo VARCHAR(255) NULL,
    horario_funcionamento VARCHAR(150) NULL,
    chave_pix VARCHAR(150) NOT NULL,
    tipo_chave_pix ENUM('cpf', 'cnpj', 'email', 'telefone', 'aleatoria') DEFAULT 'email',
    nome_titular_pix VARCHAR(150) NULL,
    mensagem_whatsapp_padrao TEXT NOT NULL,
    pedido_minimo DECIMAL(10,2) DEFAULT 0.00,
    tempo_retirada_min INT DEFAULT 25,
    tempo_entrega_padrao_min INT DEFAULT 45,
    permite_retirada BOOLEAN DEFAULT TRUE,
    permite_entrega BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 2. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ordem INT DEFAULT 1,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_categories_ativo (ativo, ordem)
);

-- 3. TABELA DE PRODUTOS / PASTÉIS
CREATE TABLE IF NOT EXISTS products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    preco DECIMAL(10,2) NOT NULL,
    imagem_url VARCHAR(255) NULL,
    ativo BOOLEAN DEFAULT TRUE,
    destaque BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_products_category_ativo (category_id, ativo)
);

-- 4. TABELA DE ADICIONAIS & BORDAS
CREATE TABLE IF NOT EXISTS product_extras (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    disponivel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 5. TABELA DE BAIRROS E TAXAS DE ENTREGA
CREATE TABLE IF NOT EXISTS delivery_zones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bairro VARCHAR(150) NOT NULL,
    taxa DECIMAL(10,2) NOT NULL,
    tempo_estimado_min INT DEFAULT 40,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 6. TABELA DE USUÁRIOS E PERMISSÕES (RBAC)
CREATE TABLE IF NOT EXISTS app_users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefone VARCHAR(30) NULL,
    cargo ENUM('admin', 'caixa', 'cozinha', 'entregador', 'cliente') DEFAULT 'caixa',
    permissoes_json JSON NULL,
    ativo BOOLEAN DEFAULT TRUE,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_users_cargo (cargo, ativo)
);

-- 7. TABELA DE PEDIDOS COM ÍNDICES COMPOSTOS PARA RELATÓRIOS
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero_sequencial INT NOT NULL,
    cliente_nome VARCHAR(150) NOT NULL,
    cliente_telefone VARCHAR(30) NOT NULL,
    tipo_entrega ENUM('delivery', 'retirada') DEFAULT 'delivery',
    logradouro VARCHAR(150) NULL,
    numero VARCHAR(30) NULL,
    bairro VARCHAR(100) NULL,
    complemento VARCHAR(100) NULL,
    cidade VARCHAR(100) DEFAULT 'São Paulo',
    subtotal DECIMAL(10,2) NOT NULL,
    taxa_entrega DECIMAL(10,2) DEFAULT 0.00,
    desconto DECIMAL(10,2) DEFAULT 0.00,
    valor_total DECIMAL(10,2) NOT NULL,
    forma_pagamento ENUM('pix', 'cartao_credito', 'cartao_debito', 'dinheiro') NOT NULL,
    status_pagamento ENUM('pendente', 'pago', 'na_entrega') DEFAULT 'pendente',
    troco_para DECIMAL(10,2) NULL,
    status ENUM('novo', 'preparando', 'pronto', 'em_entrega', 'entregue', 'cancelado') DEFAULT 'novo',
    observacoes_gerais TEXT NULL,
    entregador_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (entregador_id) REFERENCES app_users(id) ON DELETE SET NULL,
    -- ÍNDICES DE ALTA PERFORMANCE PARA RELATÓRIOS ANALÍTICOS:
    INDEX idx_orders_created_status (created_at, status),
    INDEX idx_orders_pagamento_created (forma_pagamento, created_at),
    INDEX idx_orders_cliente_telefone (cliente_telefone)
);

-- 8. ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    nome_produto VARCHAR(150) NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    observacao VARCHAR(255) NULL,
    adicionais_json JSON NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_items_product (product_id, created_at)
);

-- 9. TRANSAÇÕES FINANCEIRAS
CREATE TABLE IF NOT EXISTS financial_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('entrada', 'saida') NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    forma_pagamento ENUM('pix', 'cartao_credito', 'cartao_debito', 'dinheiro') NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_finances_data_tipo (data, tipo)
);`;

  // 2. Middleware de RBAC no Laravel
  const rbacMiddlewareCode = `<?php

namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use Symfony\\Component\\HttpFoundation\\Response;

/**
 * ONDE COLOCAR NO SERVIDOR:
 * /var/www/pastelaria-api/app/Http/Middleware/CheckRole.php
 * 
 * O QUE ELE FAZ:
 * Bloqueia usuários sem permissão de acessar telas ou rotas restritas.
 * Exemplo: Cozinha não pode ver faturamento; Entregador só vê entregas.
 */
class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        // 1. Se não estiver logado, bloqueia
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Acesso não autorizado. Faça login primeiro.'
            ], 401);
        }

        // 2. Administrador tem acesso total a tudo
        if ($user->cargo === 'admin') {
            return $next($request);
        }

        // 3. Verifica se o cargo do usuário está na lista permitida da rota
        if (in_array($user->cargo, $roles)) {
            return $next($request);
        }

        // 4. Bloqueado por falta de permissão
        return response()->json([
            'status' => 'error',
            'message' => 'Seu cargo (' . $user->cargo . ') não tem permissão para acessar esta área.'
        ], 403);
    }
}
`;

  // 3. Controller de Autenticação (Login e Tokens Sanctum)
  const authControllerCode = `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Hash;
use App\\Models\\AppUser;

/**
 * ONDE COLOCAR NO SERVIDOR:
 * /var/www/pastelaria-api/app/Http/Controllers/Api/AuthController.php
 */
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = AppUser::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'E-mail ou senha incorretos.'
            ], 401);
        }

        if (!$user->ativo) {
            return response()->json([
                'status' => 'error',
                'message' => 'Usuário inativo. Fale com a gerência.'
            ], 403);
        }

        // Cria token de acesso Bearer (Laravel Sanctum)
        $token = $user->createToken('pastelaria-token', [$user->cargo])->plainTextToken;

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'nome' => $user->nome,
                'email' => $user->email,
                'cargo' => $user->cargo,
                'permissoes' => $user->permissoes_json,
            ],
            'token' => $token
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout efetuado com sucesso.']);
    }
}
`;

  // 4. Serviço do WhatsApp Business (Meta Cloud API)
  const whatsappServiceCode = `<?php

namespace App\\Services;

use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Log;

/**
 * ONDE COLOCAR NO SERVIDOR:
 * /var/www/pastelaria-api/app/Services/WhatsAppService.php
 * 
 * O QUE ELE FAZ:
 * Envia mensagens automáticas pelo WhatsApp oficial da Meta (Facebook).
 */
class WhatsAppService
{
    protected string $token;
    protected string $phoneNumberId;
    protected string $apiUrl;

    public function __construct()
    {
        $this->token = config('services.whatsapp.token');
        $this->phoneNumberId = config('services.whatsapp.phone_number_id');
        $this->apiUrl = "https://graph.facebook.com/v20.0/{$this->phoneNumberId}/messages";
    }

    /**
     * Envia notificação de mudança de status do pedido (Templates de Utilidade)
     */
    public function sendOrderStatusNotification(string $recipientPhone, string $customerName, string $orderNumber, string $status, ?string $trackingUrl = null)
    {
        // Limpa o telefone para formato DDI + DDD + Número (ex: 5511987654321)
        $cleanPhone = preg_replace('/\\D/', '', $recipientPhone);
        if (strlen($cleanPhone) <= 11) {
            $cleanPhone = '55' . $cleanPhone;
        }

        $statusText = match($status) {
            'novo' => 'recebido com sucesso e já está na fila',
            'preparando' => 'sendo frito com carinho na cozinha',
            'pronto' => 'prontinho e quentinho embalado',
            'em_entrega' => 'saiu para entrega com o nosso motoboy',
            'entregue' => 'entregue! Bom apetite!',
            default => 'atualizado'
        };

        // Envia mensagem direta de texto
        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $cleanPhone,
            'type' => 'text',
            'text' => [
                'preview_url' => true,
                'body' => "🥟 *Pastel de Ouro - Atualização do Pedido #{$orderNumber}*\n\nOlá, *{$customerName}*!\nSeu pedido está {$statusText}." . 
                          ($trackingUrl ? "\n\n🛵 Acompanhe a rota: {$trackingUrl}" : "") . 
                          "\n\nDúvidas? É só responder a esta mensagem!"
            ]
        ];

        try {
            $response = Http::withToken($this->token)
                ->post($this->apiUrl, $payload);

            if ($response->failed()) {
                Log::error('Erro ao enviar WhatsApp:', $response->json());
                return false;
            }

            return $response->json();
        } catch (\\Exception $e) {
            Log::error('Exceção WhatsApp: ' . $e->getMessage());
            return false;
        }
    }
}
`;

  // 5. Controller do Webhook da Meta
  const whatsappWebhookCode = `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Log;
use App\\Models\\Order;

/**
 * ONDE COLOCAR NO SERVIDOR:
 * /var/www/pastelaria-api/app/Http/Controllers/Api/WhatsAppWebhookController.php
 * 
 * O QUE ELE FAZ:
 * Recebe mensagens e confirmações de entrega do WhatsApp dos clientes.
 */
class WhatsAppWebhookController extends Controller
{
    /**
     * Validação inicial exigida pela Meta (GET)
     */
    public function verify(Request $request)
    {
        $verifyToken = config('services.whatsapp.verify_token', 'pastelaria_secreta_2026');

        $hubMode = $request->query('hub_mode');
        $hubVerifyToken = $request->query('hub_verify_token');
        $hubChallenge = $request->query('hub_challenge');

        if ($hubMode === 'subscribe' && $hubVerifyToken === $verifyToken) {
            return response($hubChallenge, 200);
        }

        return response('Token inválido', 403);
    }

    /**
     * Recebimento de mensagens enviadas pelos clientes (POST)
     */
    public function handle(Request $request)
    {
        $payload = $request->all();
        Log::info('Webhook WhatsApp recebido:', $payload);

        // Processa mensagens de resposta rápida ou texto do cliente
        if (isset($payload['entry'][0]['changes'][0]['value']['messages'][0])) {
            $msg = $payload['entry'][0]['changes'][0]['value']['messages'][0];
            $from = $msg['from']; // Telefone do cliente
            $text = $msg['text']['body'] ?? '';

            // Aqui você pode automatizar comandos como: "1" para confirmar, "status", etc.
        }

        return response()->json(['status' => 'EVENT_RECEIVED'], 200);
    }
}
`;

  // 6. Controller de Relatórios Financeiros Avançados com SQL nativo
  const financialReportControllerCode = `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;

/**
 * ONDE COLOCAR NO SERVIDOR:
 * /var/www/pastelaria-api/app/Http/Controllers/Api/FinancialReportController.php
 * 
 * O QUE ELE FAZ:
 * Executa consultas SQL ultra otimizadas com índices compostos para alimentar
 * os gráficos e dashboards analíticos em milissegundos.
 */
class FinancialReportController extends Controller
{
    public function getAnalytics(Request $request)
    {
        $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $channel = $request->query('channel'); // delivery, retirada ou null
        $payment = $request->query('payment'); // pix, cartao, etc.

        // 1. Resumo Executivo (KPIs)
        $kpiQuery = DB::table('orders')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status', '!=', 'cancelado');

        if ($channel) $kpiQuery->where('tipo_entrega', $channel);
        if ($payment) $kpiQuery->where('forma_pagamento', $payment);

        $kpis = $kpiQuery->selectRaw('
            COALESCE(SUM(valor_total), 0) as faturamento_bruto,
            COUNT(id) as total_pedidos,
            COALESCE(AVG(valor_total), 0) as ticket_medio
        ')->first();

        // 2. Vendas Diárias (Gráfico de Linha/Área)
        $dailySales = DB::table('orders')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status', '!=', 'cancelado')
            ->selectRaw('
                DATE(created_at) as data,
                SUM(valor_total) as faturamento,
                COUNT(id) as total_pedidos
            ')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('data', 'ASC')
            ->get();

        // 3. Faturamento por Forma de Pagamento (Gráfico Donut)
        $paymentBreakdown = DB::table('orders')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status', '!=', 'cancelado')
            ->selectRaw('
                forma_pagamento,
                SUM(valor_total) as total,
                COUNT(id) as qtd
            ')
            ->groupBy('forma_pagamento')
            ->get();

        // 4. Top 5 Pastéis Mais Vendidos (Curva ABC)
        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('orders.status', '!=', 'cancelado')
            ->selectRaw('
                order_items.nome_produto,
                SUM(order_items.quantidade) as total_unidades,
                SUM(order_items.subtotal) as total_faturado
            ')
            ->groupBy('order_items.nome_produto')
            ->orderByDesc('total_unidades')
            ->limit(5)
            ->get();

        // 5. Total de Despesas no Período
        $expenses = DB::table('financial_transactions')
            ->whereBetween('data', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('tipo', 'saida')
            ->selectRaw('
                categoria,
                SUM(valor) as total
            ')
            ->groupBy('categoria')
            ->get();

        $totalDespesas = $expenses->sum('total');
        $lucroLiquido = $kpis->faturamento_bruto - $totalDespesas;

        return response()->json([
            'status' => 'success',
            'kpis' => [
                'faturamento_bruto' => (float)$kpis->faturamento_bruto,
                'total_pedidos' => (int)$kpis->total_pedidos,
                'ticket_medio' => round((float)$kpis->ticket_medio, 2),
                'total_despesas' => (float)$totalDespesas,
                'lucro_liquido' => (float)$lucroLiquido,
            ],
            'daily_sales' => $dailySales,
            'payment_breakdown' => $paymentBreakdown,
            'top_products' => $topProducts,
            'expenses' => $expenses,
        ]);
    }
}
`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="bg-amber-900 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 text-amber-950 rounded-xl">
            <Server className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Central de Migração: Laravel, MySQL & WhatsApp Oficial
            </h1>
            <p className="text-amber-200 text-sm mt-1 leading-relaxed">
              Aqui estão todos os arquivos de backend prontos para você copiar e colar no seu servidor Ubuntu na Oracle Cloud.
              Cada aba traz o código completo e o caminho exato da pasta onde você deve salvá-lo.
            </p>
          </div>
        </div>
      </div>

      {/* Navegação entre Abas Técnicas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('tables')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'tables' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>1. Banco MySQL Otimizado</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'rbac' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>2. Controle de Acesso (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'whatsapp' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>3. WhatsApp Oficial (Meta API)</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'reports' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>4. Relatórios Financeiros (SQL)</span>
        </button>

        <button
          onClick={() => setActiveTab('commands')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'commands' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>5. Comandos Terminal Ubuntu</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Banco de Dados MySQL */}
      {activeTab === 'tables' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                Arquivo SQL Completo
              </span>
              <h3 className="text-base font-bold text-stone-900 mt-1">
                database/schema.sql (com Índices Compostos para Relatórios)
              </h3>
              <p className="text-xs text-stone-500">
                Execute este arquivo no terminal ou cole no <strong>phpMyAdmin</strong> do seu servidor.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard('sql', sqlCode)}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0"
            >
              {copiedFile === 'sql' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedFile === 'sql' ? 'SQL Copiado!' : 'Copiar Script SQL'}
            </button>
          </div>

          <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96">
            {sqlCode}
          </pre>
        </div>
      )}

      {/* Conteúdo da Aba 2: RBAC */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                  Middleware de Segurança
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  app/Http/Middleware/CheckRole.php
                </h3>
                <p className="text-xs text-stone-500">
                  Coloque este arquivo em: <strong>/var/www/pastelaria-api/app/Http/Middleware/CheckRole.php</strong>
                </p>
              </div>
              <button
                onClick={() => copyToClipboard('rbac_mw', rbacMiddlewareCode)}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0"
              >
                {copiedFile === 'rbac_mw' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedFile === 'rbac_mw' ? 'Copiado!' : 'Copiar CheckRole.php'}
              </button>
            </div>
            <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72">
              {rbacMiddlewareCode}
            </pre>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                  Controller de Login & Tokens
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  app/Http/Controllers/Api/AuthController.php
                </h3>
                <p className="text-xs text-stone-500">
                  Coloque em: <strong>/var/www/pastelaria-api/app/Http/Controllers/Api/AuthController.php</strong>
                </p>
              </div>
              <button
                onClick={() => copyToClipboard('auth_ctrl', authControllerCode)}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0"
              >
                {copiedFile === 'auth_ctrl' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedFile === 'auth_ctrl' ? 'Copiado!' : 'Copiar AuthController.php'}
              </button>
            </div>
            <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72">
              {authControllerCode}
            </pre>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 3: WhatsApp Oficial */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                  Serviço de Disparo Automático (Meta Cloud API)
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  app/Services/WhatsAppService.php
                </h3>
                <p className="text-xs text-stone-500">
                  Coloque em: <strong>/var/www/pastelaria-api/app/Services/WhatsAppService.php</strong>
                </p>
              </div>
              <button
                onClick={() => copyToClipboard('wa_service', whatsappServiceCode)}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0"
              >
                {copiedFile === 'wa_service' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedFile === 'wa_service' ? 'Copiado!' : 'Copiar WhatsAppService.php'}
              </button>
            </div>
            <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72">
              {whatsappServiceCode}
            </pre>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                  Webhook para Recebimento de Mensagens
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  app/Http/Controllers/Api/WhatsAppWebhookController.php
                </h3>
                <p className="text-xs text-stone-500">
                  Coloque em: <strong>/var/www/pastelaria-api/app/Http/Controllers/Api/WhatsAppWebhookController.php</strong>
                </p>
              </div>
              <button
                onClick={() => copyToClipboard('wa_webhook', whatsappWebhookCode)}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0"
              >
                {copiedFile === 'wa_webhook' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedFile === 'wa_webhook' ? 'Copiado!' : 'Copiar WebhookController.php'}
              </button>
            </div>
            <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72">
              {whatsappWebhookCode}
            </pre>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Relatórios Financeiros Backend */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-md">
                Controller de Relatórios com SQL Otimizado
              </span>
              <h3 className="text-base font-bold text-stone-900 mt-1">
                app/Http/Controllers/Api/FinancialReportController.php
              </h3>
              <p className="text-xs text-stone-500">
                Coloque em: <strong>/var/www/pastelaria-api/app/Http/Controllers/Api/FinancialReportController.php</strong>
              </p>
            </div>
            <button
              onClick={() => copyToClipboard('report_ctrl', financialReportControllerCode)}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0"
            >
              {copiedFile === 'report_ctrl' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedFile === 'report_ctrl' ? 'Copiado!' : 'Copiar Controller'}
            </button>
          </div>
          <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96">
            {financialReportControllerCode}
          </pre>
        </div>
      )}

      {/* Conteúdo da Aba 5: Comandos de Terminal */}
      {activeTab === 'commands' && (
        <div className="bg-stone-950 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
            <Terminal className="w-5 h-5" />
            Comandos no Terminal Preto (SSH) do Servidor Ubuntu
          </div>

          <div className="space-y-3 text-xs font-mono text-stone-300">
            <div className="p-3 bg-stone-900 rounded-lg border border-stone-800">
              <span className="text-stone-500"># 1. Entrar na pasta da API:</span><br />
              <span className="text-emerald-400">cd /var/www/pastelaria-api</span>
            </div>

            <div className="p-3 bg-stone-900 rounded-lg border border-stone-800">
              <span className="text-stone-500"># 2. Criar o banco e importar todas as tabelas e índices:</span><br />
              <span className="text-emerald-400">mysql -u pastel_user -p pastelaria_db &lt; database/schema.sql</span>
            </div>

            <div className="p-3 bg-stone-900 rounded-lg border border-stone-800">
              <span className="text-stone-500"># 3. Limpar e otimizar cache de rotas e configurações do Laravel:</span><br />
              <span className="text-emerald-400">php artisan config:cache && php artisan route:cache</span>
            </div>

            <div className="p-3 bg-stone-900 rounded-lg border border-stone-800">
              <span className="text-stone-500"># 4. Ajustar permissões para o servidor web (Nginx) poder salvar fotos e logs:</span><br />
              <span className="text-emerald-400">sudo chown -R www-data:www-data storage bootstrap/cache</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
