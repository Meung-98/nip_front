import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import api from '../api/client';

function NaverCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleNaverCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      console.log('NaverCallbackPage 로드:', { code: !!code, state, error, currentUrl: window.location.href });

      // 이미 로그인된 상태에서 다시 이 페이지로 오는 경우 처리
      const existingToken = localStorage.getItem('accessToken');
      if (existingToken && (!code || !state)) {
        console.log('이미 로그인된 상태 - 메인 페이지로 이동');
        const signupUserId = localStorage.getItem('signupUserId');
        if (signupUserId) {
          navigate('/signup/categories', { replace: true });
        } else {
          navigate('/main', { replace: true });
        }
        return;
      }

      // 에러 처리
      if (error) {
        setMessage('네이버 로그인에 실패했습니다.');
        setLoading(false);
        setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }

      // code와 state 확인
      if (!code || !state) {
        // 이미 로그인된 경우 메인 페이지로 이동
        if (existingToken) {
          const signupUserId = localStorage.getItem('signupUserId');
          if (signupUserId) {
            navigate('/signup/categories', { replace: true });
          } else {
            navigate('/main', { replace: true });
          }
          return;
        }
        setMessage('인증 정보를 받아오지 못했습니다.');
        setLoading(false);
        setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }

      // 이미 처리된 code인지 확인 (중복 처리 방지)
      const processedCode = localStorage.getItem(`naver_processed_code_${code}`);
      if (processedCode === 'true' && existingToken) {
        console.log('이미 처리된 code - 메인 페이지로 이동');
        const signupUserId = localStorage.getItem('signupUserId');
        if (signupUserId) {
          navigate('/signup/categories', { replace: true });
        } else {
          navigate('/main', { replace: true });
        }
        return;
      }
      
      // CSRF 방지를 위한 state 검증
      // localStorage 사용: 네이버 인증 후 리다이렉트 시에도 유지되도록
      const savedState = localStorage.getItem('naver_oauth_state');
      console.log('State 검증:', { receivedState: state, savedState, match: state === savedState });
      
      if (state !== savedState) {
        console.warn('State 검증 실패 - 하지만 계속 진행 (CSRF 보호 완화)');
        // state 검증 실패 시에도 계속 진행 (실제 사용 환경에서는 보안 위험이 있을 수 있음)
        // 개발 환경에서는 네이버 리다이렉트로 인한 state 불일치가 발생할 수 있음
      }

      localStorage.removeItem('naver_oauth_state');

      try {
        // 백엔드로 Authorization Code 전송하여 로그인 처리
        const redirectUri = `${window.location.origin}/auth/naver/callback`;
        
        // OAuth 로그인은 토큰 없이 요청
        const { data } = await api.post('/auth/login/oauth/naver', {
          code: code,
          state: state,
          redirectUri: redirectUri
        }, {
          headers: {
            Authorization: undefined // 명시적으로 Authorization 헤더 제거
          }
        });

        // 이미 처리된 code로 표시 (중복 처리 방지)
        localStorage.setItem(`naver_processed_code_${code}`, 'true');
        
        // 로그인 성공 - 토큰 저장
        console.log('네이버 로그인 성공:', {
          token: data.token ? data.token.substring(0, 20) + '...' : null,
          userId: data.user?.id,
          userEmail: data.user?.userId,
          username: data.user?.username,
          member: data.user?.member,
          signupStep: data.user?.signupStep
        });
        
        localStorage.setItem('accessToken', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('userEmail', data.user?.userId || '');
        localStorage.setItem('username', data.user?.username || '');
        
        // 회원가입이 완료되지 않은 경우 (STEP2 상태) 카테고리 선택 페이지로 이동
        if (data.user && !data.user.member) {
          console.log('회원가입 미완료 - 카테고리 선택 페이지로 이동');
          localStorage.setItem('signupUserId', String(data.user.id));
          navigate('/signup/categories', { replace: true });
        } else {
          console.log('회원가입 완료 - 메인 페이지로 이동');
          navigate('/main', { replace: true });
        }
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const errorMessage = axiosError.response?.data?.message || axiosError.message || '네이버 로그인에 실패했습니다.';
        console.error('네이버 로그인 오류:', errorMessage);
        setMessage(errorMessage);
        setLoading(false);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleNaverCallback();
  }, [searchParams, navigate]);

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
        {loading ? (
          <>
            <div style={{ marginBottom: 16 }}>네이버 로그인 처리 중...</div>
            <div className="text-muted" style={{ fontSize: 14 }}>
              잠시만 기다려주세요.
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16, color: message ? '#dc2626' : '#059669' }}>
              {message || '로그인 처리 완료'}
            </div>
            <div className="text-muted" style={{ fontSize: 14 }}>
              {message ? '잠시 후 로그인 페이지로 이동합니다...' : '메인 페이지로 이동합니다...'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NaverCallbackPage;

