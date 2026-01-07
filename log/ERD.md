# nip_users
PK: id
cols: userId(unique, 이메일), password, username, birthDate, phone, signupStep, provider, status, emailVerified, emailOptIn, suspendedUntil, suspensionReason, createdAt(있다면), etc.
rel: 1:N refresh_tokens, M:N user_roles, M:N user_categories

# roles
PK: id
cols: roleName(예: ROLE_USER)
rel: M:N user_roles

# user_roles (조인 테이블)
PK: (composite) user_id, role_id
FK: user_id → nip_users.id, role_id → roles.id

# categories
PK: category_id
cols: code, name, sortOrder, enabled
rel: M:N user_categories

# user_categories (조인 테이블)
PK: (composite) user_id, category_id
FK: user_id → nip_users.id, category_id → categories.category_id
note: 회원가입 2단계 선호 카테고리(최대 3개)

# refresh_tokens
PK: id
cols: token(unique), user_id, expiresAt, revoked, createdAt
FK: user_id → nip_users.id
note: 현재 동시성 오류 방지를 위해 로그인 시 기존 토큰을 즉시 삭제/갱신하지 않고 신규 발급만 함

# email_verification_tokens
PK: id
cols: email, code, expiresAt, createdAt, consumed
rel: 이메일 인증/재발송 쿨다운 관리 (user FK는 없음, 이메일 문자열 기반)

기타 참고
Naver/Google/Kakao OAuth: nip_users.provider 필드로 구분, 소셜 신규 유입 시 signupStep을 STEP2로 두고 카테고리 선택 후 COMPLETE 전환.
SecurityConfig에서 /api/auth/**, /api/ai/**, /api/categories 등 경로는 permitAll, 나머지 JWT 인증.