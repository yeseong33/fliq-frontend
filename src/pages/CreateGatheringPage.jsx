import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../utils/toast';
import { ArrowLeft, ArrowRight, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGathering } from '../hooks/useGathering';
import { validateGatheringTitle, validateGatheringDescription } from '../utils/validation';
import { GATHERING_ERROR_CODES } from '../utils/errorCodes';
import Header from '../components/common/Header';

const CreateGatheringPage = () => {
  const navigate = useNavigate();
  const { createGathering, loading } = useGathering();
  const [step, setStep] = useState(1); // 1: 제목/설명, 2: 날짜
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  // 달력 상태
  const [viewDate, setViewDate] = useState(new Date());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startHour, setStartHour] = useState(12);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(18);
  const [endMinute, setEndMinute] = useState(0);
  const [selecting, setSelecting] = useState('start');

  const days = ['일', '월', '화', '수', '목', '금', '토'];

  const validateStep1 = () => {
    const newErrors = {};

    if (!validateGatheringTitle(formData.title)) {
      newErrors.title = '모임 제목을 입력해주세요. (최대 100자)';
    }

    if (!validateGatheringDescription(formData.description)) {
      newErrors.description = '설명은 최대 500자까지 입력 가능합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    // 종료 시간이 시작 시간보다 이전인지 검증
    if (startDate && endDate) {
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startHour, startMinute);
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endHour, endMinute);
      if (start >= end) {
        toast.error('종료 시간은 시작 시간보다 이후여야 합니다.');
        return;
      }
    }

    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
      };

      if (startDate) {
        submitData.startAt = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
          startHour,
          startMinute
        ).getTime();
      }
      if (endDate) {
        submitData.endAt = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          endHour,
          endMinute
        ).getTime();
      }

      const gathering = await createGathering(submitData);
      toast.success('모임이 생성되었습니다.');
      navigate(`/gathering/${gathering.id}`, { replace: true });
    } catch (error) {
      if (error.code === GATHERING_ERROR_CODES.PAYMENT_METHOD_REQUIRED) {
        toast.error('계좌를 먼저 등록해주세요.');
        navigate('/payment-methods');
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

  // 달력 관련 함수들
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

    if (selecting === 'start') {
      setStartDate(selected);
      if (endDate && selected > endDate) {
        setEndDate(null);
      }
      setSelecting('end');
    } else {
      if (startDate && selected < startDate) {
        setStartDate(selected);
        setEndDate(null);
        setSelecting('end');
      } else {
        setEndDate(selected);
        setSelecting('start');
      }
    }
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isInRange = (day) => {
    if (!startDate || !endDate) return false;
    const current = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return current > startDate && current < endDate;
  };

  const isStart = (day) => {
    if (!startDate) return false;
    const current = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return isSameDay(current, startDate);
  };

  const isEnd = (day) => {
    if (!endDate) return false;
    const current = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return isSameDay(current, endDate);
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === viewDate.getMonth() &&
           today.getFullYear() === viewDate.getFullYear();
  };

  const formatSelectedDate = (date) => {
    if (!date) return '선택 안됨';
    return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
  };

  return (
    <div className="page">
      <Header
        title="새 모임 만들기"
        showBack
        onBack={handleBack}
      />

      <div className="page-content">
        {/* Step 1: 제목, 설명 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                모임 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: 회식 더치페이"
                maxLength={100}
                className={`w-full px-4 py-3 rounded-2xl border-2
                  bg-gray-50 dark:bg-gray-800
                  text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:bg-white dark:focus:bg-gray-700
                  transition-all duration-200
                  ${errors.title
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                모임 설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="모임에 대한 간단한 설명을 입력해주세요"
                rows={4}
                maxLength={500}
                className={`w-full px-4 py-3 rounded-2xl border-2
                  bg-gray-50 dark:bg-gray-800
                  text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:bg-white dark:focus:bg-gray-700
                  transition-all duration-200 resize-none
                  ${errors.description
                    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-500">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                {formData.description.length}/500
              </p>
            </div>

            <button
              onClick={handleNext}
              className="btn-action btn-action-primary w-full py-4 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                다음
                <ArrowRight size={20} />
              </span>
            </button>
          </div>
        )}

        {/* Step 2: 날짜/시간 (달력) */}
        {step === 2 && (
          <div className="space-y-6">
            {/* 선택된 기간 표시 */}
            <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <div
                className={`text-center px-4 py-2 rounded-xl cursor-pointer transition-colors ${
                  selecting === 'start'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setSelecting('start')}
              >
                <div className="text-xs opacity-70">시작</div>
                <div className="font-medium">{formatSelectedDate(startDate)}</div>
              </div>
              <span className="text-gray-400">→</span>
              <div
                className={`text-center px-4 py-2 rounded-xl cursor-pointer transition-colors ${
                  selecting === 'end'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setSelecting('end')}
              >
                <div className="text-xs opacity-70">종료</div>
                <div className="font-medium">{formatSelectedDate(endDate)}</div>
              </div>
            </div>

            {/* 달력 헤더 */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <span className="font-semibold text-gray-900 dark:text-white">
                {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-0">
              {days.map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-0">
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const start = isStart(day);
                const end = isEnd(day);
                const inRange = isInRange(day);
                const today = isToday(day);
                const isSameStartEnd = start && end;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`
                      h-10 text-sm font-medium transition-all relative
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      ${start || end ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}
                      ${today && !start && !end ? 'text-blue-500 dark:text-blue-400' : ''}
                    `}
                  >
                    {day}
                    {(start || end) && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                    {!isSameStartEnd && (inRange || (start && endDate) || (end && startDate)) && (
                      <span className={`absolute bottom-[5px] h-0.5 bg-blue-400 dark:bg-blue-500 ${
                        start ? 'left-1/2 right-0' : end ? 'left-0 right-1/2' : 'left-0 right-0'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 시간 선택 */}
            <div className="flex gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <TimePicker
                label="시작"
                hour={startHour}
                minute={startMinute}
                onHourChange={setStartHour}
                onMinuteChange={setStartMinute}
              />
              <TimePicker
                label="종료"
                hour={endHour}
                minute={endMinute}
                onHourChange={setEndHour}
                onMinuteChange={setEndMinute}
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              일정을 입력하지 않아도 모임을 생성할 수 있습니다.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold text-lg rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 btn-action btn-action-primary py-4 text-white font-bold text-lg rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <span className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  ) : (
                    '생성하기'
                  )}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 시간 선택 컴포넌트
const TimePicker = ({ label, hour, minute, onHourChange, onMinuteChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const hourRef = React.useRef(null);
  const minuteRef = React.useRef(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 10, 20, 30, 40, 50];

  useEffect(() => {
    if (showPicker) {
      if (hourRef.current) {
        const selectedEl = hourRef.current.querySelector(`[data-value="${hour}"]`);
        if (selectedEl) selectedEl.scrollIntoView({ block: 'center' });
      }
      if (minuteRef.current) {
        const selectedEl = minuteRef.current.querySelector(`[data-value="${minute}"]`);
        if (selectedEl) selectedEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [showPicker, hour, minute]);

  const adjustTime = (delta) => {
    const total = hour * 60 + minute + delta;
    if (total >= 0 && total < 24 * 60) {
      onHourChange(Math.floor(total / 60));
      onMinuteChange(total % 60);
    }
  };

  return (
    <div className="flex-1 text-center relative">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex items-center justify-center gap-2 mt-1">
        <button
          type="button"
          onClick={() => adjustTime(-10)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="text-lg font-medium text-gray-900 dark:text-white w-16 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
        </button>
        <button
          type="button"
          onClick={() => adjustTime(10)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          +
        </button>
      </div>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowPicker(false)} />
          <div className="fixed inset-x-4 bottom-4 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 max-w-sm mx-auto">
            <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{label} 시간</div>
            <div className="flex justify-center gap-2">
              <div
                ref={hourRef}
                className="h-48 w-16 overflow-y-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                <div className="py-20">
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      data-value={h}
                      onClick={() => onHourChange(h)}
                      className={`w-full py-2 text-lg rounded-lg transition-colors ${
                        hour === h
                          ? 'bg-blue-500 text-white font-bold'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {h.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
              <span className="self-center text-2xl text-gray-400">:</span>
              <div
                ref={minuteRef}
                className="h-48 w-16 overflow-y-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="py-20">
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      data-value={m}
                      onClick={() => onMinuteChange(m)}
                      className={`w-full py-2 text-lg rounded-lg transition-colors ${
                        minute === m
                          ? 'bg-blue-500 text-white font-bold'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {m.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="w-full mt-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
            >
              확인
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CreateGatheringPage;
