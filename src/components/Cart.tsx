import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, CreditCard } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useThemeStore } from '../store/themeStore';

export function Cart() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const { items, removeFromCart, getTotal, clearCart } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg transition-all"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="text-sm font-medium">Cart</span>
        {items.length > 0 && (
          <span className="flex items-center justify-center h-5 w-5 text-xs font-semibold bg-white text-indigo-600 rounded-full">
            {items.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className={`fixed right-0 top-0 h-full w-[400px] flex flex-col shadow-2xl ${
              isDarkMode ? 'bg-[#1A2337]' : 'bg-gray-200'
            }`}
            style={{
              backgroundImage: isDarkMode ? `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54 28h-2v-2h2v2zm-6-6h-2v2h2v-2zm6 0h-2v2h2v-2zm-6 6h-2v2h2v-2zm-6-6h-2v2h2v-2zm6 0h-2v2h2v-2zm-6 6h-2v2h2v-2zm-6-6h-2v2h2v-2zm6 0h-2v2h2v-2zm-6 6h-2v2h2v-2zm-6-6h-2v2h2v-2zm6 0h-2v2h2v-2zm-6 6h-2v2h2v-2z' fill='%23232F45' fill-opacity='0.1'/%3E%3C/svg%3E")` : 'none',
              backgroundRepeat: 'repeat'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Your Cart</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Content */}
            <div className={`flex-1 p-6 ${isDarkMode ? 'bg-transparent' : 'bg-gray-200'}`}>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className={`h-12 w-12 ${isDarkMode ? 'text-[#232F45]' : 'text-gray-400'} mb-4`} />
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your cart is empty
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-4 ${
                        isDarkMode 
                          ? 'bg-[#232F45]/90 border-[#2A3754]' 
                          : 'bg-white border-gray-300'
                      } rounded-lg p-4 shadow-md border backdrop-blur-sm`}
                    >
                      <img
                        src={item.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {item.title}
                        </h3>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.description?.substring(0, 40)}...
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`font-medium ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            $29.99
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-sm text-red-500 hover:text-red-600 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className={`border-t p-6 ${
                isDarkMode 
                  ? 'border-[#232F45] bg-[#1A2337]/50 backdrop-blur-sm' 
                  : 'border-gray-300 bg-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {items.length} {items.length === 1 ? 'course' : 'courses'} in cart
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      ${getTotal().toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={clearCart}
                    className={`text-sm ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-300' 
                        : 'text-gray-600 hover:text-gray-800'
                    } font-medium`}
                  >
                    Clear Cart
                  </button>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 px-4 rounded-lg flex items-center justify-center font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-md transition-all duration-200"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}