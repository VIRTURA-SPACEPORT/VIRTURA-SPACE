# VIRTURA ID · Google / GitHub 自由注册、候补与账号绑定

> 2026-11-19 · 设计决策 v0.2（更新 2026-11-18 用户最新意见）  
> **决策：允许通过 Google/GitHub 自由注册 VIRTURA ID；新用户默认仅为候补（Waitlist），不自动开通内测、团队身份、比赛资格或资源权限。**  
> **当前状态：方案已核实、尚未启用任何 OAuth provider 或数据库新表；现有邮箱 OTP 登录保持有效。**  
> 代码母仓：`VIRTURA-SPACEPORT/VIRTURA-SPACE`；现有 React/Vite + Cloudflare Pages + Supabase Auth。

## 01. 定义：身份不等于授权

五件事必须分开：

1. `auth.users`：**身份存在**。注册成功可登录和查看自己的候补状态。
2. `registration_waitlist`：**候补关系**。默认 `pending`，管理员可审阅和联系，个人不能自行更改审批结论。
3. `beta_access_grants`：**被邀请的实验权限**。限定 App/版本/期限；可撤销；不因拥有账号自动授予。
4. `virtura_memberships`：**VIRTURA Collective 的真实团队身份**。仅授权组织成员。
5. `project_assignments`：**具体协作或赛事角色**。比如某场赛事的参赛者、评审、Operator；不等于全站管理员。

新用户由 OAuth 自动进入 `waitlisted`，但仍可浏览公共作品、目录、规则和开放展览；**除自己的档案/候补状态外，不能访问受邀 App、内部项目或他人的资料**。登录页不再宣称第三方账号都“受邀”。

在 UX 上分两种入口：
- **Continue with Google / Continue with GitHub**：任何人可创建身份，进入候补；点击前明确文字“登录即创建 ID，内测须另行审核”，并说明候补联系的隐私目的。
- **Email code**：保留已受邀老用户的验证码通道，`shouldCreateUser:false`；此处暂不主动开放新邮箱注册。
- **Account / Connected logins**：已登录者主动绑定 Google/GitHub。绑定已有账号要保留相同 `auth.users.id`，不新建独立账户；不同邮箱需要用户自愿手动绑定，不按昵称匹配或静默合并。

## 02. 现有工程需要改什么（只在可审查 PR 中实施）

已核对：
- `src/supabase.ts` 使用同站 `/supabase` API、`flowType:pkce` 和持久会话。
- `functions/supabase/[[path]].ts` 目前只允许 `otp / verify / token / user / logout` 等，拒绝全部 3xx OAuth 跳转；OAuth 即使在 Supabase Dashboard 启用也不会通过现有网页自动成功。
- `src/App.tsx` 现把“无有效 `virtura_memberships`”判为 denied，这应改成 **`waitlisted`**：已注册但未授权的人看到候补面板，已有 `admin/member` 继续进入现有面板。
- 目前 `closed_test_applications` 为**匿名邮箱申请**，已有申请不应被删除、覆盖或误计为实名；新身份注册走 `registration_waitlist`，需要在受控后台以已验证邮箱将老申请迁移或建立明确关联，不能仅凭邮件文本自动接管记录。
- 未发现当前生产版 My Space 收藏、应用授权表、Google/GitHub provider 登录、任何微信/小红书账号绑定的实现；这些均有独立工程任务。

## 03. 推荐实现的最小数据模型（不是已部署 SQL）

### `registration_waitlist`

字段：`user_id uuid primary key references auth.users`、`status text default 'pending' check (pending, approved, declined, withdrawn)`、`requested_at timestamptz`、`source_provider text`、`consent_version text`、`reviewed_at`、`reviewed_by`。

- 不能让客户端写入 `approved` 或修改审核人。
- `SELECT` 仅限本人；普通用户初始登记 `INSERT` 限 `user_id=auth.uid() AND status='pending'`，没有 `UPDATE status` 权限。
- 经 OAuth 回调并成功获得真实 Supabase 会话后，完成一次幂等 `INSERT`。如果注册前要获取联系同意，页面应明确说明，未同意时仅保留 Auth 身份，不自动订阅营销信息。
- 别把 `auth.users` 用户数量当作内测人数。等待列表状态、审批事件、访问权限要分别计数。
- 新用户未能写入候补记录时，应显示“候补登记未完成，可重试”，不能只显示空面板或误称已申请。

### `beta_access_grants`

字段：`id`、`user_id`、`app_id`、`status`、`issued_at`、`expires_at`、`revoked_at`、`approved_by`。
- 用户不能自发授予、编辑或删除 `beta_access_grants`；批准由受控管理员流程完成。
- 每个受限业务表根据 `auth.uid()` + 有效授权 + 所属资源检查行级权限。**RLS 的 `TO authenticated` 不是充分授权条件**。
- 已登录的候补用户可使用自己的账户面板，但不能打开团队 `virtura_memberships` 保护的内部资料。
- 权限撤销后，后台敏感 API 必须实时复核；不能只相信旧 JWT claims。

### 邀请与团队权限不混用

旧 `virtura_memberships` 保留仅表明组织关系；已获准内测的普通用户**不需要被写成团队 member**。

## 04. Supabase Auth / Social OAuth 必须处理的配置冲突

**关键：要允许第三方新用户创建 `auth.users`，托管 Supabase 的“Allow new users to sign up”通常需要开启。** 这与目前关闭公开注册的状态不同。启用全局注册后，普通 email/signup API 也可能被外部直接调用——仅靠 UI 隐藏邮箱注册按钮并不构成服务器端只允许 OAuth 注册。

所以开发分两层：
1. **授权安全底座先完成**：默认新 Auth 用户只看到自己候补页；全站受限 App/内部表无任何隐式授予；完成 RLS、管理员安全检查、滥用/限流/验证码/用户删除路径与测试。
2. **开放 GitHub/Google 注册**：配置 provider OAuth credentials，Supabase Redirect URLs 与 Cloudflare 代理，开启新用户创建。邮箱 OTP 仍 `shouldCreateUser:false`。若正式要求服务端“**只允许** Google/GitHub 账号自助创建”，应使用 Supabase [Before User Created Auth Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook) 检查可信 `app_metadata.provider`，拒绝其他来源；注意 hook 也可能影响后台邀请/管理员创建账号，需在测试环境覆盖这些路径，不直接打开生产 hook。
3. 注册后未获批准的用户必须**即使持有效 Supabase JWT 也不能获得任何私有业务权限**；这是开放 Auth 新用户和开放内测的核心区别。

## 05. OAuth Provider 控制台配置（需账号所有者完成的事项）

GitHub：
- 在 [GitHub Developer Settings / OAuth Apps](https://github.com/settings/developers) 创建所属 VIRTURA 业务主体的 OAuth App。
- Homepage 使用实际 Web 预览/生产地址；OAuth Provider callback 用 Supabase 的真实 Auth URL，例如 `https://cqevzwttlvqzgqztmwcy.supabase.co/auth/v1/callback`，需以 Supabase Dashboard 显示的回调为准。
- 将 Client ID/Secret 在 Supabase Dashboard 的 GitHub Provider 中保存。**Secret 仅保留于安全的服务端控制台**，绝不放进 Git/客户端/Issue/聊天。

Google：
- [Google Auth Platform](https://console.cloud.google.com/auth/overview) 建立 Web OAuth Client，配置 Audience、Branding、必需的基本身份 scopes、站点 origin 和 Supabase Auth callback。
- 身份 scopes 仅用 `openid`、`email`、`profile`，不要请求 Gmail、Drive、日历等额外权限。
- Google Audience 如果仍是测试状态，可能只有授权测试用户能登入，不能宣传完全公开。
- 将 Client ID/Secret 配置在 Supabase Google Provider，核验 Consent UI 的业务名称、隐私政策与实际托管 URL。

Supabase：
- 配置 [Redirect URL allowlist](https://supabase.com/docs/guides/auth/redirect-urls)，分别登记真实测试和正式 origin，建议准确 `/auth/callback` 终点而非任意通配符。
- 账号手动绑定使用 [Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking)（官方仍标 Beta），如配置允许，提供 `linkIdentity`、`getUserIdentities`、`unlinkIdentity`。
- 为 OAuth 特定 API 做有审计的 Cloudflare allowlist 与受限制的 3xx 转发；不开放“任意路径代理”、任意 Origin 回跳、日志记录 token 和未经确认的账号自动合并。

## 06. 前端用户路径与 API（示意，非已部署）

```ts
// 新用户或老用户：Google/GitHub 登录，最终进入 Waitlist 或获授权的 My Space
await supabase.auth.signInWithOAuth({
  provider: 'google', // or 'github'
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});

// 已登录用户：主动将另一个 provider 绑定到同一个 Supabase 用户
await supabase.auth.linkIdentity({ provider: 'github' });

// 获取当前可靠绑定状态，解绑时保留至少一种可恢复身份
const { data } = await supabase.auth.getUserIdentities();
// await supabase.auth.unlinkIdentity(existingIdentity);
```

完整回跳必须支持 `?code=` 的 PKCE exchange，并验证当前业务角色与用户 UUID，而不根据提供者的 email/nickname 直接加权限。回调时区分“首次注册待登记”“已在候补”“已获受邀资格”“真实组织成员”“授权被撤销”，不能自动进入同一团队面板。

UX 文案建议：
- 登录前：“Google 或 GitHub 创建 VIRTURA ID。账号创建后进入候补名单，封闭测试仍需邀请。”
- 登录后待审：“你已建立 VIRTURA ID，当前处于候补状态。公开内容可以继续使用，受邀实验开放后另行通知。”
- 在 Account & Security 显示：“已关联：Google · GitHub · 邮箱验证码”；只有真实从 provider 返回且验证通过才显示。
- 无需让用户额外填写公司/技能/职位等大型表单；兴趣选择留到真正参加活动时。

## 07. 最小验收矩阵

- 现有管理员邮箱 OTP 登录、刷新、退出、角色权限没有回归。
- 全新 Google 用户首次登录产生 **一个 Auth UUID + 一条 pending waitlist**；未得到任何 beta grant / team membership。
- 全新 GitHub 用户流程相同，GitHub 邮箱隐藏/无可用邮箱的异常有明确提示。
- 同一人使用已经绑定的两个 provider，回到**同一个 UUID**；不同邮箱的两个身份只在已有会话下主动绑定，不能在没认证时按昵称/邮箱猜测合并。
- 匿名访问、pending、approved、revoked、admin 分别测试 API 与 UI；pending 和 revoked **不能**读内部数据库、下载私有作品、进入受邀 App。
- 第三方 OAuth 取消、过期授权码、重复回调、跨端换浏览器与 Safari 测试覆盖；不出现开放重定向或 token 泄漏。
- 重复注册不重复候补、不同邮箱与同邮箱碰撞可恢复，管理员批准和撤销必须经受控后端执行。
- 检测 OAuth 注册后的垃圾用户/机器人滥用、成本变化和数据保留/删除；对外隐私说明与实际用途匹配。
- 无任何 provider Secret 被提交到 Git/泄露到前端/出现在测试报告。

## 08. 实施顺序

**P0**：`registration_waitlist` + `beta_access_grants` RLS 与 API + 注册后 pending UI、邀请审批/撤销；保持现有 OTP。  
**P1**：创建并配置 Google/GitHub OAuth Apps、处理 proxy/PKCE、开第三方注册，验收 pending 默认拒绝；在测试域名先跑完整流程。  
**P1**：做账户内“绑定 / 解绑 / 查看登录方式”，以及 My Space 收藏跨登录方式不丢失。  
**P2**：再面向真实公众开放入口；App 系列接入同一个 ID，微信/小红书小程序独立设计服务端映射。

参考（Supabase 官方）：[Google OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) · [GitHub OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-github) · [Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking) · [Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook) · [Auth Social Sign-In](https://supabase.com/docs/guides/auth/social-sign-in)。

本文件是**更新后的最终产品方向**：不同于初版“只给受邀账号绑定、自由注册继续关闭”的旧设计。实际代码、Provider 配置与生产开关仍需独立验证，未在本次文档提交中执行。
