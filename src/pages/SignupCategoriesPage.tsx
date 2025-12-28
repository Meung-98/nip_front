import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

type Category = { id: number; name: string };

const fallbackCategories: Category[] = [
  { id: 1, name: '정치' },
  { id: 2, name: '경제' },
  { id: 3, name: '사회' },
  { id: 4, name: '생활·문화' },
  { id: 5, name: 'IT·과학' },
  { id: 6, name: '세계' },
  { id: 7, name: '엔터' },
  { id: 8, name: '스포츠' },
];

function SignupCategoriesPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const userId = useMemo(() => {
    const fromParam = search.get('userId');
    const stored = localStorage.getItem('signupUserId');
    return fromParam || stored;
  }, [search]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data.map((c: any) => ({ id: c.categoryId ?? c.id, name: c.name || c.code })));
        }
      } catch {
        // fallback 사용
      }
    };
    fetchCategories();
  }, []);

  const toggle = (id: number) => {
    setSelected((prev) => {
        if (prev.includes(id)) return prev.filter((v) => v !== id);
        if (prev.length >= 3) return prev; // 최대 3개
        return [...prev, id];
    });
  };

  const submit = async () => {
    if (!userId) {
      setMessage('사용자 ID를 찾을 수 없습니다. 1단계를 다시 진행하세요.');
      return;
    }
    if (selected.length === 0 || selected.length > 3) {
      setMessage('카테고리를 1~3개 선택해 주세요.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await api.post(`/auth/signup/${userId}/step2`, { categoryIds: selected });
      setMessage('가입이 완료되었습니다!');
      localStorage.removeItem('signupUserId');
      navigate('/login');
    } catch (err: any) {
      setMessage(err.response?.data?.message || '카테고리 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginBottom: 8 }}>관심 카테고리 선택</h2>
        <p className="text-muted">정확히 3개까지 선택할 수 있습니다.</p>
        <div className="category-grid" style={{ marginTop: 16 }}>
          {categories.map((c) => {
            const active = selected.includes(c.id);
            return (
              <button
                key={c.id}
                className={`category-chip ${active ? 'active' : ''}`}
                onClick={() => toggle(c.id)}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        <div className="text-muted mt-12">선택: {selected.length} / 3</div>
        <button className="btn mt-20" disabled={loading} onClick={submit}>
          가입 완료
        </button>
        {message && <div className="mt-12 text-center text-muted">{message}</div>}
      </div>
    </div>
  );
}

export default SignupCategoriesPage;

