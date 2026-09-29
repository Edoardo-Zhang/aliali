// AliAli 收录白名单：只收录 AI 圈博主与 AI 公司官方账号（B 站 UID 均已通过 card 接口核验）。
// kind: 'official' = 公司 / 机构官方号，'creator' = AI 博主。
// filter: true 表示该账号会发非 AI 内容，需按标题关键词过滤。

export const UPS = [
  // —— 公司 / 机构官方 ——
  { mid: 3546585589877706, name: '通义实验室', kind: 'official' },
  { mid: 3546791320488658, name: '千问大模型', kind: 'official' },
  { mid: 50233288, name: '阿里云', kind: 'official', filter: true },
  { mid: 3494380742642452, name: '智元AGIBOT', kind: 'official' },
  { mid: 3707026228119888, name: '千问办公', kind: 'official' },
  { mid: 3546929323575369, name: '千问APP', kind: 'official' },
  { mid: 3546962917853387, name: 'Qoder', kind: 'official' },
  { mid: 3690994400757975, name: '上纬机器人', kind: 'official' },
  { mid: 31703119, name: '智东西', kind: 'official', filter: true },
  { mid: 88461692, name: '3Blue1Brown', kind: 'official', filter: true },

  // —— AI 博主 ——
  { mid: 1567748478, name: '跟李沐学AI', kind: 'creator' },
  { mid: 49746395, name: 'GenJi是真想教会你', kind: 'creator' },
  { mid: 4401694, name: '林亦LYi', kind: 'creator', filter: true },
  { mid: 12566101, name: '秋葉aaaki', kind: 'creator' },
  { mid: 1900783, name: '同济子豪兄', kind: 'creator' },
  { mid: 20259914, name: '稚晖君', kind: 'creator' },
  { mid: 12890453, name: '程序员鱼皮', kind: 'creator', filter: true },
  { mid: 14848367, name: 'Xuan_酱', kind: 'creator', filter: true },
  { mid: 1815948385, name: '马克的技术工作坊', kind: 'creator' },
  { mid: 385670211, name: '秋芝2046', kind: 'creator', filter: true },
  { mid: 80569724, name: '杜雨说AI', kind: 'creator' },
  { mid: 65564239, name: 'IT咖啡馆', kind: 'creator', filter: true },
  { mid: 3493277319825652, name: 'AI超元域', kind: 'creator' },
  { mid: 491306902, name: '课代表立正', kind: 'creator', filter: true },
  { mid: 1263732318, name: '黑纹白斑马', kind: 'creator', filter: true },
  { mid: 104331347, name: '可lip', kind: 'creator', filter: true },
  { mid: 668097429, name: '轩辕的编程宇宙', kind: 'creator', filter: true },
];

// 判定“AI 相关”的关键词（仅对 filter:true 的账号生效）
export const AI_RE = /AI|A\.I|人工智能|大模型|模型|智能体|Agent|MCP|Skill|Harness|GPT|Claude|Opus|Sonnet|Gemini|OpenAI|Anthropic|DeepSeek|千问|Qwen|通义|Kimi|豆包|文心|混元|智谱|GLM|Llama|LLM|Transformer|神经网络|深度学习|机器学习|强化学习|具身|机器人|自动驾驶|算力|GPU|显卡|英伟达|NVIDIA|芯片|ComfyUI|Stable\s?Diffusion|Midjourney|Sora|Seedance|可灵|生成|AIGC|数字人|Cursor|Copilot|Qoder|编程助手|提示词|Prompt|Token|RAG|向量|推理|训练|微调|开源模型|Vibe|Jev|云栖/i;

// AI 频道（首页频道栏），按标题 / 简介关键词归类
export const CHANNELS = [
  { id: 'llm', name: '大模型', re: /大模型|LLM|GPT|Claude|Opus|Gemini|千问|Qwen|DeepSeek|Kimi|豆包|文心|混元|GLM|Llama|模型/i },
  { id: 'agent', name: '智能体', re: /Agent|智能体|MCP|Skill|Harness|工作流|自动化|Jev|打工/i },
  { id: 'paint', name: 'AI绘画', re: /绘画|ComfyUI|Stable\s?Diffusion|SD|Midjourney|出图|生图|LoRA|Flux|image|整合包/i },
  { id: 'video', name: 'AI视频', re: /视频生成|Sora|可灵|Seedance|漫剧|AI视频|数字人|H3|Veo|动画/i },
  { id: 'robot', name: '具身智能', re: /机器人|具身|人形|机器狗|灵犀|宇树|智元|robot|启元/i },
  { id: 'paper', name: '论文精读', re: /论文|精读|paper|原理|Transformer|注意力|数学|证明|讲明|讲清|综述/i },
  { id: 'code', name: 'AI编程', re: /编程|代码|Coding|Cursor|Qoder|IDE|程序员|开发|Vibe|前端|Github/i },
  { id: 'chip', name: '算力芯片', re: /显卡|GPU|芯片|算力|英伟达|NVIDIA|4090|部署|本地|服务器|Mac/i },
  { id: 'news', name: '行业资讯', re: /发布|大会|云栖|融资|上市|官宣|首发|重磅|报道|新品/i },
  { id: 'tool', name: 'AI工具', re: /教程|工具|入门|实测|上手|体验|评测|保姆/i },
  { id: 'edu', name: '科普', re: /科普|为什么|是什么|秒懂|一次|搞懂|讲透|到底/i },
  { id: 'open', name: '开源', re: /开源|GitHub|Hugging|复刻|权重/i },
];
