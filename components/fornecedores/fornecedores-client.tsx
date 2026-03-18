"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Truck, Pencil, Trash2, Save } from "lucide-react"
import { useRouter } from "next/navigation" // Import router for navigation

interface Fornecedor {
  id: string
  nome: string
  nuit: string | null
  endereco: string | null
  telefone: string | null
  email: string | null
}

interface FornecedoresClientProps {
  fornecedores: Fornecedor[]
}

const fetcher = async (key: string) => {
  const supabase = createClient()
  const { data } = await supabase.from("fornecedores").select("*").order("nome")
  return data || []
}

export function FornecedoresClient({ fornecedores: initialFornecedores }: FornecedoresClientProps) {
  const { data: fornecedoresData = initialFornecedores, mutate } = useSWR<Fornecedor[]>("fornecedores", fetcher, {
    fallbackData: initialFornecedores,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [nome, setNome] = useState("")
  const [nuit, setNuit] = useState("")
  const [endereco, setEndereco] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [cidade, setCidade] = useState("")
  const [pais, setPais] = useState("Moçambique")
  const [detalhes, setDetalhes] = useState("")

  const router = useRouter() // Declare router variable
  const fornecedores = fornecedoresData || []

  const filteredFornecedores = fornecedores.filter(
    (f) =>
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.nuit?.toLowerCase().includes(search.toLowerCase()) ||
      f.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const resetForm = () => {
    setNome("")
    setNuit("")
    setEndereco("")
    setTelefone("")
    setEmail("")
    setCidade("")
    setPais("Moçambique")
    setDetalhes("")
    setEditingId(null)
  }

  const handleSubmit = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      const fornecedorData = {
        nome,
        nuit: nuit || null,
        endereco: endereco || null,
        telefone: telefone || null,
        email: email || null,
      }

      if (editingId) {
        const { error } = await supabase.from("fornecedores").update(fornecedorData).eq("id", editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("fornecedores").insert({
          user_id: user.id,
          ...fornecedorData,
        })
        if (error) throw error
      }

      setIsOpen(false)
      resetForm()
      mutate()
    } catch (error) {
      console.error(`Erro ao ${editingId ? "atualizar" : "criar"} fornecedor:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingId(fornecedor.id)
    setNome(fornecedor.nome)
    setNuit(fornecedor.nuit || "")
    setEndereco(fornecedor.endereco || "")
    setTelefone(fornecedor.telefone || "")
    setEmail(fornecedor.email || "")
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("fornecedores").delete().eq("id", id)
    mutate(fornecedores.filter((f) => f.id !== id)) // Use mutate to update SWR cache
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Procurar fornecedores por nome, NUIT ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Row 1: Nome do Fornecedor */}
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do Fornecedor *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome ou razão social"
                />
              </div>

              {/* Row 2: Detalhes */}
              <div className="grid gap-2">
                <Label htmlFor="detalhes">Detalhes</Label>
                <Textarea
                  id="detalhes"
                  value={detalhes}
                  onChange={(e) => setDetalhes(e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>

              {/* Row 3: País e NUIT */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pais">País</Label>
                  <Select value={pais} onValueChange={setPais}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Moçambique">Moçambique</SelectItem>
                      <SelectItem value="Portugal">Portugal</SelectItem>
                      <SelectItem value="África do Sul">África do Sul</SelectItem>
                      <SelectItem value="Brasil">Brasil</SelectItem>
                      <SelectItem value="Angola">Angola</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nuit">NUIT</Label>
                  <Input
                    id="nuit"
                    value={nuit}
                    onChange={(e) => setNuit(e.target.value)}
                    placeholder="Número de identificação tributária"
                  />
                </div>
              </div>

              {/* Row 4: Endereço e Cidade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
              </div>

              {/* Row 5: Contactos e Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Contactos</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+258..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading || !nome}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "A guardar..." : "Guardar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>NUIT</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFornecedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum fornecedor registado. Clique em &quot;Novo Fornecedor&quot; para começar.
                </TableCell>
              </TableRow>
            ) : (
              filteredFornecedores.map((fornecedor) => (
                <TableRow key={fornecedor.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      {fornecedor.nome}
                    </div>
                  </TableCell>
                  <TableCell>{fornecedor.nuit || "-"}</TableCell>
                  <TableCell>{fornecedor.telefone || "-"}</TableCell>
                  <TableCell>{fornecedor.email || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(fornecedor)} title="Editar fornecedor">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(fornecedor.id)} title="Eliminar fornecedor">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {filteredFornecedores.length > 0 && (
          <div className="border-t px-4 py-3 text-sm text-muted-foreground">
            {filteredFornecedores.length} fornecedor{filteredFornecedores.length !== 1 ? "es" : ""} registado
            {filteredFornecedores.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  )
}
