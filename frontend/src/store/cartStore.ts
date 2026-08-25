import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem, FoodVariant, FoodAddOn } from '@/types';

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;
  restaurantSlug: string | null;
  restaurantName: string | null;
  tableNumber: string | null;

  addItem: (
    menuItem: MenuItem,
    quantity: number,
    selectedVariant?: FoodVariant,
    selectedAddOns?: Array<FoodAddOn & { quantity: number }>,
    specialInstructions?: string
  ) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  setRestaurant: (id: string, slug: string, name: string) => void;
  setTableNumber: (tableNumber: string | null) => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

function calcUnitPrice(item: MenuItem, variant?: FoodVariant, addOns?: Array<FoodAddOn & { quantity: number }>): number {
  let price = item.discountedPrice || item.price;
  if (variant) price += variant.priceExtra;
  if (addOns) {
    addOns.forEach((addon) => {
      price += addon.price * (addon.quantity || 1);
    });
  }
  return price;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantSlug: null,
      restaurantName: null,
      tableNumber: null,

      addItem: (menuItem, quantity, selectedVariant, selectedAddOns = [], specialInstructions) => {
        const unitPrice = calcUnitPrice(menuItem, selectedVariant, selectedAddOns);
        const totalPrice = unitPrice * quantity;
        const newItem: CartItem = {
          menuItem,
          quantity,
          selectedVariant,
          selectedAddOns,
          specialInstructions,
          unitPrice,
          totalPrice,
        };
        set((state) => ({ items: [...state.items, newItem] }));
      },

      removeItem: (index) => {
        set((state) => ({ items: state.items.filter((_, i) => i !== index) }));
      },

      updateQuantity: (index, quantity) => {
        if (quantity <= 0) {
          get().removeItem(index);
          return;
        }
        set((state) => ({
          items: state.items.map((item, i) =>
            i === index
              ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [], restaurantId: null, restaurantSlug: null, restaurantName: null, tableNumber: null }),

      setRestaurant: (id, slug, name) => set({ restaurantId: id, restaurantSlug: slug, restaurantName: name }),

      setTableNumber: (tableNumber) => set({ tableNumber }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
);
