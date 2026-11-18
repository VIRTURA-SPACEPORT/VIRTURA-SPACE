# VIRTURA Space｜应用系列与统一身份注册表（2026-11-19）

> 状态：产品清单 v0.1；**仅区分来源和当前可证明的功能，不代表各应用已在 Space 内发布**。  
> 主仓：`VIRTURA-SPACEPORT/VIRTURA-SPACE`；独立创作源保持原作者、原仓、原发布状态。  
> 关联：[平台进度](./WEB-PLATFORM-PROGRESS-2026-11-19.md)、[Google/GitHub 注册与候补身份架构](./AUTH-GOOGLE-GITHUB-IMPLEMENTATION-2026-11-19.md)、[VJ Battle × SceneForge 策划 PR #2](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/pull/2)。

## 1. 产品形态

- **Applications**：用户能打开、操作、产生明确结果的工具，容许各自独立样式、维护仓和 URL。
- **Places / Events**：空间、展览、线上集会、线下活动、赛事；舞台、作品与届次拥有独立业务 ID，用户身份由 VIRTURA ID 承接。
- **Academy**：知识共享、工作坊、趣味挑战与实际试做；知识模块不自动等于独立 App。
- **My Space / Pass**：账号、收藏、已批准参与记录、继续体验、身份管理；是共享服务，不强制成为独立首发 App。
- **Workspace**：只有被授权的主办者/内部成员/项目合作方看到具体任务，普通游客、候补者不进入。

**用户当下最新决定：Google 和 GitHub 可供外部人自由建立 VIRTURA ID，但默认状态是** `waitlisted` **（候补），不是** `approved`、`collective_member` 或 `admin`。详情见认证实施规格。

## 2. 产品登记

| 内容 | 类型 | 已有来源/状态 | 现在真正可做 | 集成与缺口 |
| --- | --- | --- | --- | --- |
| VIRTURA ID / 登录 | Shared | [团队 Web 源码](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE) | 目前已有受邀邮箱 OTP 与个人身份面板 | Google/GitHub 自由注册-候补尚未开启；绑定、权限分离待开发 |
| My Space 收藏 | Shared | [Issue #4](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/4) | 当前面板仅显示账户信息 | 需要可保存、取消、跨设备恢复和 RLS 验收 |
| SceneForge | App / Stage | [原作者仓](https://github.com/ewanqian/SceneForge) | 场地目录、镜头、Cue、媒体映射、基础 WebXR 能力检测 | 场地仅示意几何；多人协作与真实设备/节目播控需另外验收 |
| Stage Replica Authoring | SceneForge 子应用 | [在线编辑器](https://ewanqian.github.io/SceneForge/stage-replica/authoring/) | 编辑媒体面/镜头/状态，URL 分享、JSON 导出，V1/V2 本地保存 | 无服务端同步/真人 3 小时验收，桌面优先 |
| Stage Replica Replay | SceneForge 子应用 | [在线 Replay](https://ewanqian.github.io/SceneForge/stage-replica/replay/) | 多机位视频手工对齐和同时间轴切换 | 自动音视频同步/移动/XR/真人饭拍未验收 |
| BPM / Minimal Input | Academy / Challenge | 现有个人 BPM 系统方法、工作坊成果 | 有可传授的概念和示范 | 选一题变成 5–15 分钟的可操作、可检查、可保存任务 |
| VJ BATTLE | Event / 独立 App 候选 | [Draft PR #2](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/pull/2), [Issue #5](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/5) | 赛事策划、能力试做与分赛道设计 | 尚无赛事运营、实测、可报名/正式奖项 |
| VJ BATTLE × SceneForge | Hybrid Event | [Issue #6](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/6) | M0 双端模拟、可控 Cue 与回放方案已归档 | 远程作者实际影响“虚拟场馆/模拟现场”的双向验证待开发 |
| MOVA | Place / Gallery | [团队活动历史](https://github.com/VIRTURA-SPACEPORT/VIRTURA-Collective/tree/main/activities) | 已有展映与项目档案 | 新平台馆藏、独立 Gallery 访问与权限未接入 |
| Balloon Live Space | Place / Live | 同上 | 历史演出与测试资料可检索 | 新平台内可持续的在线多人演出仍需验证 |
| Spatial Playground / Hand OSC | R&D App | 既有 WebXR、OSC 研究与工程记录 | 有空间手势/控制实验基础 | 需要验证当前公网部署、各设备声画表现、维护者 |
| Performable Music | R&D / Archive | 既有音乐/演奏工程 | 可作为作品与研究目录候选 | 是否具备完整、普通用户可用的 Web 工具尚待核对 |
| Library / Newsroom | Publication | [Newsroom](https://github.com/VIRTURA-SPACEPORT/VIRTURA-Newsroom) | 文章、复盘与内容来源 | 标准化作者、来源、版本、固定链接、收藏 |
| Extensions / Skills | Directory | 现有研究与提案 | 可先展示经过核实的可下载/可运行项目 | 下载安装、执行沙盒、App 审核与计费属于后期 |
| Workspace / Project Trial | Internal | [Issue #3](https://github.com/VIRTURA-SPACEPORT/VIRTURA-SPACE/issues/3) | 已具备最简单管理员/成员数据边界 | 外部候补者绝不能因注册获得项目或组织权限 |

首次上架不按表中的数量逐一开发。优先从真实可运行源挑一件，完成“打开→操作→结果→失败恢复→可保存或导出”；没有一条真实完整任务的内容仍展示为案例/实验说明。

## 3. App Registration / 最小元数据契约

```json
{
  "app_id": "sceneforge-authoring",
  "kind": "application",
  "owner": "independent-author",
  "source_repo": "ewanqian/SceneForge",
  "launch_url": "https://ewanqian.github.io/SceneForge/stage-replica/authoring/",
  "entry_task": "Edit a venue and export scene.json",
  "platforms": ["desktop-web"],
  "auth_mode": "optional",
  "data_scope": "local-export",
  "maturity_status": "experimental",
  "license_status": "verify-before-republishing",
  "maintainer": "original-author"
}
```

这只是目录规范，不是当前数据库里的真实条目；不会替原作者做版权决定。每个 App 自己有路由与外观，但使用统一的 `VIRTURA ID` 作为用户引用，访问权益由平台角色/项目/活动的服务端授权决定。

## 4. 各端的登录接入顺序

1. **Web/PWA**：首要，普通用户无需安装；Google/GitHub 入口可以注册但只能进入 Waitlist Lobby，邮箱 OTP 留作邀请用户入口。
2. **微信/小红书小程序**：因实际活动/场馆的扫码、预约、签到、分享需求出现再接入；每个小程序单独向平台验证自身签发的临时登录凭据，账号绑定必须有可信证明。
3. **Quest/AVP WebXR**：在支持的浏览器按需使用网页身份与授权；沉浸模式不要默认存在可用的传统网页弹窗/登录按钮。
4. **独立原生 App / 外部第三方 App**：真正做“别的产品一键用 VIRTURA ID 登录”要正式 OAuth/OIDC 客户端授权、回调、撤销与审计，不等于直接共享浏览器本地存储或把 Supabase token 塞到外部 URL。

### 发布与质量门槛

- 产品有实际结果、明确状态和设备支持，失败路径可以继续/退出。
- 一次只给当前用户一个主要行动；不做复杂教程/强制签到。
- 被收藏或展示的内容下架/撤展时不能绕过来源访问权限。
- 外部 OAuth 用户**默认候补**，仅能访问公开内容和自己的候补状态；内测授权来自 `beta_access_grants`，团队权限来自 `virtura_memberships`。
- 登录凭据、服务角色密钥与第三方 provider token 不可进入公开仓库或日志。
