import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { useAuthStore } from './store/authStore';
import { RECAPTCHA, AUTH_FLOW } from './utils/constants';
import ErrorBoundary from './components/common/ErrorBoundary';
import PageTransition from './components/common/PageTransition';
import BottomNav from './components/common/BottomNav';
import AuthPage from './pages/AuthPage';
import MainPage from './pages/MainPage';
import JoinPage from './pages/JoinPage';
import CreateGatheringPage from './pages/CreateGatheringPage';
import GatheringPage from './pages/GatheringPage';
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';
import PaymentMethodPage from './pages/PaymentMethodPage';
import AddPaymentMethodPage from './pages/AddPaymentMethodPage';
import CreateExpensePage from './pages/CreateExpensePage';
import QRCodePage from './pages/QRCodePage';
import ExpenseListPage from './pages/ExpenseListPage';
import SettlementListPage from './pages/SettlementListPage';
import ConsentRequiredPage from './pages/ConsentRequiredPage';
import ConsentManagePage from './pages/ConsentManagePage';

// returnUrl 검증: Open Redirect 방지
const isSafeReturnUrl = (url) =>
  typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\');

// 비로그인 시 /auth로 리다이렉트하면서 returnUrl을 쿼리 파라미터로 전달
const RedirectToAuth = () => {
  const returnUrl = window.location.pathname + window.location.search;
  const needsReturn = isSafeReturnUrl(returnUrl) && returnUrl !== '/' && returnUrl !== '/auth' && returnUrl !== '/main';
  const authPath = needsReturn
    ? `/auth?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/auth';
  return <Navigate to={authPath} replace />;
};

// 로그인 완료 후 URL의 returnUrl 파라미터로 복귀
const RedirectFromAuth = () => {
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl');
  const target = isSafeReturnUrl(returnUrl) ? returnUrl : '/main';
  return <Navigate to={target} replace />;
};

function App() {
  const { user, authFlow, initializing, initialize, needsOTPVerification, pendingCredentials, consentChecked, needsConsent } = useAuthStore();
  const location = useLocation();

  // 앱 시작 시 인증 상태 초기화
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 초기화 중일 때 스켈레톤 표시
  if (initializing) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-500 animate-pulse">
          Fliq
        </h1>
      </div>
    );
  }

  // 회원가입 계좌 등록 단계에서는 인증 페이지 유지
  const isSignupAccountStep = authFlow === AUTH_FLOW.SIGNUP_ACCOUNT;

  // 기존 사용자 필수 약관 미동의 시 동의 페이지 표시
  const showConsentRequired = user && !consentChecked && needsConsent && !isSignupAccountStep;

  // OTP 인증이 필요하고 현재 인증 페이지가 아닐 때
  if (needsOTPVerification && location.pathname !== '/auth') {
    return (
      <Navigate 
        to="/auth" 
        replace 
        state={{
          view: 'otp',
          email: pendingCredentials?.email,
          mode: 'signin'
        }} 
      />
    );
  }

  return (
    <ErrorBoundary>
    <GoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA.V3_SITE_KEY}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#4aed88',
            },
          },
          error: {
            duration: 3000,
            theme: {
              primary: '#ff4b4b',
            },
          },
        }}
      />
      {/* 기존 사용자 필수 약관 미동의 시 동의 페이지 */}
      {showConsentRequired ? (
        <main className="app-content bg-white dark:bg-gray-900 app-fade-in">
          <ConsentRequiredPage />
        </main>
      ) : (
      <>
      {/* 스크롤 가능한 콘텐츠 영역 */}
      <main className="app-content bg-white dark:bg-gray-900 app-fade-in">
        <PageTransition>
          <Routes key={location.pathname}>
            <Route
              path="/auth/*"
              element={(!user || isSignupAccountStep) ? <AuthPage /> : <RedirectFromAuth />}
            />
            <Route
              path="/main"
              element={user ? <MainPage /> : <RedirectToAuth />}
            />
            <Route
              path="/join"
              element={user ? <JoinPage /> : <RedirectToAuth />}
            />
            <Route
              path="/gathering/new"
              element={user ? <CreateGatheringPage /> : <RedirectToAuth />}
            />
            <Route
              path="/gathering/:id"
              element={user ? <GatheringPage /> : <RedirectToAuth />}
            />
            <Route
              path="/gathering/:id/expenses"
              element={user ? <ExpenseListPage /> : <RedirectToAuth />}
            />
            <Route
              path="/gathering/:id/settlements"
              element={user ? <SettlementListPage /> : <RedirectToAuth />}
            />
            <Route
              path="/gathering/:id/expense/new"
              element={user ? <CreateExpensePage /> : <RedirectToAuth />}
            />
            <Route
              path="/gathering/:id/qr"
              element={user ? <QRCodePage /> : <RedirectToAuth />}
            />
            <Route
              path="/payment/:gatheringId"
              element={user ? <PaymentPage /> : <RedirectToAuth />}
            />
            <Route
              path="/profile"
              element={user ? <ProfilePage /> : <RedirectToAuth />}
            />
            <Route
              path="/payment-methods"
              element={user ? <PaymentMethodPage /> : <RedirectToAuth />}
            />
            <Route
              path="/payment-methods/add"
              element={user ? <AddPaymentMethodPage /> : <RedirectToAuth />}
            />
            <Route
              path="/consent-manage"
              element={user ? <ConsentManagePage /> : <RedirectToAuth />}
            />
            <Route path="/" element={<Navigate to={user ? "/main" : "/auth"} replace />} />
            <Route path="*" element={<Navigate to={user ? "/main" : "/auth"} replace />} />
          </Routes>
        </PageTransition>
      </main>
      {/* 바텀 네비게이션 - 스크롤 영역 밖 */}
      <BottomNav />
      </>
      )}
    </GoogleReCaptchaProvider>
    </ErrorBoundary>
  );
}

export default App;