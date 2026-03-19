import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { ProdutosClient } from "@/components/produtos/produtos-client"
import { redirect } from "next/navigation"

export default async function ProdutosPage() {
  const supabase = await createClient()

  // Get user and empresa
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
    .eq("user_id", user.id)
    .single()

  let empresaId = empresa?.id

  if (!empresaId) {
    const { data: funcionario } = await supabase
      .from("funcionarios")
      .select("empresa_id")
      .eq("email", user.email)
      .eq("estado", "Activo")
      .single()
    empresaId = funcionario?.empresa_id
  }

  if (!empresaId) redirect("/dashboard")

  // Get all data in parallel
  const [produtosRes, fornecedoresRes, movimentosRes, facturasItensRes] = await Promise.all([
    supabase.from("produtos").select("*").eq("empresa_id", empresaId).order("created_at", { ascending: false }),
    supabase.from("fornecedores").select("id, nome").eq("empresa_id", empresaId).order("nome"),
    supabase.from("movimentos_stock").select("*").eq("empresa_id", empresaId).order("created_at", { ascending: false }),
    supabase.from("factura_itens").select("produto_id, quantidade, facturas!inner(tipo_documento, estado, empresa_id)")
      .eq("facturas.empresa_id", empresaId),
  ])

  // Calculate statistics per product
  const produtosComStats = (produtosRes.data || []).map(produto => {
    const movsProduto = (movimentosRes.data || []).filter(m => m.produto_id === produto.id)
    const entradas = movsProduto.filter(m => m.tipo === 'entrada').reduce((acc, m) => acc + m.quantidade, 0)
    const saidasManuais = movsProduto.filter(m => m.tipo === 'saida').reduce((acc, m) => acc + m.quantidade, 0)
    
    // Sales from invoices (FT) - exclude cancelled
    const vendasFacturas = (facturasItensRes.data || [])
      .filter((fi: any) => 
        fi.produto_id === produto.id && 
        fi.facturas?.tipo_documento === 'FT' &&
        fi.facturas?.estado !== 'Anulada'
      )
      .reduce((acc: number, fi: any) => acc + (Number(fi.quantidade) || 0), 0)

    // Returns from credit notes (NC)
    const devolucoes = (facturasItensRes.data || [])
      .filter((fi: any) => 
        fi.produto_id === produto.id && 
        fi.facturas?.tipo_documento === 'NC'
      )
      .reduce((acc: number, fi: any) => acc + (Number(fi.quantidade) || 0), 0)

    const totalVendido = vendasFacturas - devolucoes + saidasManuais
    const margemLucro = produto.custo_unitario && produto.preco 
      ? ((produto.preco - produto.custo_unitario) / produto.custo_unitario * 100)
      : null

    // Find main supplier from movements
    const fornecedoresMov = movsProduto
      .filter(m => m.tipo === 'entrada' && m.fornecedor_id)
      .reduce((acc: Record<string, number>, m) => {
        acc[m.fornecedor_id] = (acc[m.fornecedor_id] || 0) + m.quantidade
        return acc
      }, {})
    
    const fornecedorPrincipalId = Object.entries(fornecedoresMov)
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0]
    
    const fornecedorPrincipal = (fornecedoresRes.data || []).find(f => f.id === fornecedorPrincipalId)

    return {
      ...produto,
      total_entradas: entradas,
      total_vendido: totalVendido,
      margem_lucro: margemLucro,
      fornecedor_principal: fornecedorPrincipal?.nome || null,
      movimentos: movsProduto,
    }
  })

  return (
    <div>
      <Header title="Produtos" subtitle="Gestão de produtos, stock e inventário" />
      <ProdutosClient 
        produtos={produtosComStats} 
        fornecedores={fornecedoresRes.data || []}
        empresaId={empresaId}
      />
    </div>
  )
}
