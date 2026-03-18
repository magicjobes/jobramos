import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { ProdutosClient } from "@/components/produtos/produtos-client"

export default async function ProdutosPage() {
  const supabase = await createClient()

  const { data: produtos } = await supabase.from("produtos").select("*").order("created_at", { ascending: false })

  return (
    <div>
      <Header title="Produtos" subtitle="Gestão de produtos e serviços" />
      <ProdutosClient produtos={produtos || []} />
    </div>
  )
}
