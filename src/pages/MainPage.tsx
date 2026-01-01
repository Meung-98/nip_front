import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import api from '../api/client';
import './LandingPage.css';

interface Category {
  id: number;
  code: string;
  name: string;
  enabled: boolean;
}

interface UserResponse {
  id: number;
  userId: string;
  username: string;
  member: boolean;
  categories: Category[];
}

interface NewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  image?: string;  // 뉴스 이미지 URL
  pubDate: string;
}

interface NewsResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NewsItem[];
}

function MainPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newsByCategory, setNewsByCategory] = useState<Map<string, NewsItem[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 로그인 상태 확인
    const accessToken = localStorage.getItem('accessToken');
    const storedUsername = localStorage.getItem('username');
    
    if (!accessToken) {
      navigate('/login');
      return;
    }
    
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 현재 로그인한 사용자 정보 가져오기
      const userResponse = await api.get<UserResponse>('/auth/me');
      const user = userResponse.data;
      
      if (!user.member) {
        // 회원가입이 완료되지 않은 경우 카테고리 선택 페이지로 이동
        navigate('/signup/categories');
        return;
      }
      
      if (user.categories && user.categories.length > 0) {
        setCategories(user.categories);
        // 각 카테고리별로 뉴스 가져오기 (비동기로 처리하여 실패해도 페이지는 표시)
        fetchNewsForCategories(user.categories);
      } else {
        // 카테고리가 없는 경우 로딩 완료
        setLoading(false);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      console.error('사용자 정보 가져오기 실패:', axiosError.response?.data?.message || axiosError.message);
      // 인증 오류인 경우 로그인 페이지로 이동
      if (axiosError.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError('사용자 정보를 불러올 수 없습니다.');
      setLoading(false);
    }
  };

  const fetchNewsForCategories = async (userCategories: Category[]) => {
    const newsMap = new Map<string, NewsItem[]>();
    
    try {
      // 각 카테고리별로 뉴스 가져오기 (병렬 처리)
      // Promise.allSettled를 사용하여 일부 실패해도 성공한 항목은 처리
      const promises = userCategories.map(async (category) => {
        try {
          const newsResponse = await api.get<NewsResponse>('/news', {
            params: {
              category: category.name,
              display: 3
            }
          });
          
          if (newsResponse.data.items && newsResponse.data.items.length > 0) {
            // API 응답 확인용 로그
            console.log(`카테고리 ${category.name} 뉴스 응답 샘플:`, {
              title: newsResponse.data.items[0].title,
              image: newsResponse.data.items[0].image,
              link: newsResponse.data.items[0].link,
              originallink: newsResponse.data.items[0].originallink
            });
            newsMap.set(category.name, newsResponse.data.items);
          }
          return { category: category.name, success: true };
        } catch (err) {
          const axiosError = err as AxiosError<{ message?: string }>;
          console.error(`카테고리 ${category.name} 뉴스 가져오기 실패:`, axiosError.response?.data?.message || axiosError.message);
          // 개별 카테고리 실패는 무시하고 계속 진행
          return { category: category.name, success: false };
        }
      });
      
      await Promise.allSettled(promises);
      setNewsByCategory(newsMap);
      setLoading(false); // 뉴스 로딩 완료 후 로딩 상태 해제
    } catch (err) {
      console.error('뉴스 가져오기 실패:', err);
      // 뉴스 로딩 실패해도 페이지는 표시
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="landing">
        <div className="page-container" style={{ textAlign: 'center', padding: '48px' }}>
          <div className="text-muted">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing">
      <header className="landing__top">
        <div className="logo">Nuzip</div>
        <div className="actions">
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
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px', color: '#0f172a' }}>
          나의 뉴스 피드
        </h1>

        {error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fee2e2', 
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
            선호 카테고리가 없습니다. 카테고리를 선택해주세요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {categories.map((category) => {
              const newsItems = newsByCategory.get(category.name) || [];
              
              return (
                <div key={category.id} style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px',
                  padding: '24px',
                  backgroundColor: '#ffffff'
                }}>
                  <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 600, 
                    marginBottom: '20px',
                    color: '#0f172a',
                    borderBottom: '2px solid #3b82f6',
                    paddingBottom: '12px'
                  }}>
                    {category.name}
                  </h2>
                  
                  {newsItems.length === 0 ? (
                    <div style={{ color: '#94a3b8', padding: '16px', textAlign: 'center' }}>
                      뉴스를 불러올 수 없습니다.
                    </div>
                  ) : (
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
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            backgroundColor: '#f8fafc'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                        >
                          {item.image && item.image.trim() !== '' && (
                            <img
                              src={item.image}
                              alt=""
                              style={{
                                width: '100%',
                                height: '180px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                marginBottom: '12px',
                                backgroundColor: '#f1f5f9'
                              }}
                              onError={(e) => {
                                // 이미지 로드 실패 시 숨김
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default MainPage;

