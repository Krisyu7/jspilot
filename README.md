# JSPilot

AI驱动的求职自动化工具，把投一份简历的时间从30分钟压缩到2分钟。

## 快速开始

### 前置条件
- Python 3.10+
- Node.js 18+
- SerpApi Key（免费注册：https://serpapi.com）
- Gemini API Key（免费注册：https://aistudio.google.com）

### 后端启动

```bash
cd backend
cp .env.example .env
# 编辑 .env 填入你的 API Key
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

## 项目结构

```
jspilot/
├── backend/        # Python + FastAPI
├── frontend/       # Next.js + TypeScript
└── extension/      # Chrome插件
```

## 功能

- 上传简历，AI自动解析
- 每日自动抓取加拿大职位
- AI分析匹配度并排序
- 一键生成定制Cover Letter
- Chrome插件自动填表
