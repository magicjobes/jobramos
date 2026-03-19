import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { FornecedoresClient } from "@/components/fornecedores/fornecedores-client"
import { redirect } from "next/navigation"

export default async function FornecedoresPage() {
  const supabase = await createClient()

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

  const [fornecedoresRes, produtosRes] = await Promise.all([
    supabase.from("fornecedores").select("*").eq("empresa_id", empresaId).order("created_at", { ascending: false }),
    supabase.from("produtos").select("id, nome, preco, custo_unitario").eq("empresa_id", empresaId).order("nome"),
  ])

  // Get fornecedor_produtos separately - may be empty if table was just created
  const fornecedorProdutosRes = await supabase.from("fornecedor_produtos").select("*").eq("empresa_id", empresaId)

  return (
    <div>
      <Header title="Fornecedores" subtitle="Gestão de fornecedores e catálogo de produtos" />
      <FornecedoresClient 
        fornecedores={fornecedoresRes.data || []} 
        produtos={produtosRes.data || []}
        fornecedorProdutos={fornecedorProdutosRes.data || []}
        empresaId={empresaId}
      />
    </div>
  )
}
