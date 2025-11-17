import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getOpenAIKey, getSystemSettings } from '../admin/settings';

const prisma = new PrismaClient();

/**
 * API Route: /api/extension/generate
 * Generates AI content through OpenAI using super admin's API key
 * Users authenticate with their portal API key, but generation uses system-wide OpenAI key
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, action, prompt, tone, contentType } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Check if system is in maintenance mode
    const systemSettings = await getSystemSettings();
    if (systemSettings?.maintenanceMode) {
      return res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: 'System is currently under maintenance. Please try again later.'
      });
    }

    // Validate user and check limits
    const user: any = await prisma.user.findUnique({
      where: { apiKey } as any,
      include: { plan: true, stats: true },
    });

    if (!user || !user.apiKeyActive) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    if (!user.plan) {
      return res.status(403).json({ error: 'No active plan' });
    }

    // Check usage limits before generating
    const stats = user.stats || { totalUsage: 0 };
    if (stats.totalUsage >= user.plan.totalUsageLimit) {
      return res.status(429).json({ 
        error: 'Monthly usage limit reached',
        limit: user.plan.totalUsageLimit,
      });
    }

    // Get system OpenAI API key (managed by super admin)
    const OPENAI_API_KEY = await getOpenAIKey();
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'Service not configured',
        message: 'OpenAI API key has not been configured by system administrator. Please contact support.'
      });
    }

    // Get model and token settings from system settings
    const model = systemSettings?.openaiModel || 'gpt-4o-mini';
    const maxTokens = systemSettings?.maxTokens || 500;

    // Call OpenAI API (server-side with system OpenAI key)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a professional LinkedIn content assistant.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return res.status(500).json({ 
        error: 'AI generation failed',
        message: 'Failed to generate content. Please try again.'
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'No content generated' });
    }

    // Parse JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(500).json({ error: 'Invalid response format from AI' });
    }

    // Track usage (will be done via /track endpoint separately)
    
    return res.status(200).json({
      success: true,
      content: parsedContent,
      usage: {
        remaining: user.plan.totalUsageLimit - stats.totalUsage - 1,
        limit: user.plan.totalUsageLimit
      }
    });
  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  } finally {
    await prisma.$disconnect();
  }
}
