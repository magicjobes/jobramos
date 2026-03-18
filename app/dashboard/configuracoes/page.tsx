import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConfiguracoesClient } from "@/components/configuracoes/configuracoes-client"

export default async function ConfiguracoesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  console.log("[v0] ConfiguracoesPage - User ID:", user.id)

  const { data: currentFuncionario, error: funcError } = await supabase
    .from("funcionarios")
    .select("nivel_acesso")
    .eq("user_id", user.id)
    .maybeSingle()

  console.log("[v0] ConfiguracoesPage - Funcionario data:", currentFuncionario)
  console.log("[v0] ConfiguracoesPage - Funcionario error:", funcError)

  if (!currentFuncionario || currentFuncionario.nivel_acesso !== "admin") {
    console.log("[v0] ConfiguracoesPage - Acesso negado, redirecionando")
    redirect("/dashboard")
  }

  return <ConfiguracoesClient />
}
