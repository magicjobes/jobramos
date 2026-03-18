import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { FornecedoresClient } from "@/components/fornecedores/fornecedores-client"

export default async function FornecedoresPage() {
  const supabase = await createClient()

  const { data: fornecedores } = await supabase
    .from("fornecedores")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div>
      <Header title="Fornecedores" subtitle="Gestão de fornecedores" />
      <FornecedoresClient fornecedores={fornecedores || []} />
    </div>
  )
}
