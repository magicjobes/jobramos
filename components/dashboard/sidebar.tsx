"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Home,
  FileText,
  FileSpreadsheet,
  Users,
  Package,
  Truck,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  Mail,
  ScrollText,
  Send,
  Receipt,
  Wallet,
  Banknote,
  Calculator,
} from "lucide-react"

const menuItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/facturas", label: "Facturas", icon: FileText },
  { href: "/dashboard/recibos", label: "Recibos", icon: Receipt },
  { href: "/dashboard/despesas", label: "Despesas", icon: Wallet },
  { href: "/dashboard/cotacoes", label: "Cotacoes", icon: FileSpreadsheet },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/produtos", label: "Produtos", icon: Package },
  { href: "/dashboard/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/dashboard/cartas", label: "Cartas", icon: ScrollText },
  { href: "/dashboard/emails", label: "Emails Enviados", icon: Send },
]

const adminMenuItems = [
  { href: "/dashboard/funcionarios", label: "Funcionarios", icon: UserCog },
  { href: "/dashboard/salarios", label: "Salarios", icon: Banknote },
  { href: "/dashboard/conciliacao", label: "Conciliacao", icon: Calculator },
  { href: "/dashboard/relatorios", label: "Relatorios", icon: BarChart3 },
  { href: "/dashboard/configuracoes", label: "Configuracoes", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: funcionario } = await supabase
            .from("funcionarios")
            .select("nivel_acesso")
            .eq("user_id", user.id)
            .maybeSingle()

          setIsAdmin(funcionario?.nivel_acesso === "admin")
        }
      } catch (error) {
        console.error("Erro ao verificar admin:", error)
      } finally {
        setIsLoaded(true)
      }
    }

    checkAdmin()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const visibleMenuItems = isAdmin ? [...menuItems, ...adminMenuItems] : menuItems

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-muted p-4">
        <Image src="/images/logo.png" alt="Magic Pro Services" width={40} height={40} className="h-10 w-10 object-contain" />
        <div>
          <h1 className="font-semibold leading-tight">Magic Pro</h1>
          <p className="text-xs text-sidebar-foreground/60">Services</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1 p-3">
        {visibleMenuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-muted text-sidebar-accent"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-muted p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-muted hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair do Sistema
        </button>
        <p className="mt-2 px-3 text-xs text-sidebar-foreground/40">Magic Pro Services v1.0</p>
      </div>
    </aside>
  )
}
