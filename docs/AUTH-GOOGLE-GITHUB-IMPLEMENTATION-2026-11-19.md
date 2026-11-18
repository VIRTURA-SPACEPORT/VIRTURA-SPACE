# VIRTURA ID｜Google / GitHub 快速登录与账号绑定：实施规格

> 版本：2026-11-19 · 状态：**开发就绪方案，未启用 OAuth Provider、未上新登录按钮、未实测跨账号登录**  
> 所属 Web App：`VIRTURA-SPACEPORT/VIRTURA-SPACE` · 当前技术栈：React/Vite + Supabase Auth + Cloudflare Pages。  
> 目的：已受邀用户可以给现有 VIRTURA ID 添加 GitHub/Google 登录入口，后续不再每次等待邮件验证码；保留现有邮箱 OTP 兜底，不开启公开自由注册。

## 1. 设计结论

- **一个 `auth.users.id` = 一个 VIRTURA ID 的权威主键**。邮箱 OTP、Google 与 GitHub 只是不同的登录凭据。收藏、活动、Pass、项目授权始终归属于稳定的用户 UUID。
- Supabase Auth 已经支持 `signInWithOAuth({provider:'google'|'github'})`。同一**已验证邮箱**可能由 Supabase 自动关联身份；已登录用户可使用 `linkIdentity()` 手动关联不同邮箱的 OAuth 身份（官方文档标记 Beta，需从项目 Auth 设置启用）。
- **第一个交付先支持“登录后手动绑定”**：现有受邀用户先用 OTP 登录，在 `/id` 的 Account & Security 区域选择“绑定 Google / GitHub”，完成 OAuth 授权后返回同一个 UUID，再显示绑定状态。以此最大化避免重复账号/权限错配。
- **第二个交付再开放“用 Google / GitHub 登录”**。只允许已经存在且获得对应 `beta_access_grants`/原有成员授权的用户访问私有资源。**第三方登录成功≠受邀获准≠团队成员**。
- 当前公开注册保持关闭。不为实现快速登录而开启全局自由注册；若供应商与已存在邮箱匹配失败，提示用户先用受邀邮箱 OTP 登录，再从账户内绑定，不能自动迁移角色或通过昵称匹配身份。
- GitHub 登录的 OAuth 授权仅用于基本身份与邮箱；**不要请求 `repo`/私有仓库读取权限**。如将来有 GitHub 仓库同步功能，设计单独的用户授权与最小 Scope。

## 2. 现有仓库的真实阻碍

1. `src/supabase.ts` 已启用 `flowType: 'pkce'` 与 `detectSessionInUrl`，用户浏览器的 SDK Base URL 是 `https://当前站点/supabase`（同站代理）。
2. `functions/supabase/[[path]].ts` 只放行 `POST /auth/v1/otp`, `POST /auth/v1/verify`, `POST /auth/v1/token`, `GET /auth/v1/user`, `POST /auth/v1/logout` 与 `GET /rest/v1/virtura_memberships`。**未放行 OAuth 授权与身份管理接口，且当前代理会拒绝一切 3xx 重定向。**
3. `src/App.tsx` 的 `/auth/callback` 只显式处理 OTP 的 `token_hash` / Supabase 现有会话；引入 OAuth 后要确保 `?code=` 与 PKCE verifier 只交换一次，能捕获 `error` / `error_description`，拒绝恶意 `next` 跳转，并处理用户主动取消授权。
4. 现有 `virtura_memberships` `admin/member` 是最初用于受邀访问的表；外部测试资格和真实组织成员必须优先拆开（Issue #3），否则新 OAuth 登录按钮虽可用，仍有错误身份表述。
5. Github/Google 的 OAuth Apps、Client ID/Secret、Google consent branding、Supabase provider 启用、允许重定向列表、手动绑定开关均**未在本轮验证其实际设置**；不能宣称已准备好真实第三方登录。

## 3. 需要由平台所有者通过官方控制台完成的配置

### GitHub

- GitHub Developer Settings → OAuth Apps → New OAuth App；选择组织归属/账号所有者并确认管理者。
- Homepage URL 使用实际 Preview 或未来品牌账户域名。**Authorization callback URL 用 Supabase Auth 项目的回调**：  
  `https://cqevzwttlvqzgqztmwcy.supabase.co/auth/v1/callback`
- GitHub 返回 Client ID 与 Client Secret；仅把 Secret 放在 **Supabase Dashboard → Authentication → Sign In / Providers → GitHub** 的受保护配置。不要提交 Git、放浏览器、Issue 或聊天文档。
- GitHub OAuth App 注册的 callback 和网页自身的 `/auth/callback` 是**两个不同跳转点**；必须分别设置，不能混淆。

### Google

- Google Cloud Console / Google Auth Platform → Create Web Application OAuth client；先准备同意屏幕品牌、支持联系方式、用户范围；封闭测试阶段将对应测试账号纳入 Google 允许测试的用户范围（是否需要取决于 OAuth 应用发布状态）。
- 最小权限建议 `openid`、`email`、`profile`，不请求 Drive、Gmail、Calendar 等非登录必需权限。
- Authorized JavaScript Origins：按实际部署记录，例如 `https://virtura-space-preview.pages.dev`，本地开发按实际端口。  
- Authorized redirect URI：`https://cqevzwttlvqzgqztmwcy.supabase.co/auth/v1/callback`（从 Supabase Google Provider 页面核对后复制，项目回调可能因自定义 Auth 域名变化）。
- 保存 Google OAuth Client ID/Secret 到 Supabase Google provider 配置；Google 品牌验证与第三方用户准入需按真实发布状态核实。

### Supabase

- Authentication → URL Configuration：为**实际要使用的预览 origin** 添加精确 `/auth/callback` URL，例如 `https://virtura-space-preview.pages.dev/auth/callback`；未来更换生产域名时单独复核，不用不受控的通配符放行任意来源。
- Authentication → Sign In / Providers：只在测试准备完毕后启用 GitHub、Google；启用项目的 **Allow manual linking**（官方仍标 Beta）供已有登录用户绑定。
- **Allow new users to sign up** 保持关闭；不要因为社交登录错误就打开公共注册。按照实际“已创建用户 + 已授予资源资格”组合验证阻止陌生人。
- 不改动现有邮件 OTP、短信、会话时长或 admin 角色，以防把可用登录链路搞坏。

## 4. 前端调用（接口示例，非已发布代码）

```ts
// 已受邀、已存在用户的普通第三方登录（在 P0 安全验收后显示按钮）
await supabase.auth.signInWithOAuth({
  provider: 'github', // or 'google'
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});

// 用户已经通过邮箱 OTP 登录时，主动添加另一种身份。
// 请在 SDK 类型确认 redirect 选项后指定 /auth/callback 返回位置。
await supabase.auth.linkIdentity({ provider: 'google' });

// 显示绑定状态；不能根据 provider 的昵称或头像推断是否属于团队。
const { data, error } = await supabase.auth.getUserIdentities();
const linked = data?.identities.map((identity) => identity.provider) ?? [];

// 解绑前额外确认；Supabase 要求至少保留两种已关联身份。
const googleIdentity = data?.identities.find((identity) => identity.provider === 'google');
if (googleIdentity) await supabase.auth.unlinkIdentity(googleIdentity);
```

请为按钮添加错误、取消、重复绑定、会话过期和客服说明。没有 provider 配置就不显示会导致失败的“立即登录”。

## 5. Cloudflare Pages 同站 OAuth 转发：工程方案与安全边界

保留现有代理，**不把 Supabase Secret Key 暴露给客户端**。仅在独立 PR 内加入被测试覆盖的最小路径：
- OAuth 发起：`GET /auth/v1/authorize`（provider=google/github；无其他 Provider）。
- 已登录手动关联：SDK 对应的 `/auth/v1/user/identities/authorize` 与 `/auth/v1/user/identities` 等接口；具体请求路径、method 和头须通过**当前固定版本 @supabase/supabase-js** 的真实抓包/测试确认后才进入 allowlist。
- 已有 `POST /auth/v1/token` 可用于完成 PKCE code 交换，现有 OTP 路径保持原样。
- 授权端点会正常返回到 OAuth Provider 的 302/303，当前代理 `redirect: 'manual'` +“拒绝所有 3xx”不兼容：必须**仅对固定授权端点**允许并安全转发受验证的 Location，禁止把任意 API path 开放为跳转代理。
- 不接受任意 `redirect_to` origin：应用回调应由 Supabase Redirect URLs 精确限制；生产域名与预览域名分开。检查 OAuth `state` / PKCE，切勿把授权码、Provider Token、Session Token 写到日志或 URL analytics。
- 要求用户绑定前的当前会话是有效 VIRTURA ID；绑成功后再由服务端校验 `auth.uid()` / 当前用户权限，不将 provider email 用作权限判断。
- 不允许在前端传给代理的 `user_metadata` 决定 admin/member；权限由受控表和 RLS 决定。
- 解绑时保留至少一种可以可靠恢复的登录方式；对于邮箱/无密码 OTP 兜底，要先验收邮箱确实可收到邮件。

## 6. QA 测试矩阵（没有跑通不得启用）

| 场景 | 通过条件 |
| --- | --- |
| 邮箱 OTP 现有管理员 | 原登录、刷新、退出、授权继续正常 |
| 受邀现有用户同邮箱 Google | 原 `auth.users.id` 不变，不能产生重复受邀身份 |
| 受邀用户 GitHub 私有邮箱/不同邮箱 | 先以 OTP 登录，再手动关联，保留唯一用户 ID；未确认时不自动合并 |
| GitHub / Google 再登录 | 直接进入原 My Space，收藏与项目权限按原用户 ID 读取 |
| 未受邀陌生账户 | 不可自动生成受邀资格、不可读任何受限内容；用户看到明确的申请入口 |
| OAuth 拒绝授权、错误/过期 code、重复返回 | 不会假装成功，不会破坏原 OTP 会话；可重试 |
| 身份解绑/重绑 | 最低身份数、账户恢复和身份唯一约束均通过 |
| 权限撤销 / OAuth 仍有会话 | 被撤权用户即使再次 OAuth 登录也不可访问受限项目；不能仅凭旧 JWT claims |
| 两账号/多个设备 | A 不能通过绑定读 B 的收藏；跨设备已授权账号可以回到自己的收藏 |
| URL/CSRF/代理 | 禁止任意重定向、任意 Auth API 转发、敏感 token 日志与外部 Origin |
| 手机 / Safari / Chrome | Provider 跳转回调/深链成功，退出和重新登录一致 |

每个测试保留浏览器、账号类别、预览 URL、测试时间、实际截图/网络响应（删敏）与 PR；不要在测试报告出现邮箱、验证码、Access Token 和 Client Secret。

## 7. 优先级与延后边界

- **第 1 阶段**：P0 邀请资格与组织成员拆分 + 安全基线；让受邀 ID 的权限与 OAuth 方式无关。
- **第 2 阶段**：启用服务商设置、完成已登录账号手动绑定和显示绑定状态；只给内部/受邀账户测试。
- **第 3 阶段**：通过双账号验收后显示 GitHub/Google 快速登录按钮，不先面向陌生人注册。
- **第 4 阶段**：My Space 收藏/继续访问对绑定前后稳定；按真实需求接各 App。
- **更后**：Google One Tap、微信小程序、小红书小程序、XR 原生端以及“第三方 App 使用 VIRTURA ID 登录”的 OAuth Server/OIDC：是独立项目、不同安全模型；一个账号后端≠自动跨域 SSO。不要第一轮全部一起做。

## 8. 官方来源（2026-11-19 核对）

- Supabase [Sign in with GitHub](https://supabase.com/docs/guides/auth/social-sign-in/auth-github)
- Supabase [Sign in with Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
- Supabase [Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- Supabase [General Auth Configuration](https://supabase.com/docs/guides/auth/general-configuration)
- Supabase [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- Supabase [JavaScript signInWithOAuth](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)
- Supabase [JavaScript linkIdentity](https://supabase.com/docs/reference/javascript/auth-linkidentity)
- Supabase [Changelog](https://supabase.com/changelog.md)（2026-11-04 CLI v3 为 breaking change；本轮未运行 CLI 迁移或修改生产）

本规格仅为代码与控制台配置交接，不是 OAuth Provider 授权配置的完成证明。
