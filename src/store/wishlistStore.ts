import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course } from '../types';

interface WishlistState {
  items: Course[];
  addToWishlist: (course: Course) => void;
  removeFromWishlist: (courseId: string) => void;
  isInWishlist: (courseId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addToWishlist: (course) => {
        const { items } = get();
        if (!items.find(item => item.id === course.id)) {
          set({ items: [...items, course] });
        }
      },
      removeFromWishlist: (courseId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== courseId) });
      },
      isInWishlist: (courseId) => {
        const { items } = get();
        return items.some(item => item.id === courseId);
      },
    }),
    {
      name: 'wishlist-storage', // unique name for localStorage key
      skipHydration: false, // ensure state is hydrated on page load
    }
  )
);