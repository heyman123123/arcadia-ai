/**
 * API 路径常量
 *
 * 阶段 0 重构时还是直接写字符串(在 App.tsx 里),
 * 阶段 3 引入 api/ 层时,前端用这些常量替代裸字符串。
 * 阶段 2 后端 MVC 拆 routes 时,也用这些常量做 mount point。
 */

export const API_ROUTES = {
  book: {
    generateInit: '/api/books/generate-init',
    suggestKbEntry: '/api/books/suggest-kb-entry',
    generateElement: '/api/books/generate-element',
  },
  agent: {
    runPipelineStep: '/api/agent/run-pipeline-step',
    rollOutline: '/api/agent/roll-outline',
  },
  health: '/api/health',
} as const;
