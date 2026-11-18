import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type Membership = {
  user_id: string;
  role: 'admin' | 'member';
  status: 'active';
  created_at: string;
};

type Access =
  | { state: 'loading' }
  | { state: 'guest' }
  | { state: 'error'; message: string }
  | { state: 'member'; user: User; membership: Membership }
  | { state: 'waitlisted'; user: User; status: string; createdAt: string };

function authError(code?: string): string {
  if (code === 'otp_expired') return '验证码无效或已过期，请重新获取。';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
    return '请求过于频繁，请稍后再试。';
  }
  if (code === 'signup_disabled' || code === 'user_not_found' || code === 'otp_disabled') {
    return '该邮箱尚未开通受邀登录，请联系团队确认邀请状态。';
  }
  return '暂时无法完成请求，请稍后重试。';
}

const socialProviders = (import.meta.env.VITE_SOCIAL_AUTH_ENABLED === 'true') ? (['google', 'github'] as const) : [];
const identityLinkingEnabled = import.meta.env.VITE_IDENTITY_LINKING_ENABLED === 'true';

function SignIn() {
  const [socialError, setSocialError] = useState('');
  async function signInSocial(provider: 'google' | 'github') {
    if (!supabase) return;
    setSocialError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider, options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setSocialError('此登录方式暂时无法使用，请使用已有的受邀邮箱登录。');
    } catch {
      setSocialError('连接第三方登录失败，请稍后重试。');
    }
  }
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!retryAt) return;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  useEffect(() => {
    if (sentTo) codeInput.current?.focus();
  }, [sentTo]);

  async function sendCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy || secondsLeft > 0 || !supabase) return;
    const address = (sentTo || email).trim().toLowerCase();
    setError('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: address,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(authError(error.code));
        return;
      }
      setSentTo(address);
      setToken('');
      setRetryAt(Date.now() + 60_000);
      codeInput.current?.focus();
    } catch {
      setError('网络连接失败，请检查连接后重试。');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !supabase) return;
    setError('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: sentTo,
        token,
        type: 'email',
      });
      if (error) setError(authError(error.code));
    } catch {
      setError('网络连接失败，请检查连接后重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="eyebrow">VIRTURA ID <span>/</span> 账号登录</p>
      <h1>{sentTo ? '查看你的邮箱。' : socialProviders.length > 0 ? '进入纬图空间。' : '使用受邀邮箱登录。'}</h1>
      <p className="intro">
        {sentTo
          ? <>输入发送至 <strong>{sentTo}</strong> 的六位验证码。</>
          : socialProviders.length > 0 ? '使用 Google 或 GitHub 建立 VIRTURA ID，查看个人候补状态。访问封闭实验仍需审核。' : '使用已获邀请的邮箱验证码登录 VIRTURA ID。'}
      </p>

      {socialProviders.length > 0 && !sentTo && (
        <div className="social-auth" aria-label="其他登录方式">
          <p className="field-help">Google / GitHub 可创建 VIRTURA ID。新账户仅进入候补名单，封闭测试仍需审核。</p>
          <div className="social-actions">
            {socialProviders.map((provider) => (
              <button key={provider} type="button" className="social-button"
                onClick={() => void signInSocial(provider)}>
                通过 {provider === 'google' ? 'Google' : 'GitHub'} 继续
              </button>
            ))}
          </div>
          {socialError && <p role="alert" className="error">{socialError}</p>}
        </div>
      )}
      {sentTo ? (
        <form onSubmit={verifyCode} className="auth-form">
          <label htmlFor="otp">六位验证码</label>
          <div className="input-row">
            <input
              ref={codeInput}
              id="otp"
              name="otp"
              className="otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              aria-describedby={error ? 'auth-error' : 'code-help'}
              aria-invalid={Boolean(error)}
              disabled={busy}
              required
            />
            <button className="primary" type="submit" disabled={busy || token.length !== 6}>
              {busy ? '正在验证…' : '验证并登录'}<span aria-hidden="true">↗</span>
            </button>
          </div>
          <p className="field-help" id="code-help">验证码一小时内有效。也请检查垃圾邮件文件夹。</p>
          {error && <p id="auth-error" className="error" role="alert">{error}</p>}
          <div className="form-actions">
            <button type="button" className="text-button" disabled={busy} onClick={() => {
              setSentTo('');
              setToken('');
              setError('');
              setRetryAt(0);
              setSecondsLeft(0);
            }}>更换邮箱</button>
            <button type="button" className="text-button" disabled={busy || secondsLeft > 0} onClick={() => void sendCode()}>
              {secondsLeft > 0 ? `${secondsLeft} 秒后可重发` : '重新发送验证码'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={sendCode} className="auth-form">
          <label htmlFor="email">受邀邮箱</label>
          <div className="input-row">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-describedby={error ? 'auth-error' : 'email-help'}
              aria-invalid={Boolean(error)}
              disabled={busy}
              maxLength={254}
              required
            />
            <button className="primary" type="submit" disabled={busy || secondsLeft > 0}>
              {busy ? '正在发送…' : secondsLeft > 0 ? `${secondsLeft} 秒后可重发` : '获取验证码'}<span aria-hidden="true">↗</span>
            </button>
          </div>
          <p id="email-help" className="field-help">公开内容可直接浏览，封闭实验按邀请开放。</p>
          {error && <p id="auth-error" className="error" role="alert">{error}</p>}
        </form>
      )}

    </>
  );
}

function WaitlistPanel({ access }: { access: Extract<Access, { state: 'waitlisted' }> }) {
  const [signOutError, setSignOutError] = useState('');
  return (
    <>
      <p className="eyebrow">VIRTURA ID <span>/</span> WAITLIST</p>
      <h1>欢迎加入候补名单。</h1>
      <p className="intro">VIRTURA ID 已就绪。你的申请已进入候补名单，受邀体验开放后将另行通知。公开内容仍可访问。</p>
      <section className="identity-panel" aria-label="候补状态">
        <div className="identity-top"><span>VIRTURA ID</span><span className="access-label">{access.status === 'pending' ? '候补中' : '申请状态'}</span></div>
        <p className="member-email">{access.user.email || '已验证的第三方身份'}</p>
        <dl>
          <div><dt>状态</dt><dd>{access.status === 'pending' ? '等待审核' : access.status === 'contacted' ? '已联系' : access.status === 'declined' ? '本轮未获邀请' : access.status === 'withdrawn' ? '已撤回申请' : '等待审核'}</dd></div>
          <div><dt>申请日期</dt><dd>{new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(access.createdAt))}</dd></div>
        </dl>
        <p className="field-help">候补尚未采用公开排队序号。账户标识：{access.user.id.slice(0, 8).toUpperCase()}（不是排名或邀请码）</p>
      </section>
      <div className="form-actions member-actions">
        <a href="https://virtura.space">浏览公开内容</a>
        <button type="button" className="text-button" onClick={() => void (async () => {
          const { error } = await supabase!.auth.signOut({ scope: 'local' });
          if (error) setSignOutError('退出失败，请重试。');
        })()}>退出登录</button>
      </div>
      {signOutError && <p role="alert" className="error">{signOutError}</p>}
    </>
  );
}

function MemberPanel({ access }: { access: Extract<Access, { state: 'member' }> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [identities, setIdentities] = useState<string[]>([]);
  const [identityError, setIdentityError] = useState('');
  useEffect(() => {
    if (!supabase || socialProviders.length === 0 || !identityLinkingEnabled) return;
    void supabase.auth.getUserIdentities().then(({data,error}) => {
      if (error) setIdentityError('暂时无法读取关联的登录方式。');
      else setIdentities(data.identities.map((identity) => identity.provider));
    });
  }, []);
  async function linkProvider(provider: 'google' | 'github') {
    if (!supabase) return;
    setIdentityError('');
    const {error} = await supabase.auth.linkIdentity({provider, options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    }});
    if (error) setIdentityError('此登录方式暂时无法关联，请检查账户和授权配置。');
  }

  async function signOut() {
    if (!supabase || busy) return;
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) setError('退出失败，请重试。');
    } catch {
      setError('网络连接失败，请重试退出。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="eyebrow">VIRTURA ID <span>/</span> 个人面板</p>
      <h1>欢迎进入，纬图空间。</h1>
      <p className="intro">你的邮箱已验证，受邀账号已就绪。</p>
      <section className="identity-panel" aria-label="账号信息">
        <div className="identity-top"><span>VIRTURA ID</span><span className="access-label">已受邀</span></div>
        <p className="member-email">{access.user.email}</p>
        <dl>
          <div><dt>身份</dt><dd>{access.membership.role === 'admin' ? '管理员' : '受邀成员'}</dd></div>
          <div><dt>加入日期</dt><dd>{new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(access.membership.created_at))}</dd></div>
        </dl>
        <p className="member-id">{access.membership.user_id}</p>
      </section>
      <p className="field-help">体验内容将按测试进度陆续开放。</p>
      {socialProviders.length > 0 && identityLinkingEnabled && (
        <section className="account-links" aria-label="关联登录方式">
          <h2>账号安全与登录方式</h2>
          <p className="field-help">已关联：{identities.length ? identities.join('、') : '正在确认'}</p>
          <div className="social-actions">
            {socialProviders.filter((provider) => !identities.includes(provider)).map((provider) => (
              <button className="social-button" key={provider} type="button"
                onClick={() => void linkProvider(provider)}>
                绑定 {provider === 'google' ? 'Google' : 'GitHub'}
              </button>
            ))}
          </div>
          {identityError && <p className="error" role="alert">{identityError}</p>}
        </section>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions member-actions">
        <a href="https://virtura.space">浏览公开内容 <span aria-hidden="true">↗</span></a>
        <button type="button" className="text-button" onClick={() => void signOut()} disabled={busy}>{busy ? '正在退出…' : '退出登录'}</button>
      </div>
    </>
  );
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [access, setAccess] = useState<Access>({ state: 'loading' });

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setAccess({ state: 'error', message: '登录服务尚未配置，请联系团队。' });
      return;
    }
    let cancelled = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
    });

    async function initialize() {
      try {
        const url = new URL(window.location.href);
        const hash = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type');
        if (hash) {
          window.history.replaceState(null, '', window.location.pathname);
          if (type !== 'email' && type !== 'invite' && type !== 'magiclink') {
            throw new Error('邀请链接无效，请使用邮箱验证码登录。');
          }
          const { error } = await client!.auth.verifyOtp({ token_hash: hash, type });
          if (error) throw new Error('邀请链接已失效，请使用邮箱验证码登录。');
        }
        const { data, error } = await client!.auth.getSession();
        if (error) throw error;
        if (!cancelled) {
          setSession(data.session);
          setInitialized(true);
        }
      } catch {
        if (!cancelled) {
          setAccess({ state: 'error', message: '登录链接或会话已失效，请重新登录。' });
        }
      }
    }
    void initialize();
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (!session) {
      setAccess({ state: 'guest' });
      document.title = 'VIRTURA ID · 受邀登录';
      window.history.replaceState(null, '', '/sign-in');
      return;
    }
    let cancelled = false;
    setAccess({ state: 'loading' });

    async function loadMembership() {
      try {
        const { data: { user }, error: userError } = await supabase!.auth.getUser();
        if (cancelled) return;
        if (userError || !user) {
          await supabase!.auth.signOut({ scope: 'local' });
          return;
        }
        const { data, error } = await supabase!
          .from('virtura_memberships')
          .select('user_id, role, status, created_at')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (!data) {
          const { data: existing, error: waitError } = await supabase!
            .from('registration_waitlist')
            .select('status, created_at')
            .eq('user_id', user.id)
            .maybeSingle();
          if (waitError) throw waitError;
          if (cancelled) return;
          if (existing) {
            setAccess({state: 'waitlisted', user, status: existing.status, createdAt: existing.created_at});
            document.title = 'VIRTURA ID · 候补状态';
            window.history.replaceState(null, '', '/id');
            return;
          }
          // Auth identity exists but confers no app or team access. Register only a
          // pending request; the grant and team records can never be set by clients.
          const { error: insertError } = await supabase!
            .from('registration_waitlist')
            .insert({ user_id: user.id });
          if (insertError && insertError.code !== '23505') throw insertError;
          const { data: after, error: rereadError } = await supabase!
            .from('registration_waitlist')
            .select('status, created_at')
            .eq('user_id', user.id)
            .single();
          if (rereadError || !after) throw rereadError || new Error('Waitlist status unavailable');
          if (cancelled) return;
          setAccess({state: 'waitlisted', user, status: after.status, createdAt: after.created_at});
          document.title = 'VIRTURA ID · 候补状态';
          window.history.replaceState(null, '', '/id');
          return;
        }
        setAccess({ state: 'member', user, membership: data as Membership });
        document.title = 'VIRTURA ID · 个人面板';
        window.history.replaceState(null, '', '/id');
      } catch {
        if (!cancelled) {
          setAccess({ state: 'error', message: '暂时无法读取邀请状态，请重试。' });
        }
      }
    }
    void loadMembership();
    return () => { cancelled = true; };
  }, [initialized, session]);


  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">跳至登录</a>
      <header className="site-header">
        <a className="wordmark" href="https://virtura.space">VIRTURA SPACE</a>
        <span>{access.state === 'member' ? 'VIRTURA ID' : '受邀登录'}</span>
      </header>
      <main id="main" className="access-layout">
        <section className="access-main" aria-busy={access.state === 'loading'}>
          {access.state === 'guest' && <SignIn />}
          {access.state === 'member' && <MemberPanel access={access} />}
          {access.state === 'waitlisted' && <WaitlistPanel access={access} />}
          {access.state === 'loading' && <><p className="eyebrow">VIRTURA ID</p><h1>正在读取账号…</h1><p className="intro" role="status">正在核验登录会话与邀请状态。</p></>}
          {access.state === 'error' && <>
            <p className="eyebrow">VIRTURA ID</p>
            <h1>暂时无法登录。</h1>
            <p className="intro" role="alert">{access.message}</p>
            {supabase && <div className="form-actions"><button className="text-button" type="button" onClick={() => window.location.reload()}>重新读取</button><button className="text-button" type="button" onClick={() => void supabase?.auth.signOut({ scope: 'local' })}>返回登录</button></div>}
          </>}
        </section>
        <aside className="access-aside" aria-label="登录说明">
          <h2>你的 VIRTURA ID</h2>
          <p>一个 VIRTURA ID，连接纬图空间里的参与。</p>
          <div className="aside-row"><span>登录方式</span><span>邮箱验证码 / 规划中的社交登录</span></div>
          <div className="aside-row"><span>测试范围</span><span>仅受邀用户</span></div>
          <p className="aside-note">创建账户与取得封闭测试访问资格分开处理，团队成员身份需要独立授权。</p>
        </aside>
      </main>
      <footer className="site-footer"><span>© {new Date().getFullYear()} VIRTURA</span><a href="https://virtura.space">返回纬图空间 <span aria-hidden="true">↗</span></a></footer>
    </div>
  );
}
