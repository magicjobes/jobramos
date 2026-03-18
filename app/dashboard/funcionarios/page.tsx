import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { FuncionariosClient } from "@/components/funcionarios/funcionarios-client"

export default async function FuncionariosPage() {
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

  // Tambem verificar se e dono da empresa
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

  // Buscar funcionarios da mesma empresa
  const { data: funcionarios, error } = await supabase
    .from("funcionarios")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar funcionários:", error)
  }

  return (
    <div>
      <Header title="Funcionários" subtitle="Gestão de funcionários" />
      <FuncionariosClient funcionarios={funcionarios || []} currentUserId={user.id} empresaId={empresaId} />
    </div>
  )
}
