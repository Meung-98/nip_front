import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './LandingPage.css';

function LandingPage() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // 로그인 상태 확인
    const accessToken = localStorage.getItem('accessToken');
    const storedUsername = localStorage.getItem('username');
    
    if (accessToken && storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    setUsername(null);
  };

  return (
    <div className="landing">
      <header className="landing__top">
        <div className="logo">Nuzip</div>
        <div className="actions">
          {username ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: '#0f172a' }}>
                {username}님 환영합니다.
              </span>
              <button 
                onClick={handleLogout}
                className="btn outline"
                style={{ margin: 0 }}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn outline">로그인</Link>
              <Link to="/signup" className="btn">회원가입</Link>
            </>
          )}
        </div>
      </header>

      <main className="landing__hero">
        <div className="hero__left">
          <div className="badge">Nuzip Daily Briefing</div>
          <h1>The smartest way to read the news every day.</h1>
          <p>관심 분야만 모아서 매일 아침 전달받으세요.</p>
          <div className="flex mt-12">
            <Link to="/login" className="btn">시작하기</Link>
            <Link to="/signup" className="btn outline">뉴스 피드 확인하기</Link>
          </div>
          <div className="mt-12 text-muted">이미 계정이 있다면? <Link to="/login">로그인</Link></div>
        </div>
        <div className="hero__right">
          <div className="news-card">
            <div className="news-thumb" />
            <div className="news-meta">
              <div className="news-badge">실시간</div>
              <div className="news-title">오늘의 주요 뉴스 브리핑</div>
              <div className="news-tags">#정치 #경제 #증권</div>
            </div>
          </div>
        </div>
      </main>

      <section className="landing__features">
        <h2>아침 5분이면 하루의 뉴스를 파악할 수 있어요.</h2>
        <div className="feature-grid">
          <div className="feature">
            <h3>개인 맞춤 피드</h3>
            <p>선호 카테고리 기반으로 매일 필요한 뉴스만 간략히 확인.</p>
          </div>
          <div className="feature">
            <h3>AI 요약 엔진</h3>
            <p>자동 요약과 요약본 메일 발송으로 빠르게 파악.</p>
          </div>
          <div className="feature">
            <h3>스크랩 & 메모</h3>
            <p>중요한 기사에 메모를 남기고 나만의 리스트로 관리.</p>
          </div>
        </div>
        <div className="cta">
          <div>지금 바로 여러분만의 뉴스 브리핑을 시작해보세요!</div>
          <Link to="/signup" className="btn">가입하기</Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;

