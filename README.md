==# PayMeBack Frontend 🎨

React 기반 웹 애플리케이션

## 📋 프로젝트 개요

PayMeBack의 프론트엔드 웹 애플리케이션입니다. React와 Tailwind CSS를 사용하여 현대적이고 반응형 UI를 제공합니다.

## 🛠️ 기술 스택

- **Framework**: React 18
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **QR Code**: qrcode.js

## 🏗️ 프로젝트 구조

```
src/
├── components/           # 재사용 가능한 컴포넌트
│   ├── auth/            # 인증 관련 컴포넌트
│   ├── common/          # 공통 UI 컴포넌트
│   ├── gathering/       # 모임 관련 컴포넌트
│   └── payment/         # 결제 관련 컴포넌트
├── contexts/            # React Context
├── hooks/               # 커스텀 훅
├── pages/               # 페이지 컴포넌트
├── services/            # API 서비스
├── store/               # 상태 관리 스토어
└── utils/               # 유틸리티 함수
```

## 🚀 실행 방법

### 개발 환경 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 린팅
npm run lint
```

## 🎨 UI/UX 특징

### 디자인 시스템
- **컬러 팔레트**: 현대적인 블루 톤 메인 컬러
- **타이포그래피**: 가독성 높은 폰트 계층
- **레이아웃**: 모바일 퍼스트 반응형 디자인
- **애니메이션**: 부드러운 트랜지션과 상호작용

### 주요 컴포넌트
- **Button**: 다양한 스타일과 크기 지원
- **Input**: 폼 검증과 에러 처리
- **Modal**: 접근성을 고려한 모달 창
- **Loading**: 로딩 상태 표시
- **ThemeToggle**: 다크/라이트 모드 전환

## 📱 페이지 구성

### 인증 페이지 (`/auth`)
- 로그인/회원가입 폼
- OTP 인증
- 소셜 로그인 (향후 추가)

### 메인 페이지 (`/`)
- 대시보드
- 최근 모임 목록
- 빠른 액션 버튼

### 모임 페이지 (`/gatherings`)
- 모임 목록 조회
- 모임 생성/수정
- QR코드 스캔/표시
- 참가자 관리

### 결제 페이지 (`/payments`)
- 결제 내역 조회
- 정산 현황
- 결제 요청/처리

## 🔧 주요 기능

### 상태 관리
```javascript
// Zustand를 사용한 전역 상태 관리
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: (userData) => set({ user: userData, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false })
}))
```

### API 통신
```javascript
// Axios 인터셉터를 통한 토큰 관리
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 반응형 디자인
- 모바일: 360px ~ 767px
- 태블릿: 768px ~ 1023px
- 데스크톱: 1024px 이상

## 🎯 핵심 훅

### useAuth
사용자 인증 상태 관리

```javascript
const { user, login, logout, isLoading } = useAuth()
```

### useGathering
모임 관련 기능

```javascript
const { gatherings, createGathering, joinGathering } = useGathering()
```

### usePayment
결제 관련 기능

```javascript
const { payments, createPaymentRequest, processPayment } = usePayment()
```

### useTheme
테마 관리

```javascript
const { theme, toggleTheme } = useTheme()
```

## 🔒 보안

- JWT 토큰 자동 갱신
- XSS 방지를 위한 입력값 검증
- HTTPS 강제 리다이렉트 (프로덕션)
- 민감 정보 로컬 스토리지 암호화

## 📋 환경 변수

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=PayMeBack
VITE_ENABLE_DEVTOOLS=true
```

## 🧪 테스트

```bash
# 단위 테스트 실행
npm run test

# 테스트 커버리지
npm run test:coverage

# E2E 테스트 (Cypress)
npm run test:e2e
```

## 📦 빌드 최적화

- **코드 스플리팅**: 페이지별 청크 분리
- **트리 셰이킹**: 사용하지 않는 코드 제거
- **이미지 최적화**: WebP 포맷 지원
- **번들 사이즈**: 분석 및 최적화

## 🚀 배포

```bash
# Vercel 배포
npm run deploy:vercel

# Netlify 배포
npm run deploy:netlify

# Docker 배포
docker build -t paymeback-frontend .
docker run -p 3000:3000 paymeback-frontend
```

## 🤝 기여하기

1. 새로운 기능 브랜치 생성
2. ESLint/Prettier 규칙 준수
3. 컴포넌트 Storybook 작성
4. 접근성 가이드라인 준수
5. PR 생성

## 📞 문의

- **개발자**: [yeseong33](https://github.com/yeseong33)
- **이슈**: [GitHub Issues](https://github.com/yeseong33/paymeback-frontend/issues)
- **디자인**: Figma (링크 추가 예정)