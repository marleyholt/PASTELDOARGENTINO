/**
 * Script de Exportação do Firebase Firestore para MariaDB
 * Pastelaria do Argentino
 * 
 * Execução: node scripts/export_firestore_to_mariadb.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Lê a configuração local do Firebase
const configPath = path.resolve('./firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error('Arquivo firebase-applet-config.json não encontrado.');
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

const COLLECTIONS = [
  'orders',
  'products',
  'categories',
  'drivers',
  'financial_transactions',
  'store_config',
  'delivery_zones',
  'system_users'
];

async function exportAll() {
  console.log('--- Iniciando Extração do Firestore ---');
  const backupData = {};

  for (const colName of COLLECTIONS) {
    try {
      console.log(`Extraindo coleção: ${colName}...`);
      const snapshot = await getDocs(collection(db, colName));
      backupData[colName] = [];
      snapshot.forEach(doc => {
        backupData[colName].push({ id: doc.id, ...doc.data() });
      });
      console.log(`Coleção ${colName}: ${backupData[colName].length} documentos extraídos.`);
    } catch (err) {
      console.warn(`Aviso ao ler coleção ${colName}:`, err.message);
      backupData[colName] = [];
    }
  }

  const exportDir = path.resolve('./backup_export');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const jsonFile = path.join(exportDir, 'firestore_backup.json');
  fs.writeFileSync(jsonFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\nExportação concluída com sucesso! Arquivo salvo em: ${jsonFile}`);

  // Gera script de migração SQL DML
  generateSqlInsertScript(backupData, path.join(exportDir, 'import_to_mariadb.sql'));
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

function generateSqlInsertScript(data, outputPath) {
  let sql = `-- SCRIPT DE IMPORTAÇÃO DE DADOS MIGRADOS DO FIRESTORE\nUSE pastelaria_db;\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

  // 1. Categorias
  if (data.categories?.length) {
    sql += `-- Categorias\n`;
    for (const cat of data.categories) {
      sql += `INSERT INTO categories (id, nome, ordem, ativo) VALUES (${escapeSql(cat.id)}, ${escapeSql(cat.nome || 'Categoria')}, ${cat.ordem || 0}, ${cat.ativo !== false ? 1 : 0}) ON DUPLICATE KEY UPDATE nome=VALUES(nome);\n`;
    }
    sql += `\n`;
  }

  // 2. Produtos
  if (data.products?.length) {
    sql += `-- Produtos\n`;
    for (const p of data.products) {
      sql += `INSERT INTO products (id, categoria_id, nome, descricao, preco, imagem_url, ativo, destaque, pausado, adicionais_permitidos) VALUES (
        ${escapeSql(p.id)}, 
        ${escapeSql(p.categoriaId || 'cat_default')}, 
        ${escapeSql(p.nome || 'Sem Nome')}, 
        ${escapeSql(p.descricao || '')}, 
        ${Number(p.preco || 0)}, 
        ${escapeSql(p.imagemUrl || '')}, 
        ${p.ativo !== false ? 1 : 0}, 
        ${p.destaque ? 1 : 0}, 
        ${p.pausado ? 1 : 0}, 
        ${escapeSql(p.adicionaisPermitidos || [])}
      ) ON DUPLICATE KEY UPDATE nome=VALUES(nome), preco=VALUES(preco);\n`;
    }
    sql += `\n`;
  }

  // 3. Entregadores
  if (data.drivers?.length) {
    sql += `-- Entregadores\n`;
    for (const d of data.drivers) {
      sql += `INSERT INTO drivers (id, codigo_registro, nome, telefone, veiculo, placa, chave_pix, tipo_chave_pix, taxa_entrega_fixa, ativo, em_servico, observacoes) VALUES (
        ${escapeSql(d.id)}, 
        ${escapeSql(d.codigoRegistro || d.id)}, 
        ${escapeSql(d.nome || 'Motoboy')}, 
        ${escapeSql(d.telefone || '')}, 
        ${escapeSql(d.veiculo || 'Moto')}, 
        ${escapeSql(d.placa || null)}, 
        ${escapeSql(d.chavePix || null)}, 
        ${escapeSql(d.tipoChavePix || 'telefone')}, 
        ${Number(d.taxaEntregaFixa || 6.00)}, 
        ${d.ativo !== false ? 1 : 0}, 
        ${d.emServico ? 1 : 0}, 
        ${escapeSql(d.observacoes || null)}
      ) ON DUPLICATE KEY UPDATE nome=VALUES(nome);\n`;
    }
    sql += `\n`;
  }

  // 4. Pedidos
  if (data.orders?.length) {
    sql += `-- Pedidos e Itens\n`;
    for (const o of data.orders) {
      const end = o.enderecoEntrega || {};
      sql += `INSERT INTO orders (id, numero_sequencial, cliente_nome, cliente_telefone, tipo_entrega, status, forma_pagamento, status_pagamento, troco_para, subtotal, taxa_entrega, desconto, valor_total, endereco_logradouro, endereco_numero, endereco_bairro, endereco_complemento, entregador_id, prioridade_entrega, observacao_entrega, observacoes_gerais, created_at) VALUES (
        ${escapeSql(o.id)},
        ${Number(o.numeroSequencial || 1)},
        ${escapeSql(o.clienteNome || 'Cliente')},
        ${escapeSql(o.clienteTelefone || '')},
        ${escapeSql(o.tipoEntrega || 'delivery')},
        ${escapeSql(o.status || 'novo')},
        ${escapeSql(o.formaPagamento || 'pix')},
        ${escapeSql(o.statusPagamento || 'pendente')},
        ${o.trocoPara ? Number(o.trocoPara) : 'NULL'},
        ${Number(o.subtotal || 0)},
        ${Number(o.taxaEntrega || 0)},
        ${Number(o.desconto || 0)},
        ${Number(o.valorTotal || 0)},
        ${escapeSql(end.logradouro || null)},
        ${escapeSql(end.numero || null)},
        ${escapeSql(end.bairro || null)},
        ${escapeSql(end.complemento || null)},
        ${escapeSql(o.entregadorId || null)},
        ${Number(o.prioridadeEntrega || 0)},
        ${escapeSql(o.observacaoEntrega || null)},
        ${escapeSql(o.observacoesGerais || null)},
        ${escapeSql(o.criadoEm || new Date().toISOString())}
      ) ON DUPLICATE KEY UPDATE status=VALUES(status);\n`;

      // Itens do Pedido
      if (Array.isArray(o.itens)) {
        for (const item of o.itens) {
          sql += `INSERT INTO order_items (id, order_id, product_id, nome_produto, preco_unitario, quantidade, subtotal, observacao) VALUES (
            ${escapeSql(item.id || Math.random().toString(36).substring(7))},
            ${escapeSql(o.id)},
            ${escapeSql(item.produtoId || 'p_gen')},
            ${escapeSql(item.nomeProduto || 'Item')},
            ${Number(item.precoUnitario || 0)},
            ${Number(item.quantidade || 1)},
            ${Number(item.subtotal || 0)},
            ${escapeSql(item.observacao || null)}
          );\n`;
        }
      }
    }
    sql += `\n`;
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`Script SQL gerado com sucesso em: ${outputPath}`);
}

exportAll().catch(err => {
  console.error('Erro durante o processo de exportação:', err);
  process.exit(1);
});
