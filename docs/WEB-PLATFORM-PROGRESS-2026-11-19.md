# VIRTURA Space｜Web 平台阶段进度与下一步（2026-11-19）

> 归档日期：2026-11-19（上海时间） · 状态：内部产品进度快照，非公开发布公告  
> 代码母仓：`VIRTURA-SPACEPORT/VIRTURA-SPACE`（Web App）。团队业务官网：`VIRTURA-SPACEPORT/VIRTURA-Website`（静态官网），**不是相同部署项目**。  
> 本文件只记录已验证事实、规划决策和开发任务，不移动任何个人工程、修改上线站点或开启登录方式。

## 一、当前事实（以上一轮 2026-11-18 验收和 2026-11-19 仓库核对为依据）

| 对象 | 当前状态 | 证据与边界 |
| --- | --- | --- |
| VIRTURA Space Web App | **具备基础账户页面** | React/Vite、Cloudflare Pages 预览：<https://virtura-space-preview.pages.dev/sign-in>；仓库 `src/App.tsx`、`src/supabase.ts` |
| 账户 | **受邀邮箱 6 位 OTP 可用** | 已进行管理员邮件收码、登录、刷新恢复、退出和未受邀拦截测试；公开新用户注册保持关闭 |
| 角色隔离 | **基础隔离已建** | `public.virtura_memberships`：`member/admin` 与 `active/revoked`，RLS；仅代表此表的基础测试，不等于所有未来资源的访问控制 |
| 封闭测试申请 | **已有存储与邮件队列** | `closed_test_applications`、`closed_test_email_outbox`；不把申请、发信、审核与账号开通混称 |
| VIRTURA ID | **基础身份存在** | 目前仅显示本人账户信息；还不是跨 App 的通用保存/授权中心 |
| My Space 收藏 | **已认可方向、未实现** | 追踪 [Issue #4](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/4) |
| 测试用户 vs 组织成员 | **必须拆分** | 目前普通 `member` 被显示为“受邀成员”，外部测试者不应因此被视为 Collective 组织成员；[Issue #3](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/3) |
| VJ Battle / Pass / 分布式 App | **有团队仓库策划稿，未开发** | [Draft PR #2](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/pull/2)；包含 SceneForge 混合活动 M0 研究 |
| Google/GitHub 登录及账号绑定 | **当前不支持，已完成实施方案** | [OAuth + 身份绑定规格](./AUTH-GOOGLE-GITHUB-IMPLEMENTATION-2026-11-19.md) |
| 应用系列 | **已有实际原型和独立产品候选，需要状态治理** | [App 系列与真实可用性登记](./APP-SERIES-REGISTRY-2026-11-19.md) |

### 仓库与域名边界

- `VIRTURA-SPACE` = 新平台运行代码、身份入口、My Space、共享数据与 App 清单。
- `VIRTURA-Website` = 对外业务官网与案例/合作入口；暂不把新 App 直接覆盖上去。
- `ewanqian/SceneForge` = 作者独立的场景铸造/Stage Replica 工程；可经版本化接口接入，不表示自动转移源码、素材版权或品牌归属。
- [VJ BATTLE × SceneForge 线上线下混合策划](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/blob/concept/vj-battle-pass-platform-20261118/docs/concepts/virtura-vj-battle-sceneforge-hybrid-2026-11-18.md) 当前仅存在于未合并分支；审阅并合并后再将链接改成 main。
- 正式站点/Cloudflare 发布源由单独发布验收把关；**本次归档没有部署应用，也没有改 Supabase 认证配置**。

## 二、统一产品结构（不是一屏同时开发所有 App）

| 入口层 | 目标 | 第一版主操作 |
| --- | --- | --- |
| Public | 真正存在的作品、场馆、App 和学习内容；不要求登录即可了解 | 打开一个实际内容 |
| My Space | VIRTURA ID + 收藏、已获批准的试验、可继续的个人任务 | 继续 / 收藏 / 取消 |
| Applications | 已核实用途、作者、设备、许可、版本的应用注册目录，允许有自己独立 URL 和 UI | 打开指定应用 |
| Academy | BPM 基础任务、Stage Replica 练习、自助 Jam 和可选实作评估 | 完成一项小任务 |
| Events / VJ Battle | 比赛是独立产品，拥有赛事届次、报名/资格、作品、赛组、现场和线上参与 | 试做 / 提交 / 观演 |
| Workspace（受控） | 真实项目职责、单一交付任务、批准/评审/交接 | 完成一个获授权的交付 |

**重要纠偏**：线上和线下应同样具有真实参与权；Battle 不是单纯实体演出直播。SceneForge 复用场馆、状态/Cue、视角/媒体和 Replay 作为舞台模型与数字场馆能力，但共享状态和远程节目审批仍须新开发。详情在 Draft PR #2 与 [Issue #6](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/6)。

## 三、近期按依赖推进

1. **P0 / 权限**：外部受邀测试资格从 `virtura_memberships` 的团队角色中分离；批准、撤销与审计；跨账户 RLS / 会话撤权复测（#3）。
2. **P0 / 真实产品**：选一件确实可复用的应用或档案对象，完成“开始→真实动作→结果→失败后恢复”闭环，不把空卡做成 App。
3. **P1 / My Space**：保存/取消收藏；跨设备找回；下线条目正确处理（#4）。
4. **P1 / 账号便捷登录**：先保持 OTP 作为安全兜底；给已受邀 ID 绑定 Google/GitHub，待服务端和权限验证通过才考虑启用新的登录按钮。绑定不赋予团队成员资格。
5. **P1 / 反馈**：具体问题、相关应用版本、处理负责人、关闭与重开记录，少量真实用户测试。
6. **P2 / App 分发**：先 Web/PWA + 独立应用链接；微信、小红书、XR 设备需分别验收认证和授权，不直接复制浏览器 token。
7. **P2 / VJ Battle M0**：一份 SceneForge `scene.json`、一个 45 秒试赛、虚拟场馆和模拟现场双端共享受控 Cue、回放与事件记录。未通过此试验前不建大型 MMO 服务。

## 四、统一验收门槛

- 每个 App 要明确“一次 5–15 分钟能完成什么”，包含可用状态、失败反馈与返回路径。
- 每次只强调一个主操作，不让用户在无限应用目录里失焦；可跳过教程。
- 所有可保存的行为要说明数据归属、版本与删除/退出方法；不采集不必要的行为数据。
- 所有受限权限在服务端/RLS 验证，不能通过隐藏页面完成授权。
- 微信/Google/GitHub/其他宿主端身份与 `VIRTURA ID` 分离为**登录凭据 vs 用户主体**，明确绑定/解绑。
- 前台 **Open / Invitation / Experimental / Archive / Planned** 与实际能力一致；不要宣传未存在的课程、赛事、奖金、证书、收藏与商店。
- 不以通过一次技术测验自动获取团队权限或参与商务项目的授权；岗位任务须有负责人、证据、约定和退出机制。
- 正式演出、商业交付与安全性优先；平台任务不挤占已定档的现场交付。

## 五、关联执行项目

- [#1 正式域名发布前的验收](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/1)
- [#3 内测邀请与权限隔离](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/3)
- [#4 My Space 收藏](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/4)
- [#5 VJ Battle 试赛](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/5)
- [#6 Battle × SceneForge 双端活动 M0](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/6)
- [Draft PR #2：VJ Battle / Pass / SceneForge 研究与策划](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/pull/2)

本归档的新增文件不会自动成为已排期的开发任务。后续设计/开发应从单个可验收 issue 开始。
