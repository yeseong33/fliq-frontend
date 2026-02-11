import React, { useState } from 'react';
import toast from '../../utils/toast';
import { Calendar } from 'lucide-react';
import { useGathering } from '../../hooks/useGathering';
import { validateGatheringTitle, validateGatheringDescription } from '../../utils/validation';
import { GATHERING_ERROR_CODES } from '../../utils/errorCodes';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';

const CreateGathering = ({ isOpen, onClose, onSuccess, onPaymentMethodRequired }) => {
  const { createGathering, loading } = useGathering();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!validateGatheringTitle(formData.title)) {
      newErrors.title = '모임 제목을 입력해주세요. (최대 100자)';
    }

    if (!validateGatheringDescription(formData.description)) {
      newErrors.description = '설명은 최대 500자까지 입력 가능합니다.';
    }

    if (formData.startAt && formData.endAt) {
      if (new Date(formData.startAt) >= new Date(formData.endAt)) {
        newErrors.endAt = '종료 시간은 시작 시간보다 이후여야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
      };

      if (formData.startAt) {
        submitData.startAt = new Date(formData.startAt).toISOString();
      }
      if (formData.endAt) {
        submitData.endAt = new Date(formData.endAt).toISOString();
      }

      const gathering = await createGathering(submitData);
      toast.success('모임이 생성되었습니다.');
      onSuccess(gathering);
      handleClose();
    } catch (error) {
      // 계좌 미등록 에러인 경우
      if (error.code === GATHERING_ERROR_CODES.PAYMENT_METHOD_REQUIRED) {
        handleClose();
        onPaymentMethodRequired?.();
        return;
      }
      toast.error(error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClose = () => {
    setFormData({ title: '', description: '', startAt: '', endAt: '' });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="새 모임 만들기">
      <form onSubmit={handleSubmit}>
        <Input
          label="모임 제목"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="예: 회식 더치페이"
          error={errors.title}
          required
        />

        <div className="form-group">
          <label className="form-label text-gray-900 dark:text-white">모임 설명</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="모임에 대한 간단한 설명을 입력해주세요"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
              bg-white dark:bg-gray-800 
              text-gray-900 dark:text-white 
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
              focus:border-transparent
              transition-colors duration-200"
            rows={4}
            maxLength={500}
          />
          {errors.description && (
            <div className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.description}</div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.description.length}/500
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label text-gray-900 dark:text-white flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-500" />
              시작 시간
            </label>
            <input
              type="datetime-local"
              name="startAt"
              value={formData.startAt}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                focus:border-transparent
                transition-colors duration-200"
            />
          </div>

          <div className="form-group">
            <label className="form-label text-gray-900 dark:text-white flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-500" />
              종료 시간
            </label>
            <input
              type="datetime-local"
              name="endAt"
              value={formData.endAt}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                focus:border-transparent
                transition-colors duration-200"
            />
            {errors.endAt && (
              <div className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.endAt}</div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button 
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleClose}
            className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
          >
            취소
          </Button>
          <Button 
            type="submit" 
            fullWidth 
            loading={loading}
            className="dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            생성하기
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGathering;