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
import { Plus, Search, Package, Pencil, Trash2, Save } from "lucide-react"
import { useRouter } from "next/navigation"

interface Produto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  stock: number
  unidade: string
}

interface ProdutosClientProps {
  produtos: Produto[]
}

const fetcher = async (key: string) => {
  const supabase = createClient()
  const { data } = await supabase.from("produtos").select("*").order("nome")
  return data || []
}

export function ProdutosClient({ produtos: initialProdutos }: ProdutosClientProps) {
  const { data: produtos = initialProdutos, mutate } = useSWR<Produto[]>("produtos", fetcher, {
    fallbackData: initialProdutos,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter()

  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [preco, setPreco] = useState("")
  const [precoAquisicao, setPrecoAquisicao] = useState("")
  const [stock, setStock] = useState("")
  const [unidade, setUnidade] = useState("un")
  const [fornecedorId, setFornecedorId] = useState("")
  const [fornecedores, setFornecedores] = useState<Array<{ id: string; nome: string }>>([])

  // Load fornecedores for the select
  useState(() => {
    const loadFornecedores = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("fornecedores").select("id, nome").order("nome")
      setFornecedores(data || [])
    }
    loadFornecedores()
  })

  const filteredProdutos = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) || p.descricao?.toLowerCase().includes(search.toLowerCase()),
  )

  const resetForm = () => {
    setNome("")
    setDescricao("")
    setPreco("")
    setPrecoAquisicao("")
    setStock("")
    setUnidade("un")
    setFornecedorId("")
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

      const produtoData = {
        nome,
        descricao: descricao || null,
        preco: Number.parseFloat(preco) || 0,
        stock: Number.parseInt(stock) || 0,
        unidade,
      }

      if (editingId) {
        const { error } = await supabase.from("produtos").update(produtoData).eq("id", editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("produtos").insert({
          user_id: user.id,
          ...produtoData,
        })
        if (error) throw error
      }

      setIsOpen(false)
      resetForm()
      mutate()
    } catch (error) {
      console.error(`Erro ao ${editingId ? "atualizar" : "criar"} produto:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (produto: Produto) => {
    setEditingId(produto.id)
    setNome(produto.nome)
    setDescricao(produto.descricao || "")
    setPreco(produto.preco.toString())
    setStock(produto.stock.toString())
    setUnidade(produto.unidade)
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("produtos").delete().eq("id", id)
    mutate(produtos.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Procurar produtos por nome ou descrição..."
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
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Row 1: Nome do Produto */}
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input 
                  id="nome" 
                  value={nome} 
                  onChange={(e) => setNome(e.target.value)} 
                  placeholder="Nome do produto" 
                />
              </div>

              {/* Row 2: Detalhes/Descrição */}
              <div className="grid gap-2">
                <Label htmlFor="descricao">Detalhes</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição detalhada do produto"
                  rows={3}
                />
              </div>

              {/* Row 3: Fornecedor */}
              <div className="grid gap-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione ou digite o fornecedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Adicione fornecedores no módulo de Fornecedores ou digite manualmente
                </p>
              </div>

              {/* Row 4: Preço de Aquisição e Preço de Venda */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="precoAquisicao">Preço de Aquisição (MZN)</Label>
                  <Input
                    id="precoAquisicao"
                    type="number"
                    value={precoAquisicao}
                    onChange={(e) => setPrecoAquisicao(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preco">Preço de Venda (MZN)</Label>
                  <Input
                    id="preco"
                    type="number"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Row 5: Quantidade em Stock */}
              <div className="grid gap-2">
                <Label htmlFor="stock">Quantidade em Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                />
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
              <TableHead>Descrição</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProdutos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum produto registado. Clique em &quot;Novo Produto&quot; para começar.
                </TableCell>
              </TableRow>
            ) : (
              filteredProdutos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {produto.nome}
                    </div>
                  </TableCell>
                  <TableCell>{produto.descricao || "-"}</TableCell>
                  <TableCell>{Number(produto.preco).toLocaleString("pt-MZ")} MZN</TableCell>
                  <TableCell>{produto.stock}</TableCell>
                  <TableCell>{produto.unidade}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(produto)} title="Editar produto">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(produto.id)} title="Eliminar produto">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {filteredProdutos.length > 0 && (
          <div className="border-t px-4 py-3 text-sm text-muted-foreground">
            {filteredProdutos.length} produto{filteredProdutos.length !== 1 ? "s" : ""} registado
            {filteredProdutos.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  )
}
