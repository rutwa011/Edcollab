import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingCart } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export function PaymentSuccess() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sticky Header */}
      <header className={`sticky top-0 z-50 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ShoppingCart className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} mr-2`} />
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Payment Status
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className={`max-w-md w-full mx-auto p-8 rounded-xl shadow-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Payment Successful!
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Thank you for your purchase.
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium shadow-md transition-all duration-200"
            >
              Go to My Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}