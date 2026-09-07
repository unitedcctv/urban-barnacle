import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export interface CartItem {
  id: string
  title: string
  price: number
  image_url: string | null
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: CartItem) => boolean
  removeItem: (id: string) => void
  clearCart: () => void
  hasItem: (id: string) => boolean
  count: number
  total: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const STORAGE_KEY = "ubdm_cart"

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((item: CartItem): boolean => {
    let added = false
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev
      added = true
      return [...prev, item]
    })
    return added
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const hasItem = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      clearCart,
      hasItem,
      count: items.length,
      total: items.reduce((sum, i) => sum + i.price, 0),
    }),
    [items, addItem, removeItem, clearCart, hasItem],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
