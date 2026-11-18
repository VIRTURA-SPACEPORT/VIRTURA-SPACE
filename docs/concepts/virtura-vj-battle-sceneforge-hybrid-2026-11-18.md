# VIRTURA VJ BATTLE × SceneForge — 线上线下融合赛事与数字空间集会

> 日期：2026-11-18｜状态：Concept/Architecture v0.1，产品研究与接口约定，**无实装或活动承诺**。  
> 来源：用户纠偏——此前参考的现实游戏组织偏线下，VIRTURA 必须让线上与线下都拥有独立、真实的参与机制，并盘活个人已有的 SceneForge（场景铸造）工程。  
> 本文归属：VIRTURA Space 团队平台策划。SceneForge 仍保留在作者仓库 `ewanqian/SceneForge`；**不转移代码与作品所有权，不未经许可发布素材**。  
> 关联：[VJ Battle 主提案](./virtura-vj-battle-2026-11-18.md) · [VIRTURA ID/Pass 跨端路线](./virtura-pass-and-distributed-apps-2026-11-18.md) · [SceneForge 已有 Self-hosted Spatial Events Roadmap](https://github.com/ewanqian/SceneForge/blob/main/docs/roadmap-self-hosted-spatial-events-2026.md)

## 1. 产品定位：不是“线下赛事 + 直播”

**核心服务**：一场赛事在虚拟数字场地有独立内容、成员动作和作品记录，在现实舞台有真正的实时演出与公共呈现；两个场域共享经过授权的赛事状态、参赛作品和活动时间线，但不假设网络延迟为零。

四种不同参与方式：
1. **Remote Performer / 远程参赛者**：在线提交素材/生成方案或在明确时隙内实时投送视频/Shader，并通过审核后进入主持人 Program。
2. **Virtual Attendee / 数字场馆观众**：从普通网页或 XR 进入 SceneForge 虚拟场地，选择机位、观看现场视频映射到虚拟屏幕、切换展示视图、参与有时限的提案/投票。
3. **On-site Performer & Audience / 线下表演与观众**：真实舞台演出并观看来自远程参赛者的已批准内容，现场观众可通过现场大屏/扫码参与受控活动。
4. **Director / Organizer / Judge**：具备独立授权，管理赛程、内容审核、输入源、Cue、评分、故障恢复和节目档案。直播/赛场绝不把节目控制权直接交给匿名用户。

这四种方式都能带着相应的 VIRTURA ID/Pass 参与，但**仅浏览不要求登录**。Pass 为个人经历和作品入口，不是第二个账号或赛事通行证的神秘资产。

## 2. SceneForge 当前真实可用资产（基于 2026-11-18 仓库核查）

| 模块/入口 | 已有证据 | 能直接复用 | 仍需开发/验证 |
| --- | --- | --- | --- |
| 主 R3F Viewer | [README](https://github.com/ewanqian/SceneForge/blob/main/README.md)、`src/domain/scene.ts`、`src/domain/cue-engine.ts` | 场地目录、镜头、视频面、Cue/State、XR 检测与场地 JSON | 真实场地测量、服务器同步、生产节目接入 |
| [Stage Replica Authoring](https://ewanqian.github.io/SceneForge/stage-replica/authoring/) | [Authoring README](https://github.com/ewanqian/SceneForge/blob/main/public/stage-replica/authoring/README.md) | 自助编辑 2+ media surface、3+ camera、3–4 states，本地媒体、V1/V2、本地记录、URL 分享、scene.json 导出 | 真人 3 小时做出第五场地未验收；无多人/后台/移动/XR；四个 Demo schema 未统一，adapter 会丢失独有行为 |
| [Stage Replica Replay](https://ewanqian.github.io/SceneForge/stage-replica/replay/) | [Replay README](https://github.com/ewanqian/SceneForge/blob/main/public/stage-replica/replay/README.md) | 3 条示例录像的统一 master timeline、手工 offset、机位切换、节目/自由视角 | 无真实观众饭拍、自动同步、音频指纹；移动/XR 未测 |
| Needle XR Room | [v0.2 记录](https://github.com/ewanqian/SceneForge/blob/main/docs/versions/v0.2.0.md) | 独立 Needle WebRTC screen/camera room、具名 room URL、WebXR 和视频面实验 | 有明确未打勾的跨浏览器/Vision Pro 10min 实机验收；模型状态仍本地、无正式账号与权限 |
| 自托管空间活动架构 | [SceneForge 2026 Roadmap](https://github.com/ewanqian/SceneForge/blob/main/docs/roadmap-self-hosted-spatial-events-2026.md) | 参考数据边界：package/room/event/state/media planes、WebXR、观众分片 | 文档计划不代表 25 人或 500 人能力已实现 |

**重要**：UFO Terminal 和 BO Live House 当前 `illustrative`，是教学几何，不是测绘级可对场地输出的三维数字孪生。公开介绍、招标或给实体现场使用时须标注这个边界。

## 3. 一次活动如何连通：时间线和舞台内容共同作用

### A：活动前 1–3 周，数字场馆先开门

- 观众在网页访问“本届 VJ Battle / 本届虚拟场馆”，浏览赛事规则、场地、往届作品与赛前共享资源。
- 参赛者点击“用 SceneForge 尝试本届舞台”，无需先搭全栈即可在 Authoring 使用官方的赛场代理（proxy）几何、有限素材、机位和 Cue 设计自己的映射/视觉演示。
- 使用统一的 45–60 秒音乐题（合法授权）提交 **scene.json / 作品视频 / 截图 / 方法说明**。首次用文件上传+人工评审即可，不强制远程代码执行。
- 通过的作品出现在数字候场室/线上展廊，观众可查看；公展与赛场播映授权单独选择。
- 没有比赛资格的人仍能进入 Space、观看比赛和参加 Open Jam，减少“考证前无法进入”的排斥性设计。

### B：比赛当天，线上与线下各有真正的任务

- 实体场地：节目导演在可信的控制台决定切换选手、节目与现场视效；真实硬件输出独立保底。
- 远程参赛者：通过经过赛务授权的 WebRTC/WHIP/RTMP/WebGL 作品流投送素材到**待审输入池**；完成预检后进入赛场 Operator Program（不能直接控制 LED/灯光）。
- 数字观众：通过 SceneForge 展厅进入同一场地模型，从可选择的摄像机视角看被授权的节目视频纹理（也可随时切回纯 2D 的流媒体）。
- 现场与远程观众：在限定时隙提交“下一轮曲目方向/视觉命题/投票”，先经过服务器计票、反刷及导播批准；可改变**下一个**回合内容或经限定的可控视觉参数，避免实时不稳定。
- **一个权威 Event Clock + Program State**：所有观众看到同一轮比赛、选手、作品 ID、节目状态和主持人规则；视频播放器时钟有单独的实测延迟信息。不能承诺 HLS 观看端和现场 LED 帧精确同步。
- 在远端网络断开时，现场节目继续使用本地保底视频；线上观众获得明确“正在恢复/切换录像”的状态。

### C：赛后，把现场带回数字空间

- 用 SceneForge Replay 的共同时间轴把导播节目、固定机位与获授权的观众机位视频放回空间。早期依赖手工 offset，并显示可信度，不能伪称自动同步。
- 参赛者可从 Pass 找到自己的作品、赛次、评分摘要与可公开证据；观众可以收藏展览和作品，但访问不能绕过作品授权。
- 形成“这一届比赛可以重新进入”的可重复场馆，并允许下一届复用同一套场地包和规则模板。

## 4. 最小可对接架构：共享对象而不是强制合并仓库

```text
                VIRTURA ID / Pass (Supabase)
                authentication · grants · saves
                             │
                VJ BATTLE EVENT SERVICE
          edition · entry · round · approved cue
         judging · moderation · authoritative state
                 │                         │
      SceneForge Scene Adapter       Operator Console
      venue package / camera/cue      safety approval
                 │                         │
       Virtual Room Client             Physical Stage
   desktop / mobile / Quest / AVP    Arena / TD / Notch etc.
                 │                         │
             WebRTC/stream <── trusted media bridge
                 │
           post-event Replay
```

**明确四条数据通路：**
1. 静态资产：场地模型/贴图/封面/授权录播 → HTTPS/CDN；客户端下载后自行渲染空间，不从服务器直播每个用户的 3D 全帧。
2. 状态：`event_id`、`round_id`、`scene_revision`、`cue_id`、`program_source_id`、`event_seq`、服务器时间 → 服务器授权发布（小规模可用 WS/Realtime 研究）→ 线上客户端应用；需要快照/重连对账。
3. 媒体：现场导播/OBS/NDI 可信转换 → WebRTC 用于少量互动参赛者与工作人员；规模化观看可独立走适用的直播/CDN 输出。浏览器不能直接读取 NDI，须可信 native bridge。
4. 留存：作品、提交文件、场景包、评分、版本、录播索引 → 后端存储并保留作者、许可、撤展和导出规则；My Space 只引用真实对象。

**信任边界**：访客不能直接写物理屏幕 Cue，不能直接调用舞台 OSC/DMX/NDI 服务；所有 Web 命令由后端验证角色、活动状态、输入范围和速率，经过 Operator 的最终确认；现场本地可断网独立运行。授权角色建议 `spectator`、`remote_performer`、`onsite_performer`、`judge`、`host`、`show_operator`（均为活动范围授权，不能与全平台 `admin` 混淆）。

**最小事件协议示意**（只是数据约定，不是现有 API）：

```json
{
  "edition_id": "vj-battle-pilot-01",
  "event_seq": 12,
  "type": "program.cue_changed",
  "round_id": "round-02",
  "scene_revision": "stage-v1",
  "cue_id": "build",
  "program_source_id": "entry-07-approved",
  "effective_at": "2027-01-01T12:00:00Z",
  "issued_by_role": "show_operator"
}
```

时间字段只表示事件生效计划，客户端必须按服务端快照重建状态；时间示例并非确定的赛事日期。不能仅凭客户端自报 `issued_by_role` 赋权。

**契约管理**：SceneForge 自己维护 Scene Package；赛事只在独立 adapter 层记录 Venue ID、Scene Revision、Media Surface、Cue、Camera、License、Endpoint 等引用。不把个人 SceneForge 整个仓库复制进团队仓库；适配器不得悄悄压平四套 Demo 的特有表现。

## 5. 最具价值的产品分化：三种模式，不是一个巨型多人房间

| 模式 | 同一活动中的体验 | 成本与风险 |
| --- | --- | --- |
| **Browse / 展厅** | 低成本异步逛展、看已提交作品与回放；允许不登录 | 先从静态 3D 与独立视频开始 |
| **Join / 远程共演** | 少量经过授权的选手提交实时画面或有边界的控制，主持人选择输出 | 要求时延、转码、故障回退、身份验证 |
| **Witness / 大规模观演** | 主要通过广播看现场，用有限互动影响命题/投票，不要求所有观众同时 WebRTC 进入 3D 多人语音房 | 需 CDN、分片、反滥用、直播延迟说明；暂不承诺大规模容量 |

其中“多人”未必需要每人一个完整 3D 头像。第一届可以先用在线观众数量/贡献轨迹/作品排队列可视化来建立共同在场感，成本显著低于重型 avatar MMO。

## 6. 研究参考：已验证的线上/线下融合先例

- [Revision 2026 — Shader Royale VJ Session](https://2026.revision-party.net/events/livecoding-events/) 明确开放世界各地的远程参与者通过 networked Bonzomatic 向现场大屏提供实时 Shader；远程作者可随时离开、最新作品仍在现场轮播。这是对本提案**最直接**的参照，优先研究其“远程投稿/更新/节目选择”机制。
- [LiveKit Rooms / Participants / Tracks](https://docs.livekit.io/intro/basics/rooms-participants-tracks/)：为少量实时投稿或协作提供媒体通道和房间身份概念；是否采用应受第一轮实测与成本驱动。
- [LiveKit Ingress](https://docs.livekit.io/transport/media/ingress-egress/ingress/)：从 OBS/设备等标准源接入 RTMP/WHIP 后转成 WebRTC；并不意味着免费、无延迟或已经接入 SceneForge。
- [LiveKit Egress](https://docs.livekit.io/transport/media/ingress-egress/egress/)：可录制与对外推流；是否采用由正式直播方案决定。
- [[rect*]repair](https://rect.repair/catalogue/) 主要提供现实游戏、现场赛事的组织灵感，而**不能当成 VIRTURA 所需线上基础设施已存在的证明**。

## 7. 第一轮建议：只证明一条双向的连线

在**不接入真实舞台硬件、不重新开发 SceneForge、不采购新工具**的条件下做一次内测：

**原型 M0：Stage Twin Jam / 双端场地试做**

1. 一个模拟赛场：选用 SceneForge 已有 `illustrative` 场地几何，标明非真实测绘。
2. 一次线上作者提交：参加者在 Authoring 修改两个媒体面、一个 Cue，导出 scene.json + 45 秒演示，绑定一次 VIRTURA ID / 受邀测试资格（如尚未实现，可先由管理员人工编号/登记）。
3. 两个观看页面：一个 SceneForge 虚拟镜头视图；一个“现场 Program”网页预演视图。**两个页面使用同一通过验收的场地包与节目状态**。
4. **一次真正的双向交互**：远程观众在指定窗口投票选下一回合视觉命题；后台确认后，两个页面同时切换经批准的 `cue_id`（模拟，不连接舞台硬件）。
5. 最后导出录屏与 `event_log.json`，用 SceneForge Replay 做机位和时间轴复盘，保留人工 offset 机制。

### M0 验收（不是已完成）

- 3–6 位受邀者能按说明自行进入、完成试做、提交与观看；不需要理解 SceneForge 仓库结构。
- 两个独立浏览器在相同 event_seq 下展示相同回合/Cue；断开网络后恢复正确状态；记录失败与回退耗时。
- 远程命令不会绕过主持人/Operator 写入“现场 Program”；仅约定可控操作。
- 一位参与者完成的 scene.json 能被管理员复开；不能自动复开时给出错误原因。
- 一次演出记录可被重新打开和查看作者、许可、版本与节目时间轴；退出后不丢数据。
- 记录设备、浏览器、网络、GPU、声画延迟与权限问题；所有结论标注本次测试条件。
- 在没有真人实测通过前，页面只标“实验中”。

### 后续阶段

- **M1**：2–4 名远程表演者在受控通道轮流投送实时画面，选一份合格输入上模拟大屏，验证直播故障回退。
- **M2**：与获授权场地结合，现场观众与远程参与者都可在独立入口观看和按规则互动，测试 show-network 边界。
- **M3**：经成本、权限、设备和网络测试后，再引入高密度数字观众、自由漫游、XR 多人同场、实体AR任务和更完整的巡回赛事。

## 8. 与已有工程路线的冲突处理

- `SceneForge` 原路线 Phase 1 就包括双人空间、摄像头/屏幕分享和真实 WebXR 设备测试；但该路径对首轮 VJ Battle 不是强制前置。优先用已经可运行的 Authoring/Replay 验证**参赛与作品**，避免未证实的 XR 影响活动可行性。
- 赛事产品、平台身份、SceneForge 编辑器三个仓库各自维护，使用稳定 ID 与协议接口对接；当接口稳定后再考虑代码共享。
- 双端直播不是“把相同视频源贴到两个面”就算有参与意义：真正要检验的是远程用户**产生什么可见的行为，并在实体/模拟节目中留下什么结果**。
- 2026-12-03—12-04 已有演出任务优先；本提案只授权策划和小实验方案，不自动提前安排公开活动。
