# 世界社区（World Community）前端

基于 OpenAPI 接口文档生成的论坛/社区系统前端，覆盖公开浏览、用户登录注册、发帖互动、个人主页、我的中心与管理后台全流程。

## 技术栈

- Vue 3（组合式 API + `<script setup>`）+ Vite 6
- Pinia 状态管理 + Vue Router 4（含全局前置/后置守卫）
- Axios 统一封装（请求拦截器自动带 token，响应拦截器统一解包 `{code, msg, data}` 并提示错误）
- Element Plus 2.x（全局注册图标、中文语言包）
- JavaScript（无 TypeScript 依赖）

## 快速开始

```bash
npm install
npm run dev
```

启动后访问 http://localhost:5173 （端口被占用时 Vite 会自动换端口）。

- 构建产物：`npm run build`，预览：`npm run preview`
- 后端地址：`http://localhost:8080`（Vite proxy 已将 `/publicApi`、`/api`、`/logout` 代理到后端，前端无需跨域配置）
- 短信验证码为后端模拟实现，验证码打印在后端控制台。

## 目录结构

```
world-community/
├── vite.config.js            # Vite 配置：@ 别名、/publicApi /api /logout 代理
├── index.html
└── src/
    ├── main.js               # 入口：Pinia / Router / Element Plus
    ├── App.vue               # 根组件：启动时恢复登录态 + 刷新未读数
    ├── constants/enums.js    # 魔法数字枚举（mediaType/collectType/reportType/role…）
    ├── utils/
    │   ├── request.js        # Axios 封装（拦截器、401/403 处理）
    │   ├── auth.js           # useAuthGuard 登录引导
    │   └── format.js         # 时间/数字格式化
    ├── api/                  # 按模块拆分，函数名对应 operationId
    │   ├── user.js  sms.js  post.js  comment.js  collect.js
    │   ├── follow.js  notification.js  report.js  admin.js
    ├── stores/user.js        # 用户态：token/userInfo/未读数，localStorage 持久化
    ├── router/index.js       # 路由 + 守卫（requiresAuth / requiresAdmin / guestOnly）
    ├── components/
    │   ├── AppHeader.vue     # 顶栏（导航/未读角标/用户菜单）
    │   ├── PostCard.vue      # 帖子卡片（点赞/收藏/不感兴趣/封面/类型角标）
    │   ├── CommentTree.vue   # 评论树（一级分页+子评论懒加载、回复、点赞、不喜欢折叠、举报、删除）
    │   ├── ImageUpload.vue   # 多图上传（拖拽排序、删除、预览，提交时统一组 FormData）
    │   ├── PaginationBar.vue / EmptyState.vue
    │   ├── UserCard.vue      # 关注/粉丝卡片
    │   └── ReportDialog.vue  # 通用举报弹窗
    └── views/
        ├── Home.vue          # 首页：信息流 + 标题搜索 + 分页 + 不感兴趣过滤
        ├── Login.vue         # 密码登录 / 短信登录（60s 倒计时）
        ├── Register.vue      # 注册（成功后自动登录）
        ├── PostDetail.vue    # 详情：轮播/点赞/收藏/举报/评论/本人编辑删除
        ├── PostEdit.vue      # 发布/编辑（multipart/form-data + 多图排序）
        ├── UserProfile.vue   # 个人主页：信息卡/关注/作品/关注/粉丝
        ├── my/               # 我的：资料/收藏/通知/改密/注销（嵌套路由+侧边菜单）
        ├── admin/            # 管理后台：用户管理/举报审核（仅 role=1）
        └── NotFound.vue
```

## 鉴权设计（对应路径前缀语义）

| 前缀 | 权限 | 实现 |
| --- | --- | --- |
| `/publicApi/**` | 免登录 | 首页、详情、评论列表直接浏览；点赞/收藏/关注/评论等操作用 `useAuthGuard()` 引导登录（提示 + 跳登录页带回跳地址） |
| `/api/web/**` | 需登录 | 路由 `meta.requiresAuth` 守卫 + Axios 拦截器双重保障；401/403 清 token 并跳登录 |
| `/api/admin/**` | 需管理员 role=1 | 路由 `meta.requiresAdmin` 守卫，非管理员强制回首页 |

- 登录/注册成功：`data = {token, user}`，token 存 localStorage，user 写 Pinia（同时持久化，刷新页面自动恢复）
- Axios 请求拦截器：自动附加 `Authorization: Bearer {token}`
- 响应拦截器：`code=200` 直接返回 `data`；`code≠200` 用 `ElMessage` 展示 `msg` 并 reject；401/403 清登录态跳登录页

## 特殊接口实现说明

1. **发帖/改帖（multipart/form-data）**
   - 发布 `POST /api/web/post/add`：FormData 含 `news`（JSON 字符串 `{"title","content"}`）+ `newImages`（文件数组）
   - 编辑 `PUT /api/web/post/update/{id}`：`news` + `newImages` 走 FormData；`keepMediaList`、`newMediaSortList` 按文档以 JSON 字符串拼在 URL query（后端两种方式均支持）
   - 编辑时旧图排序：`keepMediaList=[{"id":15,"sortOrder":1},…]`（保留的旧图按最终顺序编号）；新图：`newMediaSortList=[1,2,…]`（新图相对顺序）
2. **评论层级**：一级评论 `parentId=0`、不传 `toUserId`；回复某条评论时 `parentId` 与 `toUserId` 都传（子评论回复额外带 `rootCommentId`）
3. **短信验证码**：模拟实现，按钮 60 秒倒计时；登录 `scene=2`、注册 `scene=1`
4. **mediaType**：1 纯文字（卡片不显示封面）/ 2 图文 / 3 视频（封面加播放角标）/ 4 混合；首页列表来自 `News` 自带 `mediaType`，收藏/作品列表来自 `PostCardVO`（无该字段，按 cover 是否存在推断）
5. **评论不喜欢折叠**：`POST /comment/dislike` 后本地折叠；加载评论时批量调用 `POST /comment/dislike/list` 恢复已折叠状态，支持"展开查看"
6. **通知**：单条已读传 `notificationId`；不传 = 全部已读；顶栏铃铛显示未读数（路由切换后自动刷新）

## 已验证

- `npm install` 成功；`npm run build` 通过（0 错误）；`npm run dev` 正常启动
- 浏览器实测：首页真实渲染后端帖子数据、详情页/登录页正常、未登录访问 `/my` 被守卫重定向到 `/login?redirect=/my/profile`、无控制台报错
- Vite 代理实测连通：`/publicApi/web/post/page` 返回后端真实数据

---

## ⚠️ 缺口清单（需你/后端确认）

以下内容接口文档未给出明确取值或能力，前端按"约定值/常见约定"实现，请核对：

| # | 项目 | 前端采用的约定 | 影响 |
| --- | --- | --- | --- |
| 1 | `collectType` 取值 | 1=帖子，2=评论 | 影响收藏接口入参 |
| 2 | `reportType` 取值 | 1=帖子，2=评论 | 影响举报接口入参 |
| 3 | 举报审核 `status` 取值 | 0=待审核，1=已通过，2=已驳回 | 影响管理后台筛选与展示 |
| 4 | 管理员处理动作 `action` 取值 | 1=通过，2=驳回 | 影响举报处理接口入参 |
| 5 | 举报原因 `reasonType` 取值 | 前端自定字符串：`SPAM/ILLEGAL/RUMOR/ABUSE/PORN/OTHER` | 后端若不校验可随意；若需枚举请提供 |
| 6 | 编辑帖子图片排序语义 | `keepMediaList.sortOrder`=旧图在新序列中的位置；`newMediaSortList`=新图的相对顺序（`[1,2,…]`） | 若后端要求"所有图片全局位置"需调整传参 |
| 7 | 头像/背景图上传 | 接口文档**没有独立图片上传接口**，个人资料页头像/背景采用"图片 URL 直接填写" | 如需本地上传，请提供上传接口 |
| 8 | 通知 `targetType` 取值 | 约定 1=帖子（点击跳详情）、2=评论（仅标记已读不跳转） | 若取值不同请提供映射 |
| 9 | 视频帖子 | `News` 无视频 URL 字段，视频类型帖子仅按封面+正文展示，不内嵌播放器 | 如需视频播放请提供字段 |
| 10 | 首页点赞/收藏初始状态 | 公开列表接口不返回当前用户的点赞/收藏状态，卡片初始为"未点赞/未收藏"，点击后本地维护状态 | 若需初始状态需登录后逐帖查询或后端补充字段 |
| 11 | 修改密码成功后 | 仅提示成功，不强制重新登录 | 如需强制下线请告知 |

> 说明：接口文档中已明确描述的字段（`mediaType`、`role`、`scene`、帖子/账号 `status`、`isRead` 等）均已按文档实现，不在上表。
