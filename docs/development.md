# Academia Arena — 开发说明

## 环境要求

- Node.js 24+
- pnpm 10（`corepack enable pnpm`，版本由 `packageManager` 字段固定）

## 常用命令

```bash
pnpm install --frozen-lockfile   # 按锁文件安装
pnpm dev                         # 开发服务器
pnpm test                        # 引擎与 i18n 回归测试（vitest）
pnpm build                       # TypeScript 检查 + Vite 生产构建
pnpm check                       # test + build，CI 使用的同一条命令
pnpm preview                     # 预览 dist/
```

生产构建输出在 `dist/`，Pages 部署地址为 <https://thedavidweng.github.io/Academia-Arena/>，
`vite.config.ts` 的 `base` 必须保持 `/Academia-Arena/`。

## 结构

```
src/
├── data/entities.ts    卡牌与特质数据（从原型页面提取，原型已删除）
├── game/game.ts        boardgame.io Game 定义：moves、phases、AI enumerate
├── game/types.ts       G 与 move 参数类型
├── components/         Arena（棋盘容器）、Card、Lane、StaminaAction、GameLog
├── i18n/               en.json / zh.json 与 i18next 初始化
├── App.tsx             客户端入口：单人对 AI 或本地双人
└── main.tsx            React 挂载点
```

游戏逻辑与 UI 完全分离：`src/game/game.ts` 不引用任何 React 代码，可以直接在
Node 服务端复用。

## 模式

- **单人对战 AI**：`Local({ bots: { '1': RandomBot } })`，AI 只在本机运行。
- **本地双人**：同一台设备轮流操作，每回合开始前有交接屏幕，避免看到对方手牌。

两种模式都只使用 boardgame.io 的 `Local` 传输，不连接任何外部服务。

## 规则要点

- 三个区域：Presentations（演讲）、Assignments（作业）、Exams（考试）。
- 每回合最多打出一张牌，然后点“结束回合”。出牌后到结束回合之间可以撤销/重做，
  但**揭示了随机或隐藏信息的出牌不可撤销**（协同掷骰、抽牌、随机移除、尝试随机判定事件抵消），
  否则玩家可以靠撤销免费预知结果。精力动作与特质技能同样不可撤销。
- 双方都放弃本学期时结算，先赢 2 个学期者赢得学年；同分则双方各得 1 分。
- 学期之间手牌与精力保留，`stayOnField` 卡牌留在场上。
- 精力：概率锁定 2（保证下次协同成功）、状态压制 1（本学期内压制自身负面特质）、
  资源置换 3（抽 1 张）。

## 测试

`pnpm test` 覆盖引擎边界（先手、学期结算、Best-of-3、stayOnField、负面特质压制、
非法 move、协同与概率锁定、回合适配）与 i18n 完整性（两种语言键一致、无遗漏
占位符、组件使用的键全部存在）。新增规则时同时补一条会随规则破坏而失败的断言。

## CI

- `CI`：冻结安装、`pnpm check`、生产依赖审计。
- `Pages`：`main` 上构建 `dist/` 并部署到 GitHub Pages。
- `Workflow lint`、`Mirror to Codeberg`、Dependabot 自动合并沿用既有配置。

所有 Actions 使用完整 commit SHA 固定版本。
