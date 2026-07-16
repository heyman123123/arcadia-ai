/**
 * 内置文风提示词模板
 *
 * 原 App.tsx 里的 WRITING_PROMPT_PRESETS 抽到这里。
 * 前后端都可能用到(后端 service 拼 prompt 时可参考,前端用户可选)。
 */

export interface WritingPromptPreset {
  name: string;
  prompt: string;
}

export const WRITING_PROMPT_PRESETS: WritingPromptPreset[] = [
  {
    name: '治愈森林轻文学',
    prompt: '文字风格清新自然、简约治愈。善于运用环境描写(如树叶沙沙、晨雾微光、松脂香气)来烘托角色的心境。节奏舒缓、情感真挚,重点刻画人与自然、人与人之间微妙而温暖的羁绊。',
  },
  {
    name: '蒸汽/木质朋克幻想',
    prompt: '融合机械齿轮与橡木质感。语言具有铜绿斑驳的金属质感与原木馨香。注重对飞船龙骨、以太锅炉和星轨星盘的精确几何描绘,氛围宏大中带着一丝慵懒温情。',
  },
  {
    name: '古风奇幻悬疑',
    prompt: '行文优雅古典,半文半白。侧重于丝丝入扣的推理与惊艳绝伦的道法描写。擅长利用中式意象(如寒梅、檀香、古井、残烛)营造空灵诡谲而又忠义两全的史诗厚重感。',
  },
  {
    name: '极简硬核科幻',
    prompt: '文笔冷峻、高度精炼。使用大量精准的物理、地质和天文学术语。注重思想实验的严密推演,用数学般的秩序美感勾勒出浩瀚星空与微小人类的宿命碰撞。',
  },
];

/** 按名称查找(后端 service 可用) */
export function findWritingPromptPreset(name: string): WritingPromptPreset | undefined {
  return WRITING_PROMPT_PRESETS.find((p) => p.name === name);
}
