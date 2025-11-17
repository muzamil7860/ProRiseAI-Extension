import { NextApiRequest, NextApiResponse } from 'next';
import { withSuperAdmin } from '@/middleware/superAdminAuth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt, maskSensitiveData } from '@/lib/encryption';

/**
 * GET /api/admin/settings
 * Get system settings (OpenAI key is masked)
 * 
 * POST /api/admin/settings
 * Update system settings (OpenAI key is encrypted before storage)
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Get system settings
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    let settings = await (prisma as any).systemSettings.findFirst();

    // If no settings exist, create default
    if (!settings) {
      settings = await (prisma as any).systemSettings.create({
        data: {
          openaiModel: 'gpt-4o-mini',
          maxTokens: 500,
          maintenanceMode: false,
          allowRegistration: true
        }
      });
    }

    // Mask the OpenAI API key for security
    const maskedSettings = {
      ...settings,
      openaiApiKey: settings.openaiApiKey 
        ? maskSensitiveData(settings.openaiApiKey, 8)
        : null,
      hasApiKey: !!settings.openaiApiKey
    };

    return res.status(200).json({ settings: maskedSettings });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch system settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Update system settings
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      openaiApiKey,
      openaiModel,
      maxTokens,
      systemEmail,
      maintenanceMode,
      allowRegistration
    } = req.body;

    // Validate required fields
    if (!openaiModel || !maxTokens) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'openaiModel and maxTokens are required'
      });
    }

    // Validate maxTokens range
    if (maxTokens < 100 || maxTokens > 4000) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'maxTokens must be between 100 and 4000'
      });
    }

    // Prepare update data
    const updateData: any = {
      openaiModel,
      maxTokens,
      systemEmail: systemEmail || null,
      maintenanceMode: maintenanceMode ?? false,
      allowRegistration: allowRegistration ?? true
    };

    // Encrypt OpenAI API key if provided
    if (openaiApiKey && openaiApiKey.trim() !== '') {
      try {
        updateData.openaiApiKey = encrypt(openaiApiKey);
      } catch (encryptError) {
        console.error('Encryption error:', encryptError);
        return res.status(500).json({
          error: 'Encryption failed',
          message: 'Failed to encrypt API key. Please check your ENCRYPTION_KEY environment variable.'
        });
      }
    }

    // Get existing settings
    let settings = await (prisma as any).systemSettings.findFirst();

    if (!settings) {
      // Create new settings
      settings = await (prisma as any).systemSettings.create({
        data: updateData
      });
    } else {
      // Update existing settings
      settings = await (prisma as any).systemSettings.update({
        where: { id: settings.id },
        data: updateData
      });
    }

    // Return masked settings
    const maskedSettings = {
      ...settings,
      openaiApiKey: settings.openaiApiKey 
        ? maskSensitiveData(settings.openaiApiKey, 8)
        : null,
      hasApiKey: !!settings.openaiApiKey
    };

    return res.status(200).json({ 
      settings: maskedSettings,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return res.status(500).json({ 
      error: 'Failed to update system settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get decrypted OpenAI API key (internal use only)
 * This should only be called from server-side code
 */
export async function getOpenAIKey(): Promise<string | null> {
  try {
    const settings = await (prisma as any).systemSettings.findFirst();
    
    if (!settings || !settings.openaiApiKey) {
      return null;
    }

    return decrypt(settings.openaiApiKey);
  } catch (error) {
    console.error('Error getting OpenAI key:', error);
    return null;
  }
}

/**
 * Get system settings (internal use)
 */
export async function getSystemSettings() {
  try {
    let settings = await (prisma as any).systemSettings.findFirst();

    if (!settings) {
      settings = await (prisma as any).systemSettings.create({
        data: {
          openaiModel: 'gpt-4o-mini',
          maxTokens: 500,
          maintenanceMode: false,
          allowRegistration: true
        }
      });
    }

    return settings;
  } catch (error) {
    console.error('Error getting system settings:', error);
    return null;
  }
}

export default withSuperAdmin(handler);
