import { Link, useNavigate } from 'react-router-dom';

function SignupChoicePage() {
  const navigate = useNavigate();
  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>회원가입 방법 선택</h2>
        <p className="text-muted" style={{ marginBottom: 20 }}>
          Nuzip은 두 가지 방식으로 회원가입할 수 있습니다.
        </p>
        <div className="flex" style={{ flexDirection: 'column', gap: 12 }}>
          <button className="btn outline" onClick={() => navigate('/signup/email')}>
            이메일로 회원가입
          </button>
          <button className="btn outline" onClick={() => navigate('/login')}>
            이미 계정이 있다면? 로그인
          </button>
        </div>
        <div className="text-muted mt-12">
          Google 계정으로 가입하려면 <Link to="/login">로그인 페이지</Link>에서 Google 로그인을 사용하세요.
        </div>
      </div>
    </div>
  );
}

export default SignupChoicePage;

