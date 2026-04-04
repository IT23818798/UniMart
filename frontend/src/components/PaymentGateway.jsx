import React, { useState } from 'react';
import { FaCreditCard, FaLock, FaCheckCircle, FaUser, FaCalendarAlt, FaArrowLeft, FaShoppingCart } from 'react-icons/fa';

const PaymentGateway = ({ amount, product, quantity, contactPhone, onPaymentSuccess, onCancel }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted.substring(0, 19));
    if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: '' }));
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setExpiry(val);
    if (errors.expiry) setErrors(prev => ({ ...prev, expiry: '' }));
  };

  const handleCvvChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    setCvv(val.substring(0, 4));
    if (errors.cvv) setErrors(prev => ({ ...prev, cvv: '' }));
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Card number must be exactly 16 digits.';
      isValid = false;
    }

    if (!cardName.trim() || !/^[a-zA-Z\s]+$/.test(cardName)) {
      newErrors.cardName = 'Please enter a valid cardholder name.';
      isValid = false;
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiry)) {
      newErrors.expiry = 'Expiry must be in MM/YY format.';
      isValid = false;
    } else {
      const [month, year] = expiry.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiry = 'Card has expired.';
        isValid = false;
      }
    }

    if (cvv.length < 3 || cvv.length > 4) {
      newErrors.cvv = 'CVV must be 3 or 4 digits.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (!validateForm()) return;

    setIsLoading(true);
    // Simulate API delay for processing payment
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      // Success animation completes, call parent logic to finalize order
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col lg:flex-row font-sans h-screen overflow-y-auto lg:overflow-hidden">
      
      {/* Full Page Success Overlay */}
      {isSuccess && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[120] flex flex-col items-center justify-center transition-all duration-500 opacity-100">
          <div className="bg-gradient-to-tr from-green-100 to-green-50 p-6 rounded-full mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)] transform scale-100 hover:scale-105 transition-transform">
            <FaCheckCircle className="text-7xl text-green-500 drop-shadow-sm" />
          </div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2 tracking-tight">Payment Confirmed!</h2>
          <p className="text-gray-500 text-lg font-medium">Your order is being sent to the seller...</p>
        </div>
      )}

      {/* Left Panel: Order Summary */}
      <div className="w-full lg:w-1/2 lg:h-full bg-gray-50 p-8 md:p-12 lg:p-16 xl:p-24 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col lg:overflow-y-auto">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col pt-4 lg:pt-8 xl:pt-12">
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-10 transition-colors disabled:opacity-50"
          >
            <FaArrowLeft className="mr-2" /> Back to Checkout
          </button>

          <h2 className="text-lg font-medium text-gray-500 mb-8 uppercase tracking-wider flex items-center">
            <FaShoppingCart className="mr-2" /> Order Summary
          </h2>
        
        {product ? (
          <div className="flex flex-col h-full">
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="w-24 h-24 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                 <img src={product.images?.[0] || 'https://via.placeholder.com/150'} alt={product.title} className="object-cover w-full h-full" />
                 <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                   {quantity}
                 </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">{product.title}</h3>
                <p className="text-gray-500 text-sm mb-2">{product.category}</p>
                <p className="font-bold text-gray-900">Rs {product.price}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">Rs {(product.price * quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Fees</span>
                <span className="font-medium text-gray-900">Calculated</span>
              </div>
              <div className="flex justify-between">
                 <span>Contact Number</span>
                 <span className="font-medium text-gray-900">{contactPhone || 'N/A'}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-300">
                <span className="text-base font-medium text-gray-900">Total</span>
                <div className="flex items-baseline text-3xl font-extrabold text-gray-900">
                  <span className="text-lg mr-1 text-gray-500 font-medium tracking-normal">Rs</span> 
                  {(product.price * quantity).toFixed(2)}
                </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
             Order details unavailable.
          </div>
        )}
        </div>
      </div>

      {/* Right Panel: Payment Form */}
      <div className="w-full lg:w-1/2 lg:h-full p-8 md:p-12 lg:p-16 xl:p-24 bg-white flex items-center justify-center lg:overflow-y-auto">
        <div className="w-full max-w-lg mx-auto my-auto lg:my-0 bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-gray-50 transition-shadow duration-300">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
               Payment Details <FaLock className="text-gray-400 text-lg" />
            </h1>
            <p className="text-gray-500 text-sm">Complete your purchase securely via card below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            
            {/* Validated Inputs */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className={`w-full border ${errors.cardNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-lg p-3.5 pl-11 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow font-mono text-gray-900`} 
                  placeholder="0000 0000 0000 0000"
                  disabled={isLoading}
                />
                <FaCreditCard className="absolute left-4 top-4 text-gray-400 text-lg" />
              </div>
              {errors.cardNumber && <p className="mt-1.5 text-sm text-red-600">{errors.cardNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cardholder Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={cardName}
                  onChange={(e) => {
                    setCardName(e.target.value.toUpperCase());
                    if (errors.cardName) setErrors(prev => ({ ...prev, cardName: '' }));
                  }}
                  className={`w-full border ${errors.cardName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-lg p-3.5 pl-11 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow uppercase text-gray-900`} 
                  placeholder="Enter YOur Name"
                  disabled={isLoading}
                />
                <FaUser className="absolute left-4 top-4 text-gray-400 text-lg" />
              </div>
              {errors.cardName && <p className="mt-1.5 text-sm text-red-600">{errors.cardName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={expiry}
                    onChange={handleExpiryChange}
                    className={`w-full border ${errors.expiry ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-lg p-3.5 pl-11 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow font-mono text-gray-900`} 
                    placeholder="MM/YY"
                    disabled={isLoading}
                  />
                  <FaCalendarAlt className="absolute left-4 top-4 text-gray-400 text-lg" />
                </div>
                {errors.expiry && <p className="mt-1.5 text-sm text-red-600">{errors.expiry}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={cvv}
                    onChange={handleCvvChange}
                    className={`w-full border ${errors.cvv ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-lg p-3.5 pl-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow font-mono text-gray-900`} 
                    placeholder="123"
                    disabled={isLoading}
                  />
                  <FaLock className="absolute right-4 top-4 text-gray-300 text-sm" />
                </div>
                {errors.cvv && <p className="mt-1.5 text-sm text-red-600">{errors.cvv}</p>}
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-xl text-white font-extrabold text-lg transition-all duration-300 flex justify-center items-center shadow-lg hover:-translate-y-1 ${
                  isLoading 
                    ? 'bg-indigo-400 cursor-wait' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_10px_20px_rgba(79,70,229,0.3)]'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>Pay Rs {amount.toFixed(2)}</>
                )}
              </button>
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center">
              <FaLock className="mr-1" /> Your payment data is strictly encrypted and secure.
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;