import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const TOPICS = [
  '如何在吵架中不翻旧账',
  '冷暴力比吵架更伤人',
  '怎样表达不满又不伤感情',
  '为什么你越解释对方越生气',
  '如何在亲密关系中设立边界',
  '怎样识别对方的情绪暗号',
  '吵架后如何优雅地破冰',
  '为什么你说的"随便"最不随便',
  '怎样让对方觉得被真正倾听了',
  '亲密关系中的"情绪价值"到底是什么',
  '如何面对伴侣的无理取闹',
  '为什么"多喝热水"是情商灾难',
  '怎样在不认输的情况下和解',
  '如何在恋爱中保持自我',
  '对方说"没事"的时候到底有没有事',
];

export async function POST(request: NextRequest) {
  try {
    // 随机选择一个主题
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    // 调用 LLM 生成文章
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const prompt = `你是一个恋爱沟通技巧博主，风格轻松幽默、接地气，擅长用生活中的真实场景来讲道理。

请围绕主题"${topic}"写一篇300-500字的恋爱沟通技巧文章。

要求：
1. 标题要有吸引力，让人想点进来
2. 开头用一个真实场景引入，让读者有代入感
3. 中间要有一个核心观点，用通俗的方式解释
4. 适当使用**加粗**标注关键要点
5. 可以用❌和✅标注错误示范和正确示范
6. 结尾要有行动建议，告诉读者下次遇到这种情况该怎么做
7. 语气像朋友聊天，不要太学术，也不要太鸡汤

请按以下格式输出（严格遵守）：
TITLE: 文章标题
SUMMARY: 一句话摘要（30字以内）
CONTENT:
文章正文`;

    const messages = [
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const stream = client.stream(messages, {
      model: 'doubao-seed-1-6-251015',
      temperature: 0.9,
    });

    let fullText = '';
    for await (const chunk of stream) {
      if (chunk.content) {
        fullText += chunk.content.toString();
      }
    }

    if (!fullText) {
      return NextResponse.json({ error: 'LLM 未生成内容' }, { status: 500 });
    }

    // 解析 LLM 输出
    const titleMatch = fullText.match(/TITLE:\s*(.+)/);
    const summaryMatch = fullText.match(/SUMMARY:\s*(.+)/);
    const contentMatch = fullText.match(/CONTENT:\s*([\s\S]*)/);

    const title = titleMatch?.[1]?.trim() || topic;
    const summary = summaryMatch?.[1]?.trim() || `关于${topic}的实用技巧`;
    const content = contentMatch?.[1]?.trim() || fullText;

    // 保存到数据库
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({ title, summary, content })
      .select()
      .single();

    if (error) throw new Error(`保存文章失败: ${error.message}`);

    return NextResponse.json({ post: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    console.error('生成文章失败:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
