# 🥟 Guia Completo de Migração: Pastelaria Gestão para Laravel & MySQL

Este arquivo foi preparado especialmente para você que tem pouca experiência com **Laravel** e **MySQL**, explicando exatamente o que é cada coisa e o que fazer no seu servidor Ubuntu (Oracle Cloud) quando chegar a hora da migração definitiva.

---

## 📌 O que fazer com este arquivo?
Guarde este arquivo como o seu **manual de bordo**. Você não precisa executar nada dele agora enquanto estiver validando o protótipo no Google AI Studio. Quando você for subir o sistema no servidor da empresa, basta seguir o passo a passo abaixo linha por linha.

---

## 1. Estrutura do Banco de Dados MySQL

No MySQL, criamos as tabelas para substituir os dados do sistema. No seu servidor, você só precisará copiar o comando SQL abaixo e colar dentro do seu banco de dados MySQL ou no phpMyAdmin:

```sql
-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS pastelaria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pastelaria_db;

-- 1. Tabela de Categorias
CREATE TABLE categorias (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    ordem INT DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 2. Tabela de Produtos (Pastéis, Bebidas, Sobremesas)
CREATE TABLE produtos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    categoria_id BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    imagem_url TEXT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    destaque BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

-- 3. Tabela de Adicionais / Extras (Bacon, Catupiry, etc.)
CREATE TABLE adicionais (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 4. Tabela de Regiões / Bairros de Entrega
CREATE TABLE taxas_entrega (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bairro VARCHAR(100) NOT NULL,
    taxa DECIMAL(10, 2) NOT NULL,
    tempo_estimado_min INT DEFAULT 45,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 5. Tabela de Motoboys / Entregadores
CREATE TABLE entregadores (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    veiculo VARCHAR(100) NOT NULL,
    placa VARCHAR(20) NULL,
    chave_pix VARCHAR(150) NULL,
    tipo_chave_pix ENUM('cpf', 'telefone', 'email', 'aleatoria') DEFAULT 'telefone',
    taxa_entrega_fixa DECIMAL(10, 2) DEFAULT 6.00,
    em_servico BOOLEAN DEFAULT TRUE,
    ativo BOOLEAN DEFAULT TRUE,
    observacoes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 6. Tabela de Pedidos
CREATE TABLE pedidos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero_sequencial INT UNSIGNED NOT NULL,
    cliente_nome VARCHAR(150) NOT NULL,
    cliente_telefone VARCHAR(30) NOT NULL,
    tipo_entrega ENUM('delivery', 'balcao') NOT NULL DEFAULT 'delivery',
    status ENUM('novo', 'preparando', 'pronto', 'em_entrega', 'entregue', 'cancelado') DEFAULT 'novo',
    forma_pagamento ENUM('pix', 'cartao_credito', 'cartao_debito', 'dinheiro') NOT NULL,
    status_pagamento ENUM('pendente', 'a_pagar_entrega', 'pago') DEFAULT 'pendente',
    troco_para DECIMAL(10, 2) NULL,
    troco_devolver DECIMAL(10, 2) NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    taxa_entrega DECIMAL(10, 2) DEFAULT 0.00,
    valor_total DECIMAL(10, 2) NOT NULL,
    entregador_id BIGINT UNSIGNED NULL,
    observacoes_gerais TEXT NULL,
    endereco_logradouro VARCHAR(200) NULL,
    endereco_numero VARCHAR(50) NULL,
    endereco_bairro VARCHAR(100) NULL,
    endereco_complemento VARCHAR(100) NULL,
    endereco_referencia VARCHAR(200) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (entregador_id) REFERENCES entregadores(id) ON DELETE SET NULL
);

-- 7. Itens do Pedido
CREATE TABLE pedido_itens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED NOT NULL,
    produto_id BIGINT UNSIGNED NOT NULL,
    nome_produto VARCHAR(150) NOT NULL,
    quantidade INT UNSIGNED NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    observacao VARCHAR(255) NULL,
    adicionais_json JSON NULL,
    created_at TIMESTAMP NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- 8. Tabela do Caixa / Transações Financeiras
CREATE TABLE transacoes_financeiras (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('entrada', 'saida') NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    pedido_id BIGINT UNSIGNED NULL,
    data_transacao DATETIME NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL
);
```

---

## 2. Passo a Passo para Instalar no Servidor Ubuntu (Oracle Cloud)

Quando você for instalar no seu servidor, você abrirá o terminal SSH e executará estes comandos um por um:

### Passo A: Instalar PHP 8.2+, Composer, Nginx e MySQL
```bash
# 1. Atualizar o sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Nginx, MySQL e dependências do PHP
sudo apt install -y nginx mysql-server git unzip curl
sudo apt install -y php8.2-fpm php8.2-cli php8.2-mysql php8.2-curl php8.2-xml php8.2-mbstring php8.2-zip php8.2-intl

# 3. Instalar Composer (gerenciador de pacotes do PHP)
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### Passo B: Baixar e Configurar o Laravel
```bash
# 1. Entrar na pasta web do servidor
cd /var/www

# 2. Criar um novo projeto Laravel
composer create-project laravel/laravel pastelaria-api

# 3. Dar permissão de escrita para o Nginx
sudo chown -R www-data:www-data /var/www/pastelaria-api/storage /var/www/pastelaria-api/bootstrap/cache
sudo chmod -R 775 /var/www/pastelaria-api/storage /var/www/pastelaria-api/bootstrap/cache

# 4. Entrar na pasta do projeto
cd /var/www/pastelaria-api

# 5. Configurar o arquivo .env com o banco de dados
nano .env
```
Dentro do arquivo `.env`, altere:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pastelaria_db
DB_USERNAME=root
DB_PASSWORD=sua_senha_do_mysql
```

---

## 3. As Principais Rotas da API em Laravel (`routes/api.php`)

Dentro do Laravel, o arquivo `routes/api.php` é quem recebe os pedidos enviados pelo React:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\CardapioController;
use App\Http\Controllers\EntregadorController;
use App\Http\Controllers\FinanceiroController;

// Rotas do Cardápio Público
Route::get('/cardapio', [CardapioController::class, 'index']);

// Rotas de Pedidos (Kanban & WhatsApp)
Route::get('/pedidos', [PedidoController::class, 'index']);
Route::post('/pedidos', [PedidoController::class, 'store']);
Route::patch('/pedidos/{id}/status', [PedidoController::class, 'updateStatus']);
Route::patch('/pedidos/{id}/atribuir-entregador', [PedidoController::class, 'assignDriver']);
Route::post('/pedidos/{id}/marcar-pago', [PedidoController::class, 'markAsPaid']);

// Rotas de Motoboys
Route::get('/entregadores', [EntregadorController::class, 'index']);
Route::post('/entregadores', [EntregadorController::class, 'store']);
Route::patch('/entregadores/{id}', [EntregadorController::class, 'update']);

// Rotas Financeiras & Caixa
Route::get('/financeiro/resumo', [FinanceiroController::class, 'summary']);
Route::get('/financeiro/transacoes', [FinanceiroController::class, 'transactions']);
Route::post('/financeiro/despesa', [FinanceiroController::class, 'storeExpense']);
```

---

## 4. O Controller Principal de Pedidos (`PedidoController.php`)

O controller é a peça que executa a lógica. Veja como o fluxo que você pediu (onde o pedido fica como "A PAGAR" até o admin confirmar) funciona no Laravel:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\TransacaoFinanceira;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PedidoController extends Controller
{
    // Quando o entregador marca como entregue:
    // O pedido vai para 'entregue', MAS CONTINUA com 'status_pagamento' = 'a_pagar_entrega'
    public function updateStatus(Request $request, $id)
    {
        $pedido = Pedido::findOrFail($id);
        $novoStatus = $request->input('status');

        $pedido->status = $novoStatus;
        $pedido->save();

        return response()->json([
            'mensagem' => 'Status atualizado com sucesso',
            'pedido' => $pedido
        ]);
    }

    // Apenas quando o Administrador clica em 'PAGO' no Kanban:
    // O status vira 'pago', cria a transação no caixa financeiro e arquiva
    public function markAsPaid($id)
    {
        return DB::transaction(function () use ($id) {
            $pedido = Pedido::findOrFail($id);
            $pedido->status_pagamento = 'pago';
            $pedido->save();

            // Lança a receita no caixa financeiro da pastelaria
            $transacao = TransacaoFinanceira::create([
                'tipo' => 'entrada',
                'categoria' => 'venda_pedido',
                'descricao' => "Recebimento Pedido #{$pedido->numero_sequencial} - {$pedido->cliente_nome}",
                'valor' => $pedido->valor_total,
                'forma_pagamento' => $pedido->forma_pagamento,
                'pedido_id' => $pedido->id,
                'data_transacao' => now(),
            ]);

            return response()->json([
                'mensagem' => 'Pagamento registrado no caixa com sucesso!',
                'pedido' => $pedido,
                'transacao' => $transacao
            ]);
        });
    }
}
```

---

## 5. Como conectar o Front-end React ao seu Laravel

Quando você colocar o Laravel rodando no seu servidor, bastará criar um arquivo `.env` no React apontando para ele:

```env
VITE_API_URL=http://ip-do-seu-servidor-oracle:8000/api
```

E os pedidos, cardápios e motoboys serão salvos diretamente no seu MySQL!
Pode ficar tranquilo: quando você for fazer isso no seu servidor, nós faremos juntos comando por comando, com toda a paciência!

---

## 6. Como subir sua página de teste no GitHub Pages (Passo a Passo Simples)

Se você quer colocar essa aplicação na internet pelo **GitHub Pages** para testar no celular ou mostrar para a equipe, siga estes 4 passos simples:

### Passo 1: No seu computador, criar o repositório no GitHub
1. Abra o site [github.com](https://github.com) e crie um novo repositório (exemplo: `pastelaria-app`).
2. Marque o repositório como **Público**.

### Passo 2: Configurar o arquivo `package.json`
Abra o arquivo `package.json` do projeto e adicione a linha com o endereço do seu GitHub Pages:
```json
"homepage": "https://seu-usuario.github.io/pastelaria-app"
```

### Passo 3: Gerar a pasta de publicação
No terminal do seu computador (na pasta do projeto), rode:
```bash
npm run build
```
Isso vai criar uma pasta chamada `dist` com todos os arquivos prontos e otimizados para a internet.

### Passo 4: Ativar o GitHub Pages
1. No seu repositório no GitHub, vá em **Settings** (Configurações) > **Pages**.
2. Em **Source**, escolha a branch (geralmente `main` ou `gh-pages`) e a pasta onde os arquivos foram enviados.
3. Clique em **Save**. Em 1 ou 2 minutos, o GitHub vai te fornecer um link público (ex: `https://seu-usuario.github.io/pastelaria-app`) que qualquer pessoa pode acessar pelo celular!

---

## 7. Como funciona a Integração com o Google Maps

O sistema já está com o **Google Maps integrado** em dois pontos principais:
1. **Rastreamento do Cliente (`OrderTracker`)**: Exibe o mapa oficial do Google Maps com o endereço da entrega do cliente e botão "Abrir no Google Maps App" para ver o trajeto no smartphone.
2. **Painel do Entregador (`DeliveryModule`)**: Cada pedido tem o botão "Navegar via Google Maps (GPS)", que abre o Google Maps do celular do motoboy pronto para iniciar a navegação por voz curva a curva até a casa do cliente.

*Nota de facilidade:* Para a sua página de teste, o mapa já usa o visualizador universal do Google Maps, portanto **não precisa de cartão de crédito nem cadastro no Google Cloud** para funcionar no teste! Quando quiser colocar sua chave de API própria no futuro, basta adicioná-la no arquivo `.env` como `VITE_GOOGLE_MAPS_API_KEY`.

