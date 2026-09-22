-- ==============================================================================
-- SISTEMA DE GESTÃO E DELIVERY: PASTELARIA DO ARGENTINO
-- BANCO DE DADOS: MariaDB 10.6+ / MySQL 8.0+ (Motor InnoDB, Charset UTF-8 MB4)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `pastelaria_db` 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE `pastelaria_db`;

-- Desabilita verificações de FK temporariamente durante criação
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. TABELA: store_config (Configurações Gerais do Restaurante e Parâmetros Operacionais)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `store_config`;
CREATE TABLE `store_config` (
    `id` INT UNSIGNED NOT NULL DEFAULT 1 PRIMARY KEY,
    `nome` VARCHAR(150) NOT NULL DEFAULT 'Pastelaria do Argentino',
    `cnpj_cpf` VARCHAR(30) NOT NULL DEFAULT '00.000.000/0001-00',
    `telefone_contato` VARCHAR(30) NOT NULL DEFAULT '(11) 99999-9999',
    `whatsapp_oficial` VARCHAR(30) NOT NULL DEFAULT '5511999999999',
    `logotipo_url` TEXT NULL,
    `endereco_completo` VARCHAR(255) NOT NULL DEFAULT 'Rua Principal, 100 - Centro',
    `horario_funcionamento` VARCHAR(255) NOT NULL DEFAULT 'Terça a Domingo das 18:00 às 23:30',
    `chave_pix` VARCHAR(150) NOT NULL DEFAULT 'pastelariadoargentino@pix.com',
    `tipo_chave_pix` ENUM('cpf', 'cnpj', 'email', 'telefone', 'aleatoria') NOT NULL DEFAULT 'email',
    `nome_titular_pix` VARCHAR(150) NOT NULL DEFAULT 'Pastelaria do Argentino ME',
    `mensagem_whatsapp_padrao` TEXT NULL,
    `pedido_minimo` DECIMAL(10, 2) NOT NULL DEFAULT 15.00,
    `tempo_retirada_min` INT NOT NULL DEFAULT 20,
    `tempo_entrega_padrao_min` INT NOT NULL DEFAULT 45,
    `permite_retirada` BOOLEAN NOT NULL DEFAULT TRUE,
    `permite_entrega` BOOLEAN NOT NULL DEFAULT TRUE,
    `senha_cozinha` VARCHAR(255) NOT NULL DEFAULT 'cozinha123', -- Hash ou senha de acesso KDS
    `webhook_whatsapp_url` VARCHAR(255) NULL,
    `webhook_whatsapp_token` VARCHAR(255) NULL,
    `webhook_whatsapp_ativo` BOOLEAN NOT NULL DEFAULT FALSE,
    `loja_aberta` BOOLEAN NOT NULL DEFAULT TRUE,
    `mensagem_fechamento_personalizada` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Linha inicial padrão da loja
INSERT INTO `store_config` (`id`, `nome`, `horario_funcionamento`) 
VALUES (1, 'Pastelaria do Argentino', 'Terça a Domingo: 18h às 23h30')
ON DUPLICATE KEY UPDATE `nome` = VALUES(`nome`);

-- ------------------------------------------------------------------------------
-- 2. TABELA: system_users (Usuários do Sistema, Permissões e Perfil Master)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_users`;
CREATE TABLE `system_users` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `nome` VARCHAR(150) NOT NULL,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `telefone` VARCHAR(30) NULL,
    `cargo` ENUM('admin', 'caixa', 'cozinha', 'entregador') NOT NULL DEFAULT 'caixa',
    `is_master` BOOLEAN NOT NULL DEFAULT FALSE,
    `senha_hash` VARCHAR(255) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
    `permissoes_json` JSON NOT NULL, -- {cardapio: bool, pedidos: bool, cozinha: bool, entregador: bool, financeiro: bool, configuracoes: bool}
    `ultimo_login` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_cargo` (`cargo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Semente obrigatória do Usuário MASTER: leaog.8@gmail.com
INSERT INTO `system_users` (
    `id`, `nome`, `email`, `telefone`, `cargo`, `is_master`, `ativo`, `permissoes_json`
) VALUES (
    'usr_master_001',
    'Administrador Master',
    'leaog.8@gmail.com',
    '(11) 99999-9999',
    'admin',
    TRUE,
    TRUE,
    JSON_OBJECT(
        'cardapio', TRUE,
        'pedidos', TRUE,
        'cozinha', TRUE,
        'entregador', TRUE,
        'financeiro', TRUE,
        'configuracoes', TRUE
    )
) ON DUPLICATE KEY UPDATE `is_master` = TRUE, `cargo` = 'admin', `ativo` = TRUE;

-- ------------------------------------------------------------------------------
-- 3. TABELA: categories (Categorias do Cardápio: Pastéis Salgados, Doces, Bebidas, etc.)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `nome` VARCHAR(100) NOT NULL,
    `ordem` INT NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_categories_ordem` (`ordem`),
    INDEX `idx_categories_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABELA: product_extras (Opcionais e Adicionais: Bacon, Queijo Extra, Catupiry, etc.)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `product_extras`;
CREATE TABLE `product_extras` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `nome` VARCHAR(100) NOT NULL,
    `preco` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `disponivel` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_extras_disponivel` (`disponivel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABELA: products (Produtos Cadastrados no Cardápio)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `categoria_id` VARCHAR(64) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `preco_custo` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `imagem_url` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
    `destaque` BOOLEAN NOT NULL DEFAULT FALSE,
    `pausado` BOOLEAN NOT NULL DEFAULT FALSE, -- Produto temporariamente esgotado
    `estoque_atual` INT NULL, -- Opcional: controle de inventário físico
    `adicionais_permitidos` JSON NULL, -- Array de IDs de product_extras ["ext_1", "ext_2"]
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_products_category` FOREIGN KEY (`categoria_id`) 
        REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_products_categoria` (`categoria_id`),
    INDEX `idx_products_ativo` (`ativo`),
    INDEX `idx_products_pausado` (`pausado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. TABELA: delivery_zones (Bairros e Taxas de Entrega)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `delivery_zones`;
CREATE TABLE `delivery_zones` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `bairro` VARCHAR(100) NOT NULL UNIQUE,
    `taxa` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `tempo_estimado_min` INT NOT NULL DEFAULT 45,
    `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_zones_bairro` (`bairro`),
    INDEX `idx_zones_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. TABELA: drivers (Entregadores / Motoboys da Equipe)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `drivers`;
CREATE TABLE `drivers` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `codigo_registro` VARCHAR(30) NOT NULL UNIQUE, -- Ex: '01', '10', 'ARG-01'
    `nome` VARCHAR(150) NOT NULL,
    `telefone` VARCHAR(30) NOT NULL,
    `veiculo` VARCHAR(100) NOT NULL DEFAULT 'Moto',
    `placa` VARCHAR(20) NULL,
    `chave_pix` VARCHAR(150) NULL,
    `tipo_chave_pix` ENUM('cpf', 'telefone', 'email', 'aleatoria') DEFAULT 'telefone',
    `taxa_entrega_fixa` DECIMAL(10, 2) NOT NULL DEFAULT 6.00, -- Valor repassado ao motoboy
    `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
    `em_servico` BOOLEAN NOT NULL DEFAULT FALSE, -- Online no turno
    `senha_hash` VARCHAR(255) NULL, -- Senha de acesso ao portal do motoboy
    `observacoes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_drivers_registro` (`codigo_registro`),
    INDEX `idx_drivers_em_servico` (`em_servico`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. TABELA: driver_locations (Telemetria GPS dos Motoboys em Tempo Real)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `driver_locations`;
CREATE TABLE `driver_locations` (
    `driver_id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `velocidade` DECIMAL(6, 2) NULL,
    `precisao` DECIMAL(6, 2) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_driver_locations_driver` FOREIGN KEY (`driver_id`)
        REFERENCES `drivers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. TABELA: cash_registers (Abertura e Fechamento de Caixa do Restaurante)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `cash_registers`;
CREATE TABLE `cash_registers` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `data_abertura` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `data_fechamento` TIMESTAMP NULL,
    `saldo_inicial` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `saldo_final_dinheiro` DECIMAL(10, 2) NULL,
    `total_entradas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_saidas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('aberto', 'fechado') NOT NULL DEFAULT 'aberto',
    `responsavel` VARCHAR(150) NOT NULL,
    `observacoes` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_cash_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. TABELA: orders (Pipeline do Pedido: Kanban, KDS, Delivery e Balcão)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `numero_sequencial` INT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE,
    `cliente_nome` VARCHAR(150) NOT NULL,
    `cliente_telefone` VARCHAR(30) NOT NULL,
    `tipo_entrega` ENUM('delivery', 'retirada') NOT NULL DEFAULT 'delivery',
    `status` ENUM('novo', 'preparando', 'pronto', 'em_entrega', 'entregue', 'cancelado') NOT NULL DEFAULT 'novo',
    `forma_pagamento` ENUM('pix', 'cartao_credito', 'cartao_debito', 'dinheiro') NOT NULL DEFAULT 'pix',
    `status_pagamento` ENUM('pendente', 'pago', 'na_entrega') NOT NULL DEFAULT 'pendente',
    `troco_para` DECIMAL(10, 2) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `taxa_entrega` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `desconto` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `valor_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Dados de Entrega e Rota
    `endereco_logradouro` VARCHAR(200) NULL,
    `endereco_numero` VARCHAR(50) NULL,
    `endereco_bairro` VARCHAR(100) NULL,
    `endereco_complemento` VARCHAR(100) NULL,
    `endereco_cep` VARCHAR(20) NULL,
    `endereco_cidade` VARCHAR(100) NULL DEFAULT 'São Paulo',
    
    -- Despacho e Motoboy
    `entregador_id` VARCHAR(64) NULL,
    `entregador_nome` VARCHAR(150) NULL,
    `prioridade_entrega` INT NULL DEFAULT 0,
    `ordem_rota_sugerida` INT NULL DEFAULT 0,
    `observacao_entrega` TEXT NULL,
    `observacoes_gerais` TEXT NULL,
    
    -- Timestamps de ciclo operacional
    `tempo_preparo_inicio` TIMESTAMP NULL,
    `tempo_pronto` TIMESTAMP NULL,
    `tempo_saida_entrega` TIMESTAMP NULL,
    `tempo_conclusao` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_orders_driver` FOREIGN KEY (`entregador_id`)
        REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_orders_status` (`status`),
    INDEX `idx_orders_tipo` (`tipo_entrega`),
    INDEX `idx_orders_cliente_tel` (`cliente_telefone`),
    INDEX `idx_orders_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. TABELA: order_items (Itens contidos em cada Pedido)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `order_id` VARCHAR(64) NOT NULL,
    `product_id` VARCHAR(64) NOT NULL,
    `nome_produto` VARCHAR(150) NOT NULL,
    `preco_unitario` DECIMAL(10, 2) NOT NULL,
    `quantidade` INT UNSIGNED NOT NULL DEFAULT 1,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `observacao` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`)
        REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`)
        REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_order_items_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. TABELA: order_item_extras (Adicionais e Opcionais Selecionados para o Item)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_item_extras`;
CREATE TABLE `order_item_extras` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `order_item_id` VARCHAR(64) NOT NULL,
    `extra_id` VARCHAR(64) NOT NULL,
    `nome_extra` VARCHAR(100) NOT NULL,
    `preco` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT `fk_item_extras_item` FOREIGN KEY (`order_item_id`)
        REFERENCES `order_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_item_extras_extra` FOREIGN KEY (`extra_id`)
        REFERENCES `product_extras` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_item_extras_item` (`order_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. TABELA: financial_transactions (Livro Caixa e Movimentações Financeiras)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `financial_transactions`;
CREATE TABLE `financial_transactions` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `tipo` ENUM('entrada', 'saida') NOT NULL,
    `categoria` ENUM('venda_pedido', 'ingredientes', 'embalagens', 'salarios', 'utilidades', 'outros') NOT NULL DEFAULT 'venda_pedido',
    `descricao` VARCHAR(255) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `forma_pagamento` ENUM('pix', 'cartao_credito', 'cartao_debito', 'dinheiro') NOT NULL DEFAULT 'pix',
    `order_id` VARCHAR(64) NULL,
    `data_transacao` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_financial_order` FOREIGN KEY (`order_id`)
        REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_financial_tipo` (`tipo`),
    INDEX `idx_financial_data` (`data_transacao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. TABELA: system_audit_logs (Trilha de Auditoria e Segurança)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_audit_logs`;
CREATE TABLE `system_audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_email` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(100) NOT NULL, -- Ex: 'ORDER_STATUS_CHANGED', 'CASH_CLOSED', 'PRODUCT_UPDATED'
    `entidade` VARCHAR(100) NOT NULL,
    `entidade_id` VARCHAR(64) NOT NULL,
    `detalhes` JSON NULL,
    `ip_origem` VARCHAR(45) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_email` (`user_email`),
    INDEX `idx_audit_acao` (`acao`),
    INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reabilita verificações de FK
SET FOREIGN_KEY_CHECKS = 1;
