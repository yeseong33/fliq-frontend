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

function App() {
  const { user, authFlow, initializing, initialize, needsOTPVerification, pendingCredentials } = useAuthStore();
  const location = useLocation();

  // 앱 시작 시 인증 상태 초기화
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 초기화 중일 때 스켈레톤 표시
  if (initializing) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 " />
      </div>
    );
  }

  // 회원가입 계좌 등록 단계에서는 인증 페이지 유지
  const isSignupAccountStep = authFlow === AUTH_FLOW.SIGNUP_ACCOUNT;

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
      {/* 스크롤 가능한 콘텐츠 영역 */}
      <main className="app-content bg-white dark:bg-gray-900">
        <PageTransition>
          <Routes key={location.pathname}>
            <Route
              path="/auth/*"
              element={(!user || isSignupAccountStep) ? <AuthPage /> : <Navigate to="/main" replace />}
            />
            <Route
              path="/main"
              element={user ? <MainPage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/join"
              element={user ? <JoinPage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/gathering/new"
              element={user ? <CreateGatheringPage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/gathering/:id"
              element={user ? <GatheringPage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/gathering/:id/expenses"
              element={user ? <ExpenseListPage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/gathering/:id/settlements"
              element={user ? <SettlementListPage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/gathering/:id/expense/new"
              element={user ? <CreateExpensePage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/gathering/:id/qr"
              element={user ? <QRCodePage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/payment/:gatheringId"
              element={user ? <PaymentPage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/profile"
              element={user ? <ProfilePage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/payment-methods"
              element={user ? <PaymentMethodPage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/payment-methods/add"
              element={user ? <AddPaymentMethodPage /> : <Navigate to="/auth" replace />}
            />
            <Route path="/" element={<Navigate to={user ? "/main" : "/auth"} replace />} />
            <Route path="*" element={<Navigate to={user ? "/main" : "/auth"} replace />} />
          </Routes>
        </PageTransition>
      </main>
      {/* 바텀 네비게이션 - 스크롤 영역 밖 */}
      <BottomNav />
    </GoogleReCaptchaProvider>
    </ErrorBoundary>
  );
}

export default App;