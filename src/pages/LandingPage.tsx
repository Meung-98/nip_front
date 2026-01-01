import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import api from '../api/client';
import './LandingPage.css';

interface NewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NewsResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NewsItem[];
}

function LandingPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 로그인 상태 확인 및 뉴스 가져오기
    const accessToken = localStorage.getItem('accessToken');
    const storedUsername = localStorage.getItem('username');
    
    if (accessToken && storedUsername) {
      setUsername(storedUsername);
      fetchNews();
    }
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      // 카테고리 상관없이 일반 뉴스 가져오기 (8개)
      const newsResponse = await api.get<NewsResponse>('/news', {
        params: {
          category: '뉴스',
          display: 8
        }
      });
      setNewsItems(newsResponse.data.items || []);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      console.error('뉴스 가져오기 실패:', axiosError.response?.data?.message || axiosError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    setUsername(null);
    setNewsItems([]);
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
          {!username && (
            <>
              <div className="flex mt-12">
                <Link to="/login" className="btn">시작하기</Link>
                <Link to="/signup" className="btn outline">뉴스 피드 확인하기</Link>
              </div>
              <div className="mt-12 text-muted">이미 계정이 있다면? <Link to="/login">로그인</Link></div>
            </>
          )}
          {username && (
            <div className="mt-12">
              {loading ? (
                <div className="text-muted">뉴스를 불러오는 중...</div>
              ) : newsItems.length > 0 ? (
                <div className="news-list">
                  <h2 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 600 }}>오늘의 헤드라인</h2>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px'
                  }}>
                    {newsItems.map((item, index) => (
                      <a
                        key={index}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: '20px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          backgroundColor: '#ffffff',
                          height: '100%'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: '#0f172a',
                            lineHeight: '1.4',
                            minHeight: '50px'
                          }}
                          dangerouslySetInnerHTML={{ __html: item.title }}
                        />
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#94a3b8', 
                          marginTop: 'auto',
                          paddingTop: '12px',
                          borderTop: '1px solid #f1f5f9'
                        }}>
                          {new Date(item.pubDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-muted">뉴스가 없습니다.</div>
              )}
            </div>
          )}
        </div>
        {!username && (
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
        )}
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

