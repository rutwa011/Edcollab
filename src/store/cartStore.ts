import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course } from '../types';

interface CartState {
  items: Course[];
  addToCart: (course: Course) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (course) => {
        const { items } = get();
        if (!items.find(item => item.id === course.id)) {
          set({ items: [...items, course] });
        }
      },
      removeFromCart: (courseId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== courseId) });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        const { items } = get();
        return items.reduce((total) => total + 29.99, 0); // Static price for demo
      },
    }),
    {
      name: 'cart-storage', // unique name for localStorage key
      skipHydration: false, // ensure state is hydrated on page load
    }
  )
);