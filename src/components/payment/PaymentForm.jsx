import React, { useState } from 'react';
import { CreditCard, Smartphone, Building2 } from 'lucide-react';
import toast from '../../utils/toast';
import { usePayment } from '../../hooks/usePayment';
import { formatCurrency } from '../../utils/helpers';
import Button from '../common/Button';
import Input from '../common/Input';

const PaymentForm = ({ gathering, onPaymentSuccess }) => {
  const { processPayment, loading } = usePayment();
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});

  const paymentMethods = [
    { id: 'CARD', name: '신용/체크카드', icon: CreditCard },
    { id: 'KAKAO', name: '카카오페이', icon: Smartphone },
    { id: 'ACCOUNT', name: '계좌이체', icon: Building2 },
  ];

  const validateCard = () => {
    const newErrors = {};
    
    if (paymentMethod === 'CARD') {
      if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
        newErrors.cardNumber = '올바른 카드번호를 입력해주세요.';
      }
      
      if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'MM/YY 형식으로 입력해주세요.';
      }
      
      if (!formData.cvv || formData.cvv.length < 3) {
        newErrors.cvv = '3-4자리 CVV를 입력해주세요.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCard()) return;
    
    try {
      const paymentData = {
        paymentMethod,
        ...(paymentMethod === 'CARD' && {
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
        }),
      };
      
      const result = await processPayment(gathering.id, paymentData);
      toast.success('결제가 완료되었습니다.');
      onPaymentSuccess(result);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
    value = value.substring(0, 16);
    value = value.replace(/(.{4})/g, '$1 ').trim();
    
    setFormData(prev => ({ ...prev, cardNumber: value }));
    if (errors.cardNumber) {
      setErrors(prev => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    setFormData(prev => ({ ...prev, expiryDate: value }));
    if (errors.expiryDate) {
      setErrors(prev => ({ ...prev, expiryDate: '' }));
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    setFormData(prev => ({ ...prev, cvv: value }));
    if (errors.cvv) {
      setErrors(prev => ({ ...prev, cvv: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* 결제 정보 */}
      <div className="card">
        <h3 className="font-semibold mb-4">결제 정보</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">모임명</span>
            <span className="font-medium">{gathering.title}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">참여자</span>
            <span>{gathering.participantCount ?? gathering.participants?.length ?? 0}명</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">총 금액</span>
            <span>{formatCurrency(gathering.totalAmount)}</span>
          </div>
          
          <div className="flex justify-between border-t pt-3">
            <span className="text-gray-600">내 분담금</span>
            <span className="font-bold text-lg text-red-600">
              {formatCurrency(gathering.amountPerPerson)}
            </span>
          </div>
        </div>
      </div>

      {/* 결제 방법 선택 */}
      <div className="card">
        <h3 className="font-semibold mb-4">결제 방법</h3>
        
        <div className="grid gap-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                  paymentMethod === method.id
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{method.name}</span>
                {paymentMethod === method.id && (
                  <div className="ml-auto w-2 h-2 bg-black rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 카드 정보 입력 */}
      {paymentMethod === 'CARD' && (
        <div className="card">
          <h3 className="font-semibold mb-4">카드 정보</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="카드번호"
              type="text"
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              error={errors.cardNumber}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="유효기간"
                type="text"
                value={formData.expiryDate}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                maxLength={5}
                error={errors.expiryDate}
                required
              />
              
              <Input
                label="CVV"
                type="text"
                value={formData.cvv}
                onChange={handleCvvChange}
                placeholder="123"
                maxLength={4}
                error={errors.cvv}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              fullWidth 
              size="lg"
              loading={loading}
              className="mt-6"
            >
              {formatCurrency(gathering.amountPerPerson)} 결제하기
            </Button>
          </form>
        </div>
      )}

      {/* 간편결제 */}
      {paymentMethod !== 'CARD' && (
        <div className="card">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              {paymentMethod === 'KAKAO' ? <Smartphone size={48} className="mx-auto" /> : <Bank size={48} className="mx-auto" />}
            </div>
            <p className="text-gray-600 mb-4">
              {paymentMethod === 'KAKAO' ? '카카오페이' : '계좌이체'} 결제를 진행합니다
            </p>
            
            <Button 
              fullWidth 
              size="lg"
              loading={loading}
              onClick={handleSubmit}
            >
              {formatCurrency(gathering.amountPerPerson)} 결제하기
            </Button>
          </div>
        </div>
      )}

      {/* 주의사항 */}
      <div className="card bg-gray-50">
        <h4 className="font-medium mb-2">결제 주의사항</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 결제는 안전하게 암호화되어 처리됩니다</li>
          <li>• 결제 완료 후 취소는 방장에게 문의해주세요</li>
          <li>• 결제 내역은 이메일로 발송됩니다</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentForm;