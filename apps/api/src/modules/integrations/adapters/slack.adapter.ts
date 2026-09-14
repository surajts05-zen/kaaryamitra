import axios from 'axios';
import { prisma } from '../../../lib/prisma.js';
import { WebhookEventType } from '@prisma/client';
import { decryptSecret } from '../integrations.service.js';
import { logger } from '../../../lib/logger.js';

export async function dispatchToSlack(tenantId: string, event: WebhookEventType, payload: any) {
  try {
    // Check if SLACK integration is connected
    const integration = await prisma.tenantIntegration.findFirst({
      where: {
        tenantId,
        provider: 'SLACK',
        status: 'CONNECTED'
      }
    });

    if (!integration) return;

    // Fetch the bot token from encrypted secrets
    const secretRecord = await prisma.encryptedSecret.findFirst({
      where: {
        tenantId,
        key: 'SLACK_botToken'
      }
    });

    if (!secretRecord) {
      logger.warn(`Slack integration active for tenant ${tenantId} but no botToken found.`);
      return;
    }

    const botToken = decryptSecret(secretRecord.iv, secretRecord.authTag, secretRecord.value);
    
    const config = integration.config as Record<string, any>;
    const channelId = config.channelId;

    if (!channelId) return;

    // Construct a friendly message based on event type
    let message = `*New Event: ${event}*\n\`\`\`${JSON.stringify(payload, null, 2)}\`\`\``;

    if (event === 'LEAVE_APPROVED') {
      message = `🌴 *Leave Approved*\nUser ID: ${payload.userId}\nDuration: ${payload.startDate} to ${payload.endDate}`;
    } else if (event === 'EMPLOYEE_CREATED') {
      message = `👋 *New Employee Joined*\nWelcome ${payload.name} (${payload.email}) to the team!`;
    }

    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: channelId,
        text: message,
      },
      {
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`Successfully dispatched ${event} to Slack channel ${channelId}`);
  } catch (error: any) {
    logger.error(`Failed to dispatch event ${event} to Slack: ${error.message}`);
  }
}
