-- Script para eliminar produtos duplicados mantendo apenas o mais antigo de cada nome
-- Este script irá:
-- 1. Identificar produtos com o mesmo nome na mesma empresa
-- 2. Manter apenas o primeiro (mais antigo) de cada grupo
-- 3. Eliminar os duplicados

-- Primeiro, vamos ver quais produtos serão eliminados (preview)
-- SELECT 
--   p.id, 
--   p.nome, 
--   p.empresa_id, 
--   p.created_at,
--   'WILL BE DELETED' as action
-- FROM produtos p
-- WHERE p.id NOT IN (
--   SELECT MIN(id)
--   FROM produtos
--   GROUP BY nome, empresa_id
-- )
-- ORDER BY p.nome, p.created_at;

-- Agora eliminar os duplicados (manter apenas o mais antigo de cada nome/empresa)
DELETE FROM produtos
WHERE id NOT IN (
  SELECT MIN(id)
  FROM produtos
  GROUP BY nome, empresa_id
);

-- Verificar quantos produtos restam
-- SELECT COUNT(*) as total_produtos FROM produtos;
