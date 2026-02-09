# Fliq 버튼 컴포넌트 목록

## 버튼 디자인 시스템

### 기본 동작
- **기본 상태**: 단색 배경, 그림자 없음
- **클릭 시**: 세로로 펼쳐지는 미세한 그라데이션 애니메이션 (0.05s) + 그림자(0.1 투명도)
- **로딩 상태**: 점 3개가 순차적으로 깜빡이는 애니메이션 (`loading-dots`)

### 색상 값
| 색상 | 기본 | 그라데이션 중간 |
|------|------|----------------|
| Primary (파란색) | `#2563EB` (blue-600) | `#2968EC` |
| Success (녹색) | `#22C55E` | `#4ade80` |
| Danger (빨간색) | `#EF4444` | `#f87171` |

### CSS 클래스
| 클래스 | 용도 | 색상 |
|--------|------|------|
| `btn-action btn-action-primary` | 대형 액션 버튼 | 파란색 (#2563EB) |
| `btn-action btn-action-success` | 완료/확인 버튼 | 녹색 (#22C55E) |
| `btn-press btn-press-primary` | 일반 버튼 | 파란색 |
| `btn-press btn-press-secondary` | 보조 버튼 | 흰색/회색 |
| `btn-press btn-press-danger` | 위험/삭제 버튼 | 빨간색 |
| `btn-press btn-press-success` | 성공 버튼 | 녹색 |
| `btn-press btn-press-ghost` | 투명 버튼 | 투명 |
| `btn-press btn-press-outline` | 테두리 버튼 | 투명+테두리 |
| `action-button primary` | 메인 페이지 큰 버튼 | 파란색 |
| `action-button secondary` | 메인 페이지 보조 버튼 | 흰색 |
| `btn-fab` | 플로팅 액션 버튼 | 파란색 |

### 로딩 애니메이션
```html
<span className="loading-dots ml-1">
  <span></span>
  <span></span>
  <span></span>
</span>
```

---

## 버튼 위치별 목록

### 인증 (Auth)

#### LoginForm.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 로그인 | `btn-action btn-action-primary` | Passkey 로그인 |
| Passkey를 분실하셨나요? | 텍스트 링크 | 복구 페이지 이동 |
| 회원가입 | 텍스트 링크 | 회원가입 페이지 이동 |

#### SignupForm.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 인증번호 받기 | `btn-action btn-action-primary` | OTP 발송 |
| 로그인 | 텍스트 링크 | 로그인 페이지 이동 |

#### OTPVerification.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 인증 확인 | `btn-action btn-action-primary` | OTP 검증 |
| 이전 | 회색 버튼 | 이전 단계 |
| 재발송 | 회색 버튼 | OTP 재발송 |

#### PasskeyRegistration.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| Passkey 등록하기 | `btn-action btn-action-primary` | Passkey 등록 |
| 다시 시도 | `btn-action btn-action-primary` | 재시도 |
| 취소 | 회색 버튼 | 취소 |

#### RecoveryForm.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 인증번호 받기 | `btn-action btn-action-primary` | 복구 OTP 발송 |
| 로그인으로 돌아가기 | 텍스트 링크 | 로그인 페이지 |

#### SignupAccountStep.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 계좌 등록하기 | `btn-action btn-action-primary` | 계좌 등록 폼 이동 |
| 등록하고 계속하기 | `btn-action btn-action-primary` | 계좌 등록 제출 |
| 나중에 할게요 / 건너뛰기 | 텍스트 버튼 | 스킵 |

---

### 메인 (Main)

#### MainPage.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 모임 만들기 | `action-button primary` | 모임 생성 모달 |
| 모임 참여 | `action-button secondary` | QR 스캐너 |
| 새로고침 | `Button (secondary, sm)` | 목록 새로고침 |

---

### 모임 (Gathering)

#### GatheringDetail.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 송금 | `btn-action btn-action-primary` | 순차 송금 시작 |
| 수령 확인 | `btn-action btn-action-success` | 순차 수령 확인 |
| + (플로팅) | `btn-fab` | 비용 추가 모달 |

---

### 결제 (Payment)

#### SequentialTransfer.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| {금액}원 송금하기 | `btn-action btn-action-primary` | 토스 딥링크 |
| 송금 완료했어요 | `btn-action btn-action-success` | 송금 완료 처리 |
| 다음에 할게요 | 텍스트 버튼 | 건너뛰기 |
| 닫기 | 회색 버튼 | 모달 닫기 |

#### SequentialConfirm.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 수령 확인 | `btn-action btn-action-success` | 수령 확인 |
| 송금 받지 못했어요 | 빨간 텍스트 버튼 | 거부 |
| 건너뛰기 | 텍스트 버튼 | 건너뛰기 |
| 닫기 | 회색 버튼 | 모달 닫기 |

#### PaymentHistory.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 전체 송금 | `btn-press btn-press-primary` | 전체 송금 시작 |
| 송금하기 | 파란 버튼 | 개별 송금 |
| 수령확인 | 녹색 버튼 | 개별 수령 확인 |

---

### 공통 (Common)

#### Button.jsx (공통 컴포넌트)
| Variant | 클래스 | 용도 |
|---------|--------|------|
| primary | `btn-press-primary` | 기본 액션 |
| secondary | `btn-press-secondary` | 보조 액션 |
| danger | `btn-press-danger` | 삭제/위험 |
| success | `btn-press-success` | 성공/확인 |
| ghost | `btn-press-ghost` | 투명 배경 |
| outline | `btn-press-outline` | 테두리만 |

#### AccountRequiredModal.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 계좌 등록하기 | `btn-action btn-action-primary` | 폼으로 이동 |
| 등록 완료 | `btn-action btn-action-primary` | 계좌 등록 제출 |
| 이전 | 텍스트 버튼 | 이전 단계 |

---

### 프로필 (Profile)

#### ProfilePage.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 저장 | `Button (primary)` | 이름 변경 저장 |
| 취소 | `Button (secondary)` | 모달 닫기 |
| 탈퇴하기 | `Button (danger)` | 회원 탈퇴 |
| 로그아웃 | 빨간 텍스트 | 로그아웃 |

#### PaymentMethodPage.jsx
| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 계좌 추가 | `Button (primary, lg)` | 계좌 추가 모달 |
| 등록 | `Button (primary)` | 계좌 등록 |
| 취소 | `Button (secondary)` | 모달 닫기 |

---

## 총 버튼 수

- **인증 관련**: 약 15개
- **메인/모임**: 약 6개
- **결제 관련**: 약 10개
- **프로필/설정**: 약 6개
- **합계**: 약 37개 버튼
