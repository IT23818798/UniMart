import React, { useState } from 'react';
import { FaCreditCard, FaLock, FaCheckCircle, FaUser, FaCalendarAlt, FaArrowLeft, FaShoppingCart, FaStar } from 'react-icons/fa';

const POINTS_PER_LKR = 1; // 1 Star Point = 1 LKR
const EARN_RATE = 0.10;   // Earn 10% of order value as points

const PaymentGateway = ({ amount, product, quantity, contactPhone, buyerPoints = 0, onPaymentSuccess, onCancel }) => {
  const [pointsToUse, setPointsToUse] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Constants for points logic
  const EARN_RATE = 0.10; // 10% back
  const pointsToEarn = Math.floor(amount * EARN_RATE);
  
  // Split Pay Logic
  const maxPointsPossible = Math.min(buyerPoints, Math.floor(amount));
  const remainingCardAmount = amount - pointsToUse;
  const isFullPointsPayment = pointsToUse >= Math.floor(amount);

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

  const validateCardForm = () => {
    if (isFullPointsPayment) return true; // No card needed

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

    if (!validateCardForm()) return;

    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        // Determine the payment method label for the backend
        let paymentMethodLabel = 'card';
        if (pointsToUse >= amount) paymentMethodLabel = 'points';
        else if (pointsToUse > 0) paymentMethodLabel = 'split';

        onPaymentSuccess({ 
            paymentMethod: paymentMethodLabel,
            pointsUsed: pointsToUse
        });
      }, 2000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col lg:flex-row font-sans h-screen overflow-y-auto lg:overflow-hidden">

      {/* Success Overlay */}
      {isSuccess && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[120] flex flex-col items-center justify-center">
          <div className="bg-gradient-to-tr from-green-100 to-green-50 p-6 rounded-full mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
            <FaCheckCircle className="text-7xl text-green-500" />
          </div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2 tracking-tight">Payment Confirmed!</h2>
          <p className="text-gray-500 text-lg font-medium">Your order is being sent to the seller...</p>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl px-6 py-3 flex flex-col items-center gap-2 text-yellow-800 font-bold">
            <div className="flex items-center gap-2">
                <FaStar className="text-yellow-400" />
                {pointsToUse > 0 && <span>{pointsToUse.toLocaleString()} Star Points deducted</span>}
                {pointsToUse > 0 && pointsToEarn > 0 && <span> · </span>}
                <span>+{pointsToEarn.toLocaleString()} earned from this purchase!</span>
            </div>
          </div>
        </div>
      )}

      {/* Left Panel: Order Summary */}
      <div className="w-full lg:w-2/5 lg:h-full bg-gray-50 p-8 md:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col lg:overflow-y-auto">
        <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center text-blue-600 hover:text-blue-800 font-semibold mb-10 transition-colors disabled:opacity-50"
          >
            <FaArrowLeft className="mr-2" /> Back to Checkout
          </button>

          <h2 className="text-lg font-medium text-gray-500 mb-6 uppercase tracking-wider flex items-center">
            <FaShoppingCart className="mr-2" /> Order Summary
          </h2>

          {product && (
            <div className="flex flex-col h-full">
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 relative shadow-sm">
                  <img src={product.images?.[0] || 'https://via.placeholder.com/150'} alt={product.title} className="object-cover w-full h-full" />
                  <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                    {quantity}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">{product.title}</h3>
                  <p className="text-gray-500 text-xs mb-2 capitalize">{product.category}</p>
                  <p className="font-extrabold text-blue-700">Rs {product.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Points interaction Area */}
              <div className="mb-8 bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <FaStar className="text-yellow-400" /> Use Star Points
                    </h4>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{buyerPoints.toLocaleString()} Available</span>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <button 
                            type="button" 
                            onClick={() => {
                                setUsePoints(!usePoints);
                                if (!usePoints) setPointsToUse(Math.min(buyerPoints, Math.floor(amount)));
                                else setPointsToUse(0);
                            }}
                            className={`w-12 h-6 rounded-full transition-colors relative ${usePoints ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${usePoints ? 'right-1' : 'left-1'}`} />
                        </button>
                        <span className="text-sm font-medium text-gray-600">Apply points to this order</span>
                    </div>

                    {usePoints && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Points to redeem</label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="range"
                                    min="0"
                                    max={maxPointsPossible}
                                    value={pointsToUse}
                                    onChange={(e) => setPointsToUse(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                                    {pointsToUse} pts
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 italic font-medium">1 Star Point = 1 LKR discount</p>
                        </div>
                    )}
                </div>
              </div>

              <div className="space-y-3 pt-2 text-sm text-gray-600">
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span className="text-gray-900">Rs {(product.price * quantity).toFixed(2)}</span>
                </div>
                {pointsToUse > 0 && (
                    <div className="flex justify-between text-indigo-600 font-bold">
                        <span>Star Points Discount</span>
                        <span>- Rs {pointsToUse.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                  <span>Contact Number</span>
                  <span className="font-medium text-gray-900">{contactPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Earnings on this order</span>
                  <span className="font-bold text-green-600">+{pointsToEarn.toLocaleString()} pts (10%)</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-300">
                <span className="text-base font-bold text-gray-900 uppercase">Total to Pay</span>
                <div className="flex items-baseline text-2xl font-black text-gray-900">
                  <span className="text-sm mr-1 text-gray-500 font-medium italic">Rs</span>
                  {remainingCardAmount.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Payment Form */}
      <div className="w-full lg:w-3/5 lg:h-full p-8 md:p-12 lg:p-16 bg-white flex items-start justify-center lg:overflow-y-auto">
        <div className="w-full max-w-lg mx-auto">

          <div className="mb-10">
            <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
              Secure Checkout <FaLock className="text-indigo-400 text-lg" />
            </h1>
            <p className="text-gray-500 font-medium">
                {isFullPointsPayment 
                    ? "Your Star Points cover the entire bill! No card needed." 
                    : "Complete your payment details below to place your order."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* Card Payment Fields - Hidden if points cover 100% */}
            {!isFullPointsPayment ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 mb-8">
                    <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
                        <FaCreditCard />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Card Payment Amount</p>
                        <p className="text-lg font-black text-blue-900 leading-none">Rs {remainingCardAmount.toFixed(2)}</p>
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className={`w-full border ${errors.cardNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl p-4 pl-12 text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-gray-900 shadow-sm`}
                      placeholder="0000 0000 0000 0000"
                      disabled={isLoading}
                    />
                    <FaCreditCard className="absolute left-4 top-5 text-gray-400 text-lg" />
                  </div>
                  {errors.cardNumber && <p className="mt-1.5 text-xs font-bold text-red-600">{errors.cardNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cardholder Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => {
                        setCardName(e.target.value.toUpperCase());
                        if (errors.cardName) setErrors(prev => ({ ...prev, cardName: '' }));
                      }}
                      className={`w-full border ${errors.cardName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl p-4 pl-12 text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase text-gray-900 shadow-sm`}
                      placeholder="ENTER YOUR NAME"
                      disabled={isLoading}
                    />
                    <FaUser className="absolute left-4 top-5 text-gray-400 text-lg" />
                  </div>
                  {errors.cardName && <p className="mt-1.5 text-xs font-bold text-red-600">{errors.cardName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={expiry}
                        onChange={handleExpiryChange}
                        className={`w-full border ${errors.expiry ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl p-4 pl-12 text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-gray-900 shadow-sm`}
                        placeholder="MM/YY"
                        disabled={isLoading}
                      />
                      <FaCalendarAlt className="absolute left-4 top-5 text-gray-400 text-lg" />
                    </div>
                    {errors.expiry && <p className="mt-1.5 text-xs font-bold text-red-600">{errors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">CVV</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cvv}
                        onChange={handleCvvChange}
                        className={`w-full border ${errors.cvv ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl p-4 text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-gray-900 shadow-sm`}
                        placeholder="123"
                        disabled={isLoading}
                      />
                      <FaLock className="absolute right-4 top-5 text-gray-300 text-sm" />
                    </div>
                    {errors.cvv && <p className="mt-1.5 text-xs font-bold text-red-600">{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-8 text-center space-y-4 animate-in zoom-in-95 duration-500">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-md border-4 border-yellow-400">
                    <FaStar className="text-4xl text-yellow-400" />
                </div>
                <h3 className="text-2xl font-black text-yellow-900">Paid in Full with Points</h3>
                <p className="text-yellow-800 font-medium">You are using <span className="font-black">{pointsToUse} Star Points</span> to pay for this Entire Order.</p>
                <div className="bg-yellow-100/50 py-2 px-4 rounded-xl inline-block text-xs font-bold text-yellow-700 uppercase tracking-widest">
                    Card Details Not Required
                </div>
              </div>
            )}

            <div className="pt-8">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-5 px-6 rounded-2xl text-white font-black text-xl transition-all duration-300 flex justify-center items-center gap-3 shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
                  isLoading
                    ? 'bg-indigo-400 cursor-wait'
                    : 'bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-700 hover:shadow-indigo-200 hover:shadow-2xl'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Post Order</span>
                    <FaCheckCircle />
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center font-medium">
              <FaCheckCircle className="mr-2 text-green-500" /> AES-256 Encrypted Transaction • Powered by Unimart Pay
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};


export default PaymentGateway;