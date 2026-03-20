import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { LogsClient } from "@/components/logs/logs-client"

export default async function LogsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // First check if user is a funcionario
  const { data: funcionario } = await supabase
    .from("funcionarios")
    .select("empresa_id, nivel_acesso")
    .eq("user_id", user.id)
    .maybeSingle()

  let empresaId = funcionario?.empresa_id
  const isAdmin = funcionario?.nivel_acesso === "admin"

  // If not a funcionario, check if user owns an empresa
  if (!empresaId) {
    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
    empresaId = empresa?.id
  }

  if (!empresaId) {
    return (
      <div>
        <Header title="Logs de Actividade" subtitle="Histórico de todas as acções no sistema" />
        <div className="p-6 text-center text-muted-foreground">
          Nenhuma empresa associada. Configure a sua empresa primeiro.
        </div>
      </div>
    )
  }

  // Only admins can see logs
  if (funcionario && !isAdmin) {
    return (
      <div>
        <Header title="Logs de Actividade" subtitle="Histórico de todas as acções no sistema" />
        <div className="p-6 text-center text-muted-foreground">
          Apenas administradores podem visualizar os logs de actividade.
        </div>
      </div>
    )
  }

  // Fetch logs
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(500)

  // Fetch funcionarios for filter
  const { data: funcionarios } = await supabase
    .from("funcionarios")
    .select("id, nome, email")
    .eq("empresa_id", empresaId)

  return (
    <div>
      <Header title="Logs de Actividade" subtitle="Histórico de todas as acções no sistema" />
      <LogsClient 
        logs={logs || []} 
        funcionarios={funcionarios || []}
      />
    </div>
  )
}
