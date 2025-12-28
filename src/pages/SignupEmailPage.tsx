import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

type Step1Form = {
  userId: string;
  code: string;
  password: string;
  username: string;
  phone: string;
  birthDate: string;
};

function SignupEmailPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Step1Form>({
    userId: '',
    code: '',
    password: '',
    username: '',
    phone: '',
    birthDate: '',
  });
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(true);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhone1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setPhone1(value);
    if (value.length === 3) {
      const nextInput = e.target.nextElementSibling as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handlePhone2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPhone2(value);
    if (value.length === 4) {
      const nextInput = e.target.nextElementSibling as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handlePhone3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPhone3(value);
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Backspace' && e.currentTarget.value === '') {
      if (currentIndex === 2) {
        const prevInput = e.currentTarget.previousElementSibling?.previousElementSibling as HTMLInputElement;
        if (prevInput) prevInput.focus();
      } else if (currentIndex === 1) {
        const prevInput = e.currentTarget.previousElementSibling as HTMLInputElement;
        if (prevInput) prevInput.focus();
      }
    }
  };

  const sendCode = async () => {
    if (!form.userId) {
      setMessage('이메일을 입력하세요.');
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      await api.post(`/auth/signup/email/send-code?email=${encodeURIComponent(form.userId)}`);
      setMessage('인증 코드를 전송했습니다. 메일을 확인하세요.');
      // 새 코드 발송 시 기존 입력 코드 초기화
      setForm((prev) => ({ ...prev, code: '' }));
      setEmailVerified(false);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: { message?: string; error?: string };
        };
        message?: string;
      };
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        '코드 전송에 실패했습니다.';
      setMessage(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!form.userId || !form.code) {
      setMessage('이메일과 코드를 입력하세요.');
      return;
    }
    setVerifying(true);
    setMessage(null);
    try {
      await api.post(`/auth/signup/email/verify-code?email=${encodeURIComponent(form.userId)}`, {
        code: form.code,
      });
      setMessage('이메일 인증이 완료되었습니다.');
      setEmailVerified(true);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: { message?: string; error?: string };
        };
        message?: string;
      };
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        '코드 검증에 실패했습니다.';
      setMessage(errorMessage);
      
      // 이미 사용된 코드나 만료된 코드인 경우, 사용자에게 새 코드 발송 안내
      if (errorMessage.includes('사용된') || errorMessage.includes('만료')) {
        setForm((prev) => ({ ...prev, code: '' }));
      }
    } finally {
      setVerifying(false);
    }
  };

  // 비밀번호 조건 체크 함수
  const checkPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasLetter: /[A-Za-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*]/.test(password),
    };
  };

  const passwordRequirements = checkPasswordRequirements(form.password);

  const submitStep1 = async () => {
    if (!form.userId || !form.password || !form.username) {
      setMessage('이메일, 비밀번호, 이름을 입력하세요.');
      return;
    }

    if (!emailVerified) {
      setMessage('이메일 인증을 완료해주세요.');
      return;
    }
    
    // 비밀번호 확인 검증
    if (form.password !== passwordConfirm) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 조건 검증
    if (!passwordRequirements.minLength || !passwordRequirements.hasLetter || 
        !passwordRequirements.hasNumber || !passwordRequirements.hasSpecialChar) {
      setMessage('비밀번호 조건을 만족해주세요.');
      return;
    }
    
    setSubmitting(true);
    setMessage(null);
    try {
      // 전화번호 합치기
      const phone = phone1 && phone2 && phone3 
        ? `${phone1}${phone2}${phone3}` 
        : undefined;

      const payload = {
        userId: form.userId,
        password: form.password,
        username: form.username,
        phone: phone,
        birthDate: form.birthDate || undefined,
        emailOptIn: emailOptIn,
      };
      const { data } = await api.post('/auth/signup/step1', payload);
      localStorage.setItem('signupUserId', String(data.id));
      localStorage.setItem('signupUserEmail', data.userId);
      setMessage('1단계 완료! 선호 카테고리를 선택하세요.');
      navigate('/signup/categories');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage(error.response?.data?.message || '회원가입 1단계에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: 520 }}>
        <h2 style={{ marginBottom: 12 }}>회원가입 (이메일)</h2>

        <div className="form-group">
          <label>이메일(아이디)</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              name="userId"
              className="input"
              placeholder="이메일을 입력하세요"
              value={form.userId}
              onChange={onChange}
              disabled={emailVerified}
              style={{
                flex: 1,
                backgroundColor: emailVerified ? '#f0f0f0' : undefined,
                cursor: emailVerified ? 'not-allowed' : undefined,
                color: emailVerified ? '#666' : undefined,
              }}
            />
            {emailVerified && (
              <button
                className="btn outline"
                disabled
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderColor: '#28a745',
                  cursor: 'default',
                  whiteSpace: 'nowrap',
                }}
              >
                인증 완료
              </button>
            )}
          </div>
          {emailVerified && (
            <div style={{ color: '#28a745', fontSize: '12px', marginTop: '4px' }}>
              이메일 인증이 완료되었습니다.
            </div>
          )}
        </div>

        {!emailVerified && (
          <>
            <div className="flex space-between">
              <button className="btn outline" onClick={sendCode} disabled={sending || !form.userId}>
                인증 메일 보내기
              </button>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>메일로 받은 6자리 코드</label>
              <div className="flex space-between" style={{ gap: 8 }}>
                <input
                  name="code"
                  className="input"
                  placeholder="6자리 코드"
                  value={form.code}
                  onChange={onChange}
                />
                <button
                  className="btn outline"
                  onClick={verifyCode}
                  disabled={verifying || !form.code}
                >
                  인증 확인
                </button>
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label>비밀번호</label>
          <input
            name="password"
            type="password"
            className="input"
            placeholder="8자 이상, 영문/숫자/특수문자 포함"
            value={form.password}
            onChange={onChange}
          />
          <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>비밀번호 조건:</div>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: passwordRequirements.minLength ? '#28a745' : '#666' }}>
                {passwordRequirements.minLength ? '✓' : '○'} 8자 이상
              </div>
              <div style={{ color: passwordRequirements.hasLetter ? '#28a745' : '#666' }}>
                {passwordRequirements.hasLetter ? '✓' : '○'} 영문 포함
              </div>
              <div style={{ color: passwordRequirements.hasNumber ? '#28a745' : '#666' }}>
                {passwordRequirements.hasNumber ? '✓' : '○'} 숫자 포함
              </div>
              <div style={{ color: passwordRequirements.hasSpecialChar ? '#28a745' : '#666' }}>
                {passwordRequirements.hasSpecialChar ? '✓' : '○'} 특수문자(!@#$% 등) 포함
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>비밀번호 확인</label>
          <input
            type="password"
            className="input"
            placeholder="비밀번호를 다시 입력하세요"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            style={{
              borderColor: passwordConfirm && form.password !== passwordConfirm ? '#dc3545' : undefined,
            }}
          />
          {passwordConfirm && form.password !== passwordConfirm && (
            <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
              비밀번호가 일치하지 않습니다.
            </div>
          )}
          {passwordConfirm && form.password === passwordConfirm && (
            <div style={{ color: '#28a745', fontSize: '12px', marginTop: '4px' }}>
              비밀번호가 일치합니다.
            </div>
          )}
        </div>

        <div className="form-group">
          <label>이름</label>
          <input
            name="username"
            className="input"
            placeholder="이름을 입력하세요"
            value={form.username}
            onChange={onChange}
          />
        </div>

        <div className="form-group">
          <label>전화번호 (선택)</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className="input"
              placeholder="010"
              value={phone1}
              onChange={handlePhone1Change}
              onKeyDown={(e) => handlePhoneKeyDown(e, 0)}
              maxLength={3}
              style={{ width: '80px', textAlign: 'center' }}
            />
            <span style={{ fontSize: '18px', color: '#666' }}>-</span>
            <input
              type="text"
              className="input"
              placeholder="1234"
              value={phone2}
              onChange={handlePhone2Change}
              onKeyDown={(e) => handlePhoneKeyDown(e, 1)}
              maxLength={4}
              style={{ width: '100px', textAlign: 'center' }}
            />
            <span style={{ fontSize: '18px', color: '#666' }}>-</span>
            <input
              type="text"
              className="input"
              placeholder="5678"
              value={phone3}
              onChange={handlePhone3Change}
              onKeyDown={(e) => handlePhoneKeyDown(e, 2)}
              maxLength={4}
              style={{ width: '100px', textAlign: 'center' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>생년월일 (선택)</label>
          <input
            name="birthDate"
            className="input"
            type="date"
            value={form.birthDate}
            onChange={onChange}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={emailOptIn}
              onChange={(e) => setEmailOptIn(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>이메일 수신 동의 (선택)</span>
          </label>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '26px' }}>
            뉴스레터 및 이벤트 정보를 이메일로 받아보실 수 있습니다.
          </div>
        </div>

        <button className="btn" onClick={submitStep1} disabled={submitting}>
          다음 단계(카테고리 선택)
        </button>

        {message && <div className="mt-12 text-center text-muted">{message}</div>}
      </div>
    </div>
  );
}

export default SignupEmailPage;

