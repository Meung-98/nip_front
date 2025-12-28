import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import api from '../api/client';

// Google Identity Services 타입 정의
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, config: {
            type: string;
            size: string;
            text: string;
            theme: string;
            width: string;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

type LoginForm = {
  userId: string;
  password: string;
};

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ userId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const hiddenGoogleButtonRef = useRef<HTMLDivElement>(null);
  
  // Google Client ID (환경변수로 관리하는 것이 좋지만, 일단 하드코딩)
  const GOOGLE_CLIENT_ID = '686156856290-je71ac5ub92p4n6viuu3jh3qpsnvom3p.apps.googleusercontent.com';

  const getErrorMessage = (err: unknown, fallback: string) => {
    const axiosErr = err as AxiosError<{ message?: string }>;
    return axiosErr.response?.data?.message ?? fallback;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userEmail', form.userId);
      navigate('/');
    } catch (err) {
      setMessage(getErrorMessage(err, '로그인에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // Google ID 토큰으로 로그인 처리
  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        provider: 'OAUTH_GOOGLE',
        idToken: credential,
      };
      const { data } = await api.post('/auth/login/oauth', payload);
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userEmail', data.user?.userId || '');
      
      // 회원가입이 완료되지 않은 경우 (STEP2 상태) 카테고리 선택 페이지로 이동
      if (data.user && !data.user.member) {
        navigate('/signup/categories');
      } else {
        navigate('/');
      }
    } catch (err) {
      setMessage(getErrorMessage(err, 'Google 로그인에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // Google Identity Services 초기화
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && hiddenGoogleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            handleGoogleCredential(response.credential);
          },
        });

        // 숨겨진 Google 버튼 렌더링
        window.google.accounts.id.renderButton(hiddenGoogleButtonRef.current, {
          type: 'standard',
          size: 'large',
          text: 'signin_with',
          theme: 'outline',
          width: '100%',
        });
      }
    };

    // Google 스크립트가 로드될 때까지 대기
    const checkGoogleScript = setInterval(() => {
      if (window.google) {
        clearInterval(checkGoogleScript);
        initializeGoogleSignIn();
      }
    }, 100);

    // 10초 후 타임아웃
    setTimeout(() => {
      clearInterval(checkGoogleScript);
    }, 10000);

    return () => {
      clearInterval(checkGoogleScript);
    };
  }, []);

  // 커스텀 Google 로그인 버튼 클릭 핸들러
  const handleCustomGoogleLogin = () => {
    if (hiddenGoogleButtonRef.current) {
      // 숨겨진 Google 버튼 클릭
      const hiddenButton = hiddenGoogleButtonRef.current.querySelector('div[role="button"]') as HTMLElement;
      if (hiddenButton) {
        hiddenButton.click();
      } else {
        // 버튼이 아직 렌더링되지 않은 경우
        setMessage('Google 로그인을 준비하는 중입니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: 420 }}>
        {/* Nip 로고 */}
        <div className="text-center" style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 16 }}>
            Nip
          </div>
          <div className="text-muted" style={{ fontSize: 14, lineHeight: '1.5' }}>
            이메일과 비밀번호로 로그인하거나, 구글 계정으로 간편하게 시작하세요.
          </div>
        </div>

        {/* 이메일 입력 */}
        <div className="form-group">
          <label>이메일(아이디)</label>
          <input
            name="userId"
            className="input"
            placeholder="이메일을 입력하세요"
            value={form.userId}
            onChange={onChange}
          />
        </div>

        {/* 비밀번호 입력 */}
        <div className="form-group">
          <label>비밀번호</label>
          <input
            name="password"
            type="password"
            className="input"
            placeholder="비밀번호를 입력하세요"
            value={form.password}
            onChange={onChange}
          />
        </div>

        {/* Nip 로그인 버튼 */}
        <button className="btn" onClick={handleLogin} disabled={loading} style={{ width: '100%', marginBottom: 16 }}>
          Nip 로그인
        </button>

        {/* 회원가입 링크 */}
        <div className="text-center text-muted" style={{ marginBottom: 24, fontSize: 14 }}>
          아직 계정이 없으신가요?{' '}
          <Link to="/signup" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
            회원가입 바로가기
          </Link>
        </div>

        {/* 구분선 */}
        <div className="divider-with-text" style={{ marginBottom: 24 }}>
          <span className="text-muted" style={{ fontSize: 13 }}>다른 계정으로 로그인</span>
        </div>

        {/* Google 로그인 버튼 */}
        <div className="text-center">
          {/* 숨겨진 Google 버튼 (실제 로그인 기능) */}
          <div 
            ref={hiddenGoogleButtonRef}
            style={{ 
              display: 'none'
            }}
          />
          {/* 커스텀 Google 로고 버튼 */}
          <button
            className="google-login-btn"
            onClick={handleCustomGoogleLogin}
            disabled={loading}
            type="button"
            title="Google로 로그인"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '1px solid #dadce0',
              backgroundColor: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              padding: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fillRule="evenodd">
                <path
                  d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.711c-.18-.54-.282-1.117-.282-1.711s.102-1.171.282-1.711V4.957H.957C.347 6.174 0 7.55 0 9s.348 2.826.957 4.043l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.957L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </g>
            </svg>
          </button>
        </div>

        {/* 도움말/에러 메시지 */}
        <div className="text-center text-muted" style={{ marginTop: 24, fontSize: 12 }}>
          {message ? (
            <div style={{ color: '#dc2626', marginBottom: 8 }}>{message}</div>
          ) : (
            <>
              문제 발생 시{' '}
              <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>
                메인
              </Link>
              으로 돌아가 다시 시도하세요.
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

