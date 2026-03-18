import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { SalariosClient } from "@/components/salarios/salarios-client"

export default async function SalariosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Buscar o funcionario atual e seu empresa_id
  const { data: currentFuncionario } = await supabase
    .from("funcionarios")
    .select("nivel_acesso, empresa_id")
    .eq("user_id", user.id)
    .maybeSingle()

  // Também verificar se é dono da empresa
  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  const empresaId = currentFuncionario?.empresa_id || empresa?.id
  const isAdmin = currentFuncionario?.nivel_acesso === "admin" || !!empresa

  if (!isAdmin) {
    redirect("/dashboard")
  }

  if (!empresaId) {
    redirect("/dashboard")
  }

  // Buscar funcionários ativos da empresa
  const { data: funcionarios } = await supabase
    .from("funcionarios")
    .select("id, nome, cargo, salario_base, inss")
    .eq("empresa_id", empresaId)
    .eq("estado", "ativo")
    .order("nome", { ascending: true })

  // Buscar folhas de salário com dados dos funcionários
  const { data: folhaSalarios, error } = await supabase
    .from("folha_salarios")
    .select(`
      *,
      funcionario:funcionarios(id, nome, cargo, salario_base, inss)
    `)
    .eq("empresa_id", empresaId)
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar folhas de salário:", error)
  }

  return (
    <div>
      <Header title="Salários" subtitle="Gestão de folha de salários e processamento mensal" />
      <SalariosClient 
        folhaSalarios={folhaSalarios || []} 
        funcionarios={funcionarios || []} 
        empresaId={empresaId} 
      />
    </div>
  )
}
