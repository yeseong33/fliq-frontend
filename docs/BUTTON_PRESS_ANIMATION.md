# 버튼 클릭 애니메이션 디자인 가이드

## 개요

버튼 클릭 시 그라데이션이 자연스럽게 퍼지는 애니메이션을 적용하여 사용자가 실제로 버튼을 눌렀다는 피드백을 제공합니다.

---

## 디자인 원칙

### 1. 기본 상태는 단색
- 버튼의 기본 상태는 단순한 단색 배경
- 그라데이션은 인터랙션 시에만 나타남

### 2. 클릭 시 그라데이션 애니메이션
- 가로축 가운데에서 세로로 퍼지는 효과 (`scaleY`)
- 색상 변화는 미세하게 (거의 느껴지지 않을 정도)
- 자연스러운 전환으로 "눌림" 느낌 제공

### 3. 미세한 색상 변화
- 같은 색상 계열 내에서 밝기만 살짝 다르게
- 대비가 크면 어색함 → 미세한 차이가 핵심

---

## 구현 스펙

### Primary 버튼 (파란색)

```css
/* 기본 상태: 단색 */
.action-button.primary {
  background-color: #3B82F6; /* blue-500 */
  color: white;
  box-shadow: 0 10px 15px -3px rgb(59 130 246 / 0.25);
}

/* 그라데이션 오버레이 (pseudo-element) */
.action-button.primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #3B82F6 0%, #4287f5 50%, #3B82F6 100%);
  opacity: 0;
  transform: scaleY(0);
  transform-origin: center;
  transition: transform 0.35s ease-out, opacity 0.15s ease-out;
  border-radius: inherit;
}

/* 클릭 시: 그라데이션 펼침 + 살짝 눌림 */
.action-button.primary:active::before {
  opacity: 1;
  transform: scaleY(1);
}

.action-button.primary:active {
  transform: scale(0.96);
}
```

### 색상 값

| 위치 | 색상 코드 | 설명 |
|------|-----------|------|
| 0% (상단) | `#3B82F6` | blue-500 (기본) |
| 50% (중앙) | `#4287f5` | 살짝 밝은 파란색 |
| 100% (하단) | `#3B82F6` | blue-500 (기본) |

**핵심**: 중앙만 아주 살짝 밝게 하여 미세한 하이라이트 효과

---

## 애니메이션 타이밍

| 속성 | 값 | 설명 |
|------|-----|------|
| transform 전환 | `0.35s` | 그라데이션 펼침 속도 |
| opacity 전환 | `0.15s` | 페이드인 속도 |
| 이징 | `ease-out` | 자연스러운 감속 |
| 버튼 scale | `0.96` | 클릭 시 살짝 눌림 |

---

## 구조

```
┌─────────────────────────────┐
│         버튼 요소            │  ← position: relative
│  ┌───────────────────────┐  │
│  │    ::before 오버레이   │  │  ← 그라데이션, scaleY 애니메이션
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │    아이콘 + 텍스트     │  │  ← z-index: 1 (오버레이 위에)
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### 필수 속성

```css
.action-button {
  position: relative;    /* ::before 기준점 */
  overflow: hidden;      /* 애니메이션 영역 제한 */
}

.action-button > * {
  position: relative;
  z-index: 1;            /* 콘텐츠가 오버레이 위에 */
}
```

---

## 애니메이션 방향 옵션

### 세로 펼침 (현재 적용)
```css
transform: scaleY(0) → scaleY(1);
background: linear-gradient(180deg, ...);
```
가로축 가운데에서 위아래로 퍼짐

### 가로 펼침
```css
transform: scaleX(0) → scaleX(1);
background: linear-gradient(90deg, ...);
```
세로축 가운데에서 좌우로 퍼짐

### 중앙 펼침
```css
transform: scale(0) → scale(1);
background: radial-gradient(circle, ...);
```
중앙에서 모든 방향으로 퍼짐

---

## 적용 예시

### MainPage - 모임 만들기 버튼

```jsx
<button
  className="action-button primary"
  onClick={handleCreateClick}
>
  <Plus size={24} />
  <span>모임 만들기</span>
</button>
```

---

## 접근성 고려

```css
/* 모션 감소 선호 사용자 */
@media (prefers-reduced-motion: reduce) {
  .action-button::before {
    transition: none !important;
  }
  .action-button:active {
    transform: none !important;
  }
}
```

---

## 체크리스트

- [x] 기본 상태: 단색 배경
- [x] 클릭 시: 그라데이션 펼침 애니메이션
- [x] 미세한 색상 변화 (같은 계열)
- [x] 세로 방향 펼침 (scaleY)
- [x] 버튼 눌림 효과 (scale 0.96)
- [x] 콘텐츠 z-index 처리
- [x] 다크모드 대응
- [ ] 모션 감소 미디어 쿼리 적용
