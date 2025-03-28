import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useThemeStore } from '../store/themeStore';

type PaymentMethod = 'card' | 'paypal' | 'google-pay' | 'apple-pay';

interface BillingDetails {
  country: string;
  province: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  nameOnCard: string;
  saveCard: boolean;
  paymentMethod: PaymentMethod;
}

// Country data structure
interface Country {
  code: string;
  name: string;
  provinces: { code: string; name: string; }[];
}

// Comprehensive list of countries and their provinces/states
const countries: Country[] = [
  {
    code: 'IN',
    name: 'India',
    provinces: [
      { code: 'AP', name: 'Andhra Pradesh' },
      { code: 'AR', name: 'Arunachal Pradesh' },
      { code: 'AS', name: 'Assam' },
      { code: 'BR', name: 'Bihar' },
      { code: 'CT', name: 'Chhattisgarh' },
      { code: 'GA', name: 'Goa' },
      { code: 'GJ', name: 'Gujarat' },
      { code: 'HR', name: 'Haryana' },
      { code: 'HP', name: 'Himachal Pradesh' },
      { code: 'JH', name: 'Jharkhand' },
      { code: 'KA', name: 'Karnataka' },
      { code: 'KL', name: 'Kerala' },
      { code: 'MP', name: 'Madhya Pradesh' },
      { code: 'MH', name: 'Maharashtra' },
      { code: 'MN', name: 'Manipur' },
      { code: 'ML', name: 'Meghalaya' },
      { code: 'MZ', name: 'Mizoram' },
      { code: 'NL', name: 'Nagaland' },
      { code: 'OR', name: 'Odisha' },
      { code: 'PB', name: 'Punjab' },
      { code: 'RJ', name: 'Rajasthan' },
      { code: 'SK', name: 'Sikkim' },
      { code: 'TN', name: 'Tamil Nadu' },
      { code: 'TG', name: 'Telangana' },
      { code: 'TR', name: 'Tripura' },
      { code: 'UP', name: 'Uttar Pradesh' },
      { code: 'UT', name: 'Uttarakhand' },
      { code: 'WB', name: 'West Bengal' },
      { code: 'AN', name: 'Andaman and Nicobar Islands' },
      { code: 'CH', name: 'Chandigarh' },
      { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
      { code: 'DL', name: 'Delhi' },
      { code: 'JK', name: 'Jammu and Kashmir' },
      { code: 'LA', name: 'Ladakh' },
      { code: 'LD', name: 'Lakshadweep' },
      { code: 'PY', name: 'Puducherry' }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    provinces: [
      { code: 'AL', name: 'Alabama' },
      { code: 'AK', name: 'Alaska' },
      { code: 'AZ', name: 'Arizona' },
      { code: 'AR', name: 'Arkansas' },
      { code: 'CA', name: 'California' },
      { code: 'CO', name: 'Colorado' },
      { code: 'CT', name: 'Connecticut' },
      { code: 'DE', name: 'Delaware' },
      { code: 'FL', name: 'Florida' },
      { code: 'GA', name: 'Georgia' },
      { code: 'HI', name: 'Hawaii' },
      { code: 'ID', name: 'Idaho' },
      { code: 'IL', name: 'Illinois' },
      { code: 'IN', name: 'Indiana' },
      { code: 'IA', name: 'Iowa' },
      { code: 'KS', name: 'Kansas' },
      { code: 'KY', name: 'Kentucky' },
      { code: 'LA', name: 'Louisiana' },
      { code: 'ME', name: 'Maine' },
      { code: 'MD', name: 'Maryland' },
      { code: 'MA', name: 'Massachusetts' },
      { code: 'MI', name: 'Michigan' },
      { code: 'MN', name: 'Minnesota' },
      { code: 'MS', name: 'Mississippi' },
      { code: 'MO', name: 'Missouri' },
      { code: 'MT', name: 'Montana' },
      { code: 'NE', name: 'Nebraska' },
      { code: 'NV', name: 'Nevada' },
      { code: 'NH', name: 'New Hampshire' },
      { code: 'NJ', name: 'New Jersey' },
      { code: 'NM', name: 'New Mexico' },
      { code: 'NY', name: 'New York' },
      { code: 'NC', name: 'North Carolina' },
      { code: 'ND', name: 'North Dakota' },
      { code: 'OH', name: 'Ohio' },
      { code: 'OK', name: 'Oklahoma' },
      { code: 'OR', name: 'Oregon' },
      { code: 'PA', name: 'Pennsylvania' },
      { code: 'RI', name: 'Rhode Island' },
      { code: 'SC', name: 'South Carolina' },
      { code: 'SD', name: 'South Dakota' },
      { code: 'TN', name: 'Tennessee' },
      { code: 'TX', name: 'Texas' },
      { code: 'UT', name: 'Utah' },
      { code: 'VT', name: 'Vermont' },
      { code: 'VA', name: 'Virginia' },
      { code: 'WA', name: 'Washington' },
      { code: 'WV', name: 'West Virginia' },
      { code: 'WI', name: 'Wisconsin' },
      { code: 'WY', name: 'Wyoming' }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    provinces: [
      { code: 'AB', name: 'Alberta' },
      { code: 'BC', name: 'British Columbia' },
      { code: 'MB', name: 'Manitoba' },
      { code: 'NB', name: 'New Brunswick' },
      { code: 'NL', name: 'Newfoundland and Labrador' },
      { code: 'NS', name: 'Nova Scotia' },
      { code: 'NT', name: 'Northwest Territories' },
      { code: 'NU', name: 'Nunavut' },
      { code: 'ON', name: 'Ontario' },
      { code: 'PE', name: 'Prince Edward Island' },
      { code: 'QC', name: 'Quebec' },
      { code: 'SK', name: 'Saskatchewan' },
      { code: 'YT', name: 'Yukon' }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    provinces: [
      { code: 'ENG', name: 'England' },
      { code: 'SCT', name: 'Scotland' },
      { code: 'WLS', name: 'Wales' },
      { code: 'NIR', name: 'Northern Ireland' }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    provinces: [
      { code: 'ACT', name: 'Australian Capital Territory' },
      { code: 'NSW', name: 'New South Wales' },
      { code: 'NT', name: 'Northern Territory' },
      { code: 'QLD', name: 'Queensland' },
      { code: 'SA', name: 'South Australia' },
      { code: 'TAS', name: 'Tasmania' },
      { code: 'VIC', name: 'Victoria' },
      { code: 'WA', name: 'Western Australia' }
    ]
  }
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const { items, getTotal, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    country: '',
    province: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    nameOnCard: '',
    saveCard: false,
    paymentMethod: 'card'
  });

  // Get available provinces based on selected country
  const availableProvinces = useMemo(() => {
    const selectedCountry = countries.find(c => c.code === billingDetails.country);
    return selectedCountry?.provinces || [];
  }, [billingDetails.country]);

  // Reset province when country changes
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBillingDetails(prev => ({
      ...prev,
      country: e.target.value,
      province: '' // Reset province when country changes
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setBillingDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    clearCart();
    setIsProcessing(false);
    navigate('/payment-success');
  };

  const total = getTotal();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sticky Header */}
      <header className={`sticky top-0 z-50 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/courses')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Courses</span>
            </button>
            <div className="flex items-center">
              <ShoppingCart className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} mr-2`} />
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Checkout
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Billing & Payment Form */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
            <div className="flex items-center mb-6">
              <Lock className={`h-5 w-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} mr-2`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Billing address & Payment method
              </h2>
            </div>

            <form onSubmit={handlePayment}>
              {/* Country & Province */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Country
                  </label>
                  <select
                    name="country"
                    value={billingDetails.country}
                    onChange={handleCountryChange}
                    className={`w-full rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } border p-2.5`}
                    required
                  >
                    <option value="">Select country...</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {billingDetails.country === 'GB' ? 'Region' : billingDetails.country === 'IN' ? 'State' : 'Province/State'}
                  </label>
                  <select
                    name="province"
                    value={billingDetails.province}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } border p-2.5`}
                    required
                    disabled={!billingDetails.country}
                  >
                    <option value="">
                      {!billingDetails.country 
                        ? 'Select country first' 
                        : `Select ${billingDetails.country === 'GB' ? 'region' : 'state'}...`}
                    </option>
                    {availableProvinces.map(province => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Method
                </label>
                <div className="space-y-3">
                  {/* Credit Card Option */}
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700' 
                      : 'border-gray-200 bg-white'
                  } ${billingDetails.paymentMethod === 'card' ? 'ring-2 ring-indigo-500' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={billingDetails.paymentMethod === 'card'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-3">
                      <span className={`block font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        Credit / Debit Card
                      </span>
                      <span className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Pay with Visa, Mastercard, or other cards
                      </span>
                    </span>
                    <div className="ml-auto flex items-center space-x-2">
                      <img 
                        src="https://www.freepnglogos.com/uploads/visa-logo-download-png-21.png" 
                        alt="Visa" 
                        className="h-8 object-contain"
                      />
                      <img 
                        src="https://www.freepnglogos.com/uploads/mastercard-png/mastercard-logo-png-transparent-svg-vector-bie-supply-0.png" 
                        alt="Mastercard" 
                        className="h-8 object-contain"
                      />
                    </div>
                  </label>

                  {/* PayPal Option */}
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700' 
                      : 'border-gray-200 bg-white'
                  } ${billingDetails.paymentMethod === 'paypal' ? 'ring-2 ring-indigo-500' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={billingDetails.paymentMethod === 'paypal'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-3">
                      <span className={`block font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        PayPal
                      </span>
                      <span className={`block text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Pay with your PayPal account
                      </span>
                    </span>
                    <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className="h-8 ml-auto" />
                  </label>
                </div>
              </div>

              {/* Card Details */}
              {billingDetails.paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={billingDetails.cardNumber}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg pl-10 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } border p-2.5`}
                        required
                      />
                      <CreditCard className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        placeholder="MM/YY"
                        value={billingDetails.expiryDate}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } border p-2.5`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        CVC/CVV
                      </label>
                      <input
                        type="text"
                        name="cvc"
                        placeholder="123"
                        value={billingDetails.cvc}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } border p-2.5`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Name on Card
                    </label>
                    <input
                      type="text"
                      name="nameOnCard"
                      placeholder="XYZ"
                      value={billingDetails.nameOnCard}
                      onChange={handleInputChange}
                      className={`w-full rounded-lg ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } border p-2.5`}
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="saveCard"
                      checked={billingDetails.saveCard}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 rounded"
                    />
                    <label className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Securely save this card for future purchases
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className={`mt-6 w-full py-3 px-4 rounded-lg flex items-center justify-center font-medium text-white ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
                } shadow-md transition-all duration-200`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Pay ${total.toFixed(2)}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg sticky top-24`}>
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Order Summary
              </h3>
              
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-start">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="ml-4 flex-1">
                      <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {item.title}
                      </h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.description?.substring(0, 60)}...
                      </p>
                    </div>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      $29.99
                    </span>
                  </div>
                ))}
              </div>

              <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between mb-2">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                  <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    ${total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tax</span>
                  <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    $0.00
                  </span>
                </div>
                <div className={`flex justify-between mt-4 pt-4 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <span className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Total
                  </span>
                  <span className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}