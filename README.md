# VIRTURA Space

VIRTURA Space 团队平台。当前版本提供受邀邮箱验证码登录、个人面板和数据库访问授权。

预览入口为 https://virtura-space-preview.pages.dev/sign-in。

## 本地运行

使用 Node.js 24.19，依赖版本由 `package-lock.json` 固定。

```sh
npm ci
cp .env.example .env.local
npm run dev
```

在 `.env.local` 填写现有 Supabase 项目的 publishable key。项目地址统一配置于 `config/project.ts`。开发服务器通过同站代理访问 Supabase。

```sh
npm run check
npm test
npm run build
npm run preview
```

## 登录与授权

- `/sign-in` 发送六位邮箱验证码，使用 `shouldCreateUser: false`。
- `/id` 验证登录会话并读取本人有效成员记录。
- `/auth/callback` 处理 PKCE 回调或邮件 token hash。
- 成员角色保存在 `public.virtura_memberships`。浏览器可读取本人有效记录，授权写入由后台管理员执行。
- `functions/supabase/[[path]].ts` 将当前登录与成员查询接口转发到固定 Supabase 项目，保留用户 JWT 和数据库 RLS。

新增受邀成员时，先在 Supabase Authentication 中创建用户，再从 SQL Editor 执行以下授权。将示例邮箱替换为已批准成员的邮箱。

```sql
insert into public.virtura_memberships (user_id, role, status)
select id, 'member', 'active'
from auth.users
where lower(email) = 'invited@example.com'
on conflict (user_id) do update set status = 'active';
```

数据库迁移位于 `supabase/migrations/`。`supabase/tests/virtura_memberships.sql` 在回滚事务中验证成员隔离、禁止提权、撤销权限和游客访问限制。

## 预览发布

```sh
npm run deploy
```

命令发布到独立 Pages 项目 `virtura-space-preview`。Cloudflare API token 和 account ID 通过当前进程环境提供。前端构建使用 `.env.local` 的 publishable key。
