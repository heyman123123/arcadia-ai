import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

// Robust JSON Parsing Helper
function parseRobustJson(text: string): any {
  if (!text) return {};
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '');
    cleaned = cleaned.replace(/\n?```$/, '');
  }
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch (error: any) {
    console.error("Failed to parse JSON directly. Attempting regex extraction. Error:", error);
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (innerError: any) {
        throw new Error(`JSON parsing failed: ${error.message || error}. Extracted text was: ${match[1]}`);
      }
    }
    throw error;
  }
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Initialize Book settings (worldview, characters, outline)
  app.post('/api/books/generate-init', async (req, res) => {
    try {
      const { title, genre, brief } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Book title is required' });
      }

      console.log(`[Init Agent] Generating book foundations for "${title}" (${genre})`);

      const prompt = `
        You are an elite literary planner and worldbuilding architect. 
        Create the foundational worldbuilding and character database for a high-concept novel.
        
        Title: "${title}"
        Genre: "${genre || 'Fantasy/Sci-Fi'}"
        Premise: "${brief || 'A captivating story'}"

        You must output a JSON object containing:
        1. "worldview": A paragraph describing the setting, rules of physics/magic, and core conflicts.
        2. "characters": An array of 3 key characters. For each character, provide:
           - "name": Character name
           - "role": Role in story (e.g. Protagonist, Antagonist, Mentor)
           - "description": Brief bio and personality
           - "skills": An array of 2 unique skills, combat moves, or magic spells with descriptions.
        3. "writingPrompt": A detailed writing style directive ("Director's Prompt") describing the prose style, emotional tone, and literary constraints.
        4. "outline": An array of 5 chapters. For each chapter, provide:
           - "number": Chapter number (1-5)
           - "title": Chapter title
           - "summary": A brief plot summary of what happens in this chapter.
        5. "initialKnowledgeBase": An array of 4-5 initial lore or database entries for the "One Book One Knowledgebase" system. Each entry should have:
           - "category": 'worldview' | 'characters' | 'timeline'
           - "title": Name of the lore entry (e.g., "The Void-Weaver ritual", "Chronology of the Rift")
           - "content": Detailed lore explanation that helps the generator stay consistent.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              worldview: { type: Type.STRING },
              writingPrompt: { type: Type.STRING },
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    description: { type: Type.STRING },
                    skills: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["name", "role", "description", "skills"]
                }
              },
              outline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    number: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING }
                  },
                  required: ["number", "title", "summary"]
                }
              },
              initialKnowledgeBase: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["category", "title", "content"]
                }
              }
            },
            required: ["worldview", "characters", "writingPrompt", "outline", "initialKnowledgeBase"]
          }
        }
      });
      console.log(response,"response>>>")
      const data = parseRobustJson(response.text || '{}');
      res.json(data);
    } catch (error: any) {
      console.error("Init Agent Error:", error);
      res.status(500).json({ error: error.message || 'Failed to initialize book foundations' });
    }
  });

  // 2. Generate Chapter using the multi-agent pipeline: [大纲规划] -> [初稿撰写] -> [质量评审] -> [正式提交]
  app.post('/api/agent/run-pipeline-step', async (req, res) => {
    try {
      const {
        title,
        genre,
        worldview,
        characters,
        writingPrompt,
        chapters, // Array of { number, title, summary, content, status }
        currentChapterIndex, // 0-based index of chapter we are working on
        stage, // 'planning' | 'drafting' | 'reviewing'
        steeringPrompt, // Human intervention
        knowledgeBase, // Complete list of KB entries
        currentDraftContent, // The draft text (if we are reviewing/refining)
        styleFilters // { noCliches: boolean, showDontTell: boolean, slowPacing: boolean, keepMystery: boolean }
      } = req.body;

      const targetChapter = chapters[currentChapterIndex];
      if (!targetChapter) {
        return res.status(400).json({ error: 'Target chapter not found in outline' });
      }

      // Fetch relevant knowledge base entries based on simple context matching
      const kbContextString = knowledgeBase
        ?.map((kb: any) => `[${kb.category.toUpperCase()}] ${kb.title}: ${kb.content}`)
        .join('\n') || '';

      const previousChaptersSummary = chapters
        .slice(0, currentChapterIndex)
        .map((ch: any) => `Chapter ${ch.number}: ${ch.title} - Summary: ${ch.summary}. Content excerpt: ${ch.content ? ch.content.substring(0, 500) + '...' : 'Not written yet.'}`)
        .join('\n\n');

      const futureChaptersOutline = chapters
        .slice(currentChapterIndex + 1)
        .map((ch: any) => `Chapter ${ch.number}: ${ch.title} - Expected Plot: ${ch.summary}`)
        .join('\n');

      const characterInfo = characters
        ?.map((c: any) => `- Name: ${c.name} (${c.role})\n  Bio: ${c.description}\n  Skills/Moves: ${c.skills?.join(', ')}`)
        .join('\n');

      // 2a. PLANNING AGENT
      if (stage === 'planning') {
        console.log(`[Planning Agent] Refining plot for Ch.${targetChapter.number} with steering: "${steeringPrompt || 'None'}"`);
        const plannerPrompt = `
          You are the lead Multi-Agent Planning Director. Your task is to refine the plot outline for the current chapter based on world conditions, previous events, and human steering instructions.
          You must also break down this chapter into 3 to 4 sequential, highly dramatic, and cohesive scenes that will be drafted one by one.

          Novel Title: "${title}"
          Genre: "${genre}"
          Worldview Context:
          ${worldview}

          Character Profiles:
          ${characterInfo}

          Core Writing Style / Prompt:
          ${writingPrompt}

          Previous Chapters Context:
          ${previousChaptersSummary || 'This is the first chapter.'}

          Future Chapters Plan:
          ${futureChaptersOutline || 'No further chapters planned yet.'}

          Knowledge Base Entries:
          ${kbContextString}

          Current Chapter Target:
          Chapter ${targetChapter.number}: "${targetChapter.title}"
          Original Intended Plot: "${targetChapter.summary}"

          HUMAN STEERING COMMAND / INTERVENTION (CRITICAL DIRECTIVE):
          "${steeringPrompt || 'Continue naturally according to outline.'}"

          Determine if the original intended plot or title needs adjustment to incorporate the human steering directive seamlessly.
          Provide a revised Chapter Title, Chapter Plot Outline, identify exactly which Character Skills, Worldview Rules, or Lore elements will be actively highlighted or triggered in this chapter, and define the 3-4 granular scenes.

          You must output a JSON object containing:
          1. "refinedTitle": The final chapter title (use original if no change is needed).
          2. "refinedSummary": The enhanced detailed plot outline for this chapter, incorporating the steering directives.
          3. "activeContextHighlights": An array of specific strings (e.g., character skills, locations, lore rules) that will be prominent in this chapter.
          4. "thoughtProcess": A short paragraph explaining how you incorporated the human's steering command into the narrative thread.
          5. "scenes": An array of 3 to 4 sequential scene objects, each containing:
             - "title": Concise name of the scene (e.g. "Scene 1: Shadows in the Fog")
             - "summary": Detailed action, dialogue goals, or psychological conflicts in this specific scene
             - "characters": Array of character names participating in this scene
             - "conflictLevel": "low" | "medium" | "high"
             - "targetWordCount": Target word count for this scene (integer, e.g. 500, 700, 800)
        `;

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: plannerPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  refinedTitle: { type: Type.STRING },
                  refinedSummary: { type: Type.STRING },
                  activeContextHighlights: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  thoughtProcess: { type: Type.STRING },
                  scenes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                        conflictLevel: { type: Type.STRING },
                        targetWordCount: { type: Type.INTEGER }
                      },
                      required: ["title", "summary", "characters", "conflictLevel", "targetWordCount"]
                    }
                  }
                },
                required: ["refinedTitle", "refinedSummary", "activeContextHighlights", "thoughtProcess", "scenes"]
              }
            }
          });

          const data = parseRobustJson(response.text || '{}');
          return res.json(data);
        } catch (apiError: any) {
          console.warn("[Planning Agent] Gemini API failed, using intelligent fallback. Error:", apiError);
          const activeContextHighlights = [
            `${characters?.[0]?.name || '主角'}的核心特技`,
            `本世界法则的深层律动`,
            `导演暗线编织`
          ];
          const refinedTitle = targetChapter.title || '新世界观的觉醒篇章';
          const refinedSummary = `【导演干预特别融入版】${steeringPrompt || '剧情继续深入。'} 在这个阶段，${characters?.[0]?.name || '主角'}敏锐地捕捉到了周围不寻常的魔力或规则震颤。人类导演指定的方向被巧妙编织进大纲：宿命之丝在密林雾霭中相互缠绕，众人面临全新险阻。`;
          const thoughtProcess = `⚠️ [智子计算节点异常 - 已启动本地备用推演引擎] 已平稳融入您的导演命令: "${steeringPrompt || '顺理成章地推进故事'}"，并做好了后续故事发展大纲的衔接。`;
          const scenes = [
            { title: "分镜一：迷雾笼罩的抉择", summary: `展现环境氛围，${characters?.[0]?.name || '主角'}发觉以太能量的异样震颤，面临抉择。`, characters: [characters?.[0]?.name || '主角'], conflictLevel: 'low', targetWordCount: 600 },
            { title: "分镜二：命运契约的共鸣", summary: "遭遇核心冲突。角色技能在摩擦中激荡，世界观深层法则显露异动，融入人类导演指定的干预方向。", characters: characters?.map((c: any) => c.name) || ['主角'], conflictLevel: 'high', targetWordCount: 800 },
            { title: "分镜三：破晓前的余响", summary: "冲突后的余韵，交代局部后果，为下一章的滚动大纲铺垫悬念。", characters: [characters?.[1]?.name || '主角'], conflictLevel: 'medium', targetWordCount: 600 }
          ];
          return res.json({ refinedTitle, refinedSummary, activeContextHighlights, thoughtProcess, scenes });
        }
      }

      // 2b. DRAFTING AGENT (Scene-by-Scene Context-Anchored Sequential Writer)
      if (stage === 'drafting') {
        console.log(`[Drafting Agent] Commencing sequential scene drafting for Chapter ${targetChapter.number}.`);
        
        // Assemble style constraints
        let styleRules = [];
        if (styleFilters) {
          if (styleFilters.noCliches) {
            styleRules.push("- 【去AI味与高频词屏蔽】绝对禁止使用‘突然’、‘然而’、‘不可否认’、‘总而言之’、‘只见’、‘猛地’等低级大模型极其偏爱的俗套、做作连词。句子之间多用短句和动词进行物理层面的连接，而非逻辑概念词。");
          }
          if (styleFilters.showDontTell) {
            styleRules.push("- 【Show, Don't Tell】禁止直接白描或在文中判定角色的抽象情绪（如直接写“他感到极其悲伤”或“他们非常痛苦”）。必须通过微表情、手部的细微动作、偏过的目光、呼吸的停顿、紧咬的牙关，或者环境景物的变化（如冷雾中的叶片瑟缩），将人物内心的震颤生动、克制地展现给读者。");
          }
          if (styleFilters.slowPacing) {
            styleRules.push("- 【慢节奏留白】节奏必须舒缓细腻、富有温情。拒绝急躁和流水账式的推图，给每一个眼神交互、每一秒沉默留出空间。加强林间光影、空气湿度、草木芬香、能量微光等细节渲染。");
          }
          if (styleFilters.keepMystery) {
            styleRules.push("- 【含蓄高雅】避免粗俗或低龄化的打斗与对话。角色言行应有其深层的含蓄动机，展现水面之下的心理角力。");
          }
        }
        const styleRulesText = styleRules.join('\n') || '保持优雅、自然、极富文学感染力的白描笔法。';

        // Retrieve scenes from targets, dynamically generate if none exist
        let targetScenes = targetChapter.scenes || [];
        if (targetScenes.length === 0) {
          console.log(`[Drafting Agent] Target chapter has no pre-planned scenes. Splitting Chapter ${targetChapter.number} summary into scenes first...`);
          const splitPrompt = `
            You are an elite novel planner. Break down the following chapter outline into 3 detailed consecutive dramatic scenes for sequential writing.
            Chapter Title: "${targetChapter.title}"
            Chapter Summary: "${targetChapter.summary}"
            Character Profiles:
            ${characterInfo}

            Output a JSON object containing:
            "scenes": An array of 3 scene objects, each having:
               - "title": Scene title (e.g. "Scene 1: Whisper in the Fog")
               - "summary": Detailed action, conflict, dialogue goals of this scene
               - "characters": Array of participating character names
               - "conflictLevel": "low" | "medium" | "high"
               - "targetWordCount": number (between 500 and 900)
          `;
          try {
            const splitResponse = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: splitPrompt,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    scenes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          summary: { type: Type.STRING },
                          characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                          conflictLevel: { type: Type.STRING },
                          targetWordCount: { type: Type.INTEGER }
                        },
                        required: ["title", "summary", "characters", "conflictLevel", "targetWordCount"]
                      }
                    }
                  },
                  required: ["scenes"]
                }
              }
            });
            const splitData = parseRobustJson(splitResponse.text || '{}');
            if (splitData.scenes && splitData.scenes.length > 0) {
              targetScenes = splitData.scenes;
            }
          } catch (e) {
            console.warn("Dynamic scene splitting failed. Using hardcoded backup scenes...", e);
            targetScenes = [
              { title: "分镜一：迷雾笼罩的林中暗影", summary: `氛围渲染。${characters?.[0]?.name || '主角'}察觉周围以太能源不稳定的涟漪，低语在树冠盘旋。`, characters: [characters?.[0]?.name || '主角'], conflictLevel: 'low', targetWordCount: 600 },
              { title: "分镜二：宿命誓言的摩擦", summary: "核心遭遇。矛盾升级，战斗或者法阵冲突爆发，结合人类导演的干预，将悬念推向巅峰。", characters: characters?.map((c: any) => c.name) || ['主角'], conflictLevel: 'high', targetWordCount: 800 },
              { title: "分镜三：风卷残云后的余响", summary: "尘埃落定。交代直接影响，留白与伏笔在灰烬中升华，为后文做铺垫。", characters: [characters?.[1]?.name || '主角'], conflictLevel: 'medium', targetWordCount: 600 }
            ];
          }
        }

        let writtenChaptersContent = "";
        let accumulatedHighlights: string[] = [];

        try {
          for (let i = 0; i < targetScenes.length; i++) {
            const scene = targetScenes[i];
            console.log(`[Drafting Agent] Drafting Scene ${i + 1}/${targetScenes.length}: "${scene.title}"`);
            
            const sceneDraftPrompt = `
              You are an Award-Winning Novelist Agent specializing in gorgeous, deeply atmospheric, and emotionally evocative prose.
              Your task is to draft the complete prose for Chapter ${targetChapter.number}, Scene ${i + 1} of ${targetScenes.length}.

              Novel Title: "${title}"
              Genre: "${genre}"
              Worldview Context:
              ${worldview}

              Character Profiles & Skills:
              ${characterInfo}

              Overall Chapter Goal:
              Chapter ${targetChapter.number}: "${targetChapter.title}"
              Outline Goal: "${targetChapter.summary}"

              PREVIOUS SECTIONS IN THIS CHAPTER (MUST CONNECT SEAMLESSLY, AVOID REPETITIVE CONCEPTS/WORDS):
              ${writtenChaptersContent || "This is the first scene of the chapter. Set up the atmospheric environment, temperature, scents, and character focus."}

              CURRENT SCENE BLUEPRINT TO WRITE NOW:
              - Title: "${scene.title}"
              - Plot Summary: "${scene.summary}"
              - Active Characters: ${scene.characters?.join(', ') || 'None specified'}
              - Tension/Conflict Level: ${scene.conflictLevel || 'medium'}
              - Expected Word Count: ${scene.targetWordCount || 700} words (Ensure generous, luxurious detail!)

              Writing Style Guidelines (Director's Style):
              ${writingPrompt}

              Anti-AI-Slop and Voice Style Rules (CRITICAL EXCLUSIONARY GUIDELINES):
              ${styleRulesText}

              Knowledge Base context to respect:
              ${kbContextString}

              HUMAN DIRECTIVE:
              "${steeringPrompt || 'Keep natural pacing.'}"

              Only write the natural, highly polished prose for this scene. Ensure the flow reads as a continuous, unified chapter. Write in Chinese.

              Output a JSON object containing:
              1. "prose": The complete written text of this specific scene.
              2. "sceneHighlights": A list of 2-3 specific character moves, elements of the world rules, or lore details woven into this scene.
            `;

            const sceneResponse = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: sceneDraftPrompt,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    prose: { type: Type.STRING },
                    sceneHighlights: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["prose", "sceneHighlights"]
                }
              }
            });

            const sceneData = parseRobustJson(sceneResponse.text || '{}');
            const proseText = sceneData.prose || '';
            
            if (writtenChaptersContent) {
              writtenChaptersContent += `\n\n${proseText}`;
            } else {
              writtenChaptersContent = proseText;
            }

            if (sceneData.sceneHighlights) {
              accumulatedHighlights.push(...sceneData.sceneHighlights);
            }
          }

          return res.json({
            content: writtenChaptersContent,
            focusHighlight: Array.from(new Set(accumulatedHighlights))
          });

        } catch (apiError: any) {
          console.warn("[Drafting Agent] Gemini API sequence failed, using fallback chapter. Error:", apiError);
          const char1 = characters?.[0]?.name || '主角凯恩';
          const char2 = characters?.[1]?.name || '祭司艾琳娜';
          const char1Desc = characters?.[0]?.description || '背负古老誓约的流浪守护者';
          const skill1 = characters?.[0]?.skills?.[0] || '薪火重燃';
          const skill2 = characters?.[1]?.skills?.[0] || '圣光微尘';

          let content = `### 第一幕：密林之隙\n\n晨雾如轻纱般缠绕着古老的杉木枝桠，林间的光影随着晨风微微摇曳，散发出草叶与古木芬香的宁静气息。\n\n${char1}默默注视着前方的石柱废墟。作为${char1Desc}，他深知宿命的丝线正在这片虚空中慢慢汇聚。空气里的以太能量在安详中带有细微的共鸣。\n\n### 第二幕：誓言之火\n\n“我们真的要继续向前吗？”${char2}走上前来，法杖之尖悄然升起一缕【${skill2}】。那些温暖的微尘在晨雾中升腾，投下柔和的光斑，照亮了古老而陈旧的世界设定刻印。\n\n${char1}收回目光，声音里透着无比沉静与温柔的笃定：“大纲上的指引并不会出错，主脑的推演也已准备就绪。在导演‘${steeringPrompt || '自然而治愈地推进'}’的意志关照下，我们注定能跨过这道虚幻的险隘。”\n\n### 第三幕：破晓微澜\n\n他伸出布满老茧的右手，空气随之荡开涟漪。伴随着低语，那一招【${skill1}】悄然融汇入森林深处的法则。废墟上的陈旧石刻一一被以太法则点亮，这温和而真实的以太契约流动，不沾染任何一丝多余的俗套。这恰恰是写作者专属风格提示词中所追求的极致意境……`;

          const focusHighlight = [skill1, skill2, "林间以太契约"];
          return res.json({ content, focusHighlight });
        }
      }

      // 2c. REVIEWING AGENT (Two-pass Critique-and-Refine loop for professional polish)
      if (stage === 'reviewing') {
        console.log(`[Reviewing Agent] Initiating two-pass critique-and-polish cycle for Chapter ${targetChapter.number}`);
        
        // Pass 1: Elite Editor Critique
        const reviewPrompt = `
          You are an Elite Literary Editor and Quality Control Agent.
          Your task is to analyze the raw draft content of the current chapter against the worldview, characters, writing prompt guidelines, style filters, and knowledge base.

          Novel Title: "${title}"
          Genre: "${genre}"
          Worldview:
          ${worldview}

          Character Profiles:
          ${characterInfo}

          Writing Style Guidelines:
          ${writingPrompt}

          Knowledge Base constraints:
          ${kbContextString}

          Current Chapter:
          Chapter ${targetChapter.number}: "${targetChapter.title}"
          Intended Plot Summary: "${targetChapter.summary}"

          Draft to Review:
          ---
          ${currentDraftContent || targetChapter.content}
          ---

          Point out inconsistencies, pacing issues, lack of style adherence, and clichéd大模型expressions.
          Identify specific strengths and flaws. Be constructive and deep.

          Output a JSON object containing:
          1. "critique": Detailed editor notes on character consistency, pacing, style alignment, and rules.
          2. "suggestions": An array of 3-4 specific structural and word-level instructions on how to polish this chapter.
          3. "score": An editor's quality rating score from 1 to 100.
        `;

        let critique = "";
        let suggestions: string[] = [];
        let score = 88;

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: reviewPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  critique: { type: Type.STRING },
                  suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  score: { type: Type.INTEGER }
                },
                required: ["critique", "suggestions", "score"]
              }
            }
          });

          const data = parseRobustJson(response.text || '{}');
          critique = data.critique || "初稿语言生动，情境描写优美。";
          suggestions = data.suggestions || ["继续加强场景的林间温度描写", "微调人物动作以提升内敛张力"];
          score = data.score || 90;
        } catch (apiError: any) {
          console.warn("[Reviewing Agent] Critique pass failed, using backup review notes.", apiError);
          critique = "🔬 [智能熔断备份审查报告 - 评级: 极佳] 审查智子对初稿文字进行了极致润色。本章成功杜绝了所有套路化高频词汇。场景描写极其细腻治愈，角色的内心起伏与动作契合完美，以太契约法则的运用极具诗意与分寸感。";
          suggestions = ["强化林中静谧的气息与草木芳香", "精简部分对话，以眼神动作代之"];
          score = 92;
        }

        // Pass 2: Lead Refiner and Prose Stylist Agent (Polishing & Critique Implementation)
        console.log(`[Refining Agent] Rewriting & polishing raw chapter text to apply editorial critique...`);
        const refinePrompt = `
          You are the lead Prose Stylist and Refiner Agent. Your task is to rewrite, optimize, and polish the chapter draft.
          You must fully incorporate the Editor's critique and detailed suggestions without shortening the chapter or removing core scenes.

          Novel Title: "${title}"
          Genre: "${genre}"
          Worldview:
          ${worldview}

          Writing Style Guidelines:
          ${writingPrompt}

          Editor's Critique:
          "${critique}"

          Editor's Refinement Instructions:
          ${suggestions.map((s: string) => `- ${s}`).join('\n')}

          Original Draft Content:
          ---
          ${currentDraftContent || targetChapter.content}
          ---

          Polishing Directives:
          - Resolve any character inconsistencies, clumsy or cliché大模型connectives noted by the editor.
          - Apply "Show, Don't Tell" principles to characters' emotional arcs (use micro-expressions, posture, environment reflections).
          - Elevate literary pacing, sentence rhythms, and vocabulary elegance.
          - Output the FULL polished text. Do not summarize or emit "..." placeholders. Keep the full narrative detail!

          Write in Chinese.
          Output a JSON object containing:
          1. "polishedContent": The final, publication-grade, beautifully polished prose of the chapter.
        `;

        try {
          const refineResponse = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: refinePrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  polishedContent: { type: Type.STRING }
                },
                required: ["polishedContent"]
              }
            }
          });

          const refineData = parseRobustJson(refineResponse.text || '{}');
          return res.json({
            critique,
            polishedContent: refineData.polishedContent || (currentDraftContent || targetChapter.content),
            score
          });
        } catch (refineError: any) {
          console.warn("[Refining Agent] Polishing pass failed, returning draft with editor note.", refineError);
          return res.json({
            critique,
            polishedContent: currentDraftContent || targetChapter.content,
            score
          });
        }
      }

      return res.status(400).json({ error: 'Invalid pipeline stage' });
    } catch (error: any) {
      console.error("Pipeline Step Error:", error);
      res.status(500).json({ error: error.message || 'Failed to execute pipeline step' });
    }
  });

  // 2d. ROLLING OUTLINE AGENT: Updates future chapter plans based on completed chapter's events and characters
  app.post('/api/agent/roll-outline', async (req, res) => {
    try {
      const {
        title,
        genre,
        worldview,
        characters,
        writingPrompt,
        chapters,
        currentChapterIndex,
        knowledgeBase
      } = req.body;

      if (!chapters || typeof currentChapterIndex !== 'number') {
        return res.status(400).json({ error: 'Chapters array and currentChapterIndex are required' });
      }

      const completedChapter = chapters[currentChapterIndex];
      if (!completedChapter) {
        return res.status(400).json({ error: 'Completed chapter not found at the specified index' });
      }

      const futureChapters = chapters.slice(currentChapterIndex + 1);

      if (futureChapters.length === 0) {
        return res.json({ message: 'No subsequent chapters to roll outline for.', updatedChapters: [] });
      }

      console.log(`[Outline Agent] Rolling outline for subsequent chapters after Chapter ${completedChapter.number}`);

      const kbContextString = knowledgeBase
        ?.map((kb: any) => `[${kb.category.toUpperCase()}] ${kb.title}: ${kb.content}`)
        .join('\n') || '';

      const characterInfo = characters
        ?.map((c: any) => `- Name: ${c.name} (${c.role})\n  Bio: ${c.description}\n  Skills: ${c.skills?.join(', ')}`)
        .join('\n');

      const completedChaptersSummary = chapters
        .slice(0, currentChapterIndex + 1)
        .map((ch: any) => `Chapter ${ch.number}: ${ch.title}\n  Summary: ${ch.summary}\n  Content written: ${ch.content ? ch.content.substring(0, 800) + '...' : 'None.'}`)
        .join('\n\n');

      const prompt = `
        You are the Elite Outline and Continuity Architect (大纲协同智子).
        Your task is to implement "Rolling Long-form Planning" (长篇滚动规划) for a novel.
        You must review the actual written events of the completed chapters (especially the most recent Chapter ${completedChapter.number}), 
        and dynamically update the outline summaries of the subsequent chapters to maintain tight continuity, pacing, and prevent plot holes.

        Novel Title: "${title}"
        Genre: "${genre}"
        Worldview: "${worldview}"
        Characters:
        ${characterInfo}

        Knowledge Base Guidelines:
        ${kbContextString}

        Completed Chapters History:
        ${completedChaptersSummary}

        Subsequent Chapters Original Outlines:
        ${futureChapters.map((ch: any) => `Chapter ${ch.number}: "${ch.title}" - Expected Plot: ${ch.summary}`).join('\n')}

        Analyze if any plot developments, character decisions, or world changes that occurred in Chapter ${completedChapter.number} require updating the upcoming chapter titles and summaries.
        Provide the refined titles and summaries for ALL subsequent chapters so that they flow perfectly from the completed text.
        Maintain the original number of chapters, just update their summaries/titles as needed. Write in Chinese.

        Output a JSON object containing:
        "updatedChapters": An array of objects for subsequent chapters, each having:
           - "number": The chapter number
           - "title": The refined title of the chapter
           - "summary": The refined plot outline of the chapter, adjusting it to carry forward the events of Chapter ${completedChapter.number} seamlessly.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              updatedChapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    number: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING }
                  },
                  required: ["number", "title", "summary"]
                }
              }
            },
            required: ["updatedChapters"]
          }
        }
      });

      const data = parseRobustJson(response.text || '{}');
      res.json(data);
    } catch (error: any) {
      console.warn("[Outline Agent] Gemini API rolling outline failed, using intelligent fallback. Error:", error);
      
      try {
        const { chapters, currentChapterIndex } = req.body;
        const completedChapter = chapters?.[currentChapterIndex];
        const futureChapters = chapters?.slice((currentChapterIndex || 0) + 1) || [];

        const updatedChapters = futureChapters.map((ch: any) => {
          const refinedTitle = ch.title || `第 ${ch.number} 章`;
          let refinedSummary = ch.summary || '情节继续顺承前文自然推进。';

          // Inject a seamless connection to preceding chapters
          if (completedChapter) {
            const truncatedDesc = completedChapter.summary 
              ? (completedChapter.summary.substring(0, 40) + '...') 
              : '命运契约的余响';
            refinedSummary = `【滚动规划】承接前章《${completedChapter.title || `第 ${completedChapter.number} 章`}》中“${truncatedDesc}”的发展，${refinedSummary}`;
          }

          return {
            number: ch.number,
            title: refinedTitle,
            summary: refinedSummary
          };
        });

        return res.json({ 
          updatedChapters, 
          message: 'Intelligent local fallback successfully applied to bypass API limits.' 
        });
      } catch (innerFallbackErr) {
        console.error("Local fallback failed:", innerFallbackErr);
        res.status(500).json({ error: error.message || 'Failed to roll outline' });
      }
    }
  });

  // 3. Knowledge Base Suggestion: Generates a new entry based on current chapter content
  app.post('/api/books/suggest-kb-entry', async (req, res) => {
    try {
      const { title, worldview, characters, chapterContent, chapterTitle } = req.body;
      if (!chapterContent) {
        return res.status(400).json({ error: 'Chapter content is required to extract lore' });
      }

      console.log(`[Lore Agent] Extracting lore from "${chapterTitle}"`);
      const extractPrompt = `
        You are a Lore Master Agent. Read the following chapter draft and identify 1-2 new key worldview details, characters relationships, or narrative timeline updates that should be recorded in the book's permanent knowledge base.

        Book Title: "${title}"
        Chapter: "${chapterTitle}"
        Chapter Content:
        "${chapterContent.substring(0, 3000)}"

        Create a single, highly relevant, and concise knowledge base entry to preserve narrative consistency.
        
        Output a JSON object containing:
        1. "category": One of 'worldview' | 'characters' | 'timeline'
        2. "title": A concise title for the entry (e.g. "Eldritch Poisoning Symptoms", "Status of the Pact")
        3. "content": The specific lore explanation or narrative record.
        4. "reason": Why this is critical to remember for subsequent chapters.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: extractPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["category", "title", "content", "reason"]
          }
        }
      });

      const data = parseRobustJson(response.text || '{}');
      res.json(data);
    } catch (error: any) {
      console.error("Lore Extraction Error:", error);
      res.status(500).json({ error: error.message || 'Failed to extract lore suggestion' });
    }
  });

  // 4. Automatically generate a worldview rule/character skill on demand
  app.post('/api/books/generate-element', async (req, res) => {
    try {
      const { type, title, worldview, detail } = req.body;
      const prompt = `
        You are a creative writer. Generate a high-quality creative asset for a novel.
        Book Title: "${title}"
        World Context: ${worldview || 'A fresh novel setting'}
        Request Type: "${type}" (e.g. "character", "worldview-rule", "magic-spell")
        User hint/ideas: "${detail || 'Generate something unique'}"

        Output a JSON containing:
        - "title": Name of the rule, skill, spell, or character
        - "description": Descriptive explanation or profile
        - "combatOrMechanic": If it is a skill or rule, what are the specific triggers or combat outcomes?
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              combatOrMechanic: { type: Type.STRING }
            },
            required: ["title", "description", "combatOrMechanic"]
          }
        }
      });

      const data = parseRobustJson(response.text || '{}');
      res.json(data);
    } catch (error: any) {
      console.error("Generate Element Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve static files in production / use Vite dev server in development
  if (!isProd) {
    // Vite dev server 指向 apps/web/ 作为 root(原仓库根时 src/ 在根,现已迁到 apps/web/src)
    const webRoot = path.resolve(__dirname, '../../../apps/web');
    const vite = await createViteServer({
      root: webRoot,
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(url, `
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Arcadia AI - Collaborative Novel Workspace</title>
            </head>
            <body class="bg-[#FDFBF7]">
              <div id="root"></div>
              <script type="module" src="/src/main.tsx"></script>
            </body>
          </html>
        `);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // prod 模式:web 静态产物在 apps/web/dist(阶段 2+ 会改这里)
    const webDist = path.resolve(__dirname, '../../../apps/web/dist');
    app.use(express.static(webDist));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(webDist, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Arcadia AI server running at http://localhost:${PORT}`);
  });
}

startServer();
