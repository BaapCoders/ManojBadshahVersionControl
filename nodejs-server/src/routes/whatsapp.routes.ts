import { Router, Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { prisma } from '../lib/prisma';
import * as designService from '../services/design.service';

const router = Router();
const whatsappService = new WhatsAppService();

console.log('✅ WhatsApp routes loaded');

router.post('/webhook', async (req: Request, res: Response) => {
  console.log('📩 WhatsApp webhook POST received');
  
  // 🔍 DEBUG: Log the entire webhook payload
  console.log('📦 Full webhook body:', JSON.stringify(req.body, null, 2));

  // IMPORTANT: respond immediately
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // 🔍 DEBUG: Log parsed structure
    console.log('📋 Entry:', entry ? '✓' : '✗');
    console.log('📋 Change:', change ? '✓' : '✗');
    console.log('📋 Value:', value ? '✓' : '✗');
    console.log('📋 Message:', message ? '✓' : '✗');
    
    if (message) {
      console.log('📋 Message type:', message.type);
      console.log('📋 Message ID:', message.id);
      console.log('📋 Message from:', message.from);
    }

    // Handle different message types
    if (!message) {
      console.log('ℹ️ No message object (could be status update, delivery receipt, or read receipt)');
      if (value?.statuses) {
        console.log('📬 Status update received:', value.statuses[0]?.status);
      }
      return;
    }

    // Extract message based on type
    let textBody: string | null = null;
    
    if (message.type === 'text' && message.text?.body) {
      textBody = message.text.body;
    } else if (message.type === 'interactive' && message.interactive) {
      // Handle button/list replies
      if (message.interactive.type === 'button_reply') {
        textBody = message.interactive.button_reply.title;
      } else if (message.interactive.type === 'list_reply') {
        textBody = message.interactive.list_reply.title;
      }
    } else if (message.type === 'button' && message.button) {
      textBody = message.button.text;
    } else {
      console.log(`ℹ️ Unsupported message type: ${message.type}`);
      return;
    }

    if (!textBody) {
      console.log('ℹ️ No text content in message');
      return;
    }

    const from = message.from;
    const text = textBody.toLowerCase().trim();
    const messageId = message.id;

    console.log(`📨 From: ${from} | Text: ${text}`);

    // Save to DB
    const savedMessage = await prisma.whatsAppMessage.create({
      data: {
        from,
        text: textBody,
        messageId,
      },
    });

    // Auto-create brief for non-command messages (actual design requests)
    const isCommand = ['help', 'menu', 'create', 'story', 'post', 'banner'].includes(text);
    if (!isCommand && textBody.length > 10) {
      try {
        await designService.createBriefFromMessage(messageId);
        console.log('✅ Brief auto-created from message');
      } catch (error) {
        console.error('❌ Failed to auto-create brief:', error);
      }
    }

    // Bot replies
    if (text === 'help') {
      await whatsappService.sendTextMessage(
        from,
        '👋 Commands:\n• help\n• menu\n• create\n\nOr just describe what you need and we\'ll create a brief for you!'
      );
    } else if (text === 'menu') {
      await whatsappService.sendTextMessage(
        from,
        '📋 Menu:\n• create\n• approvals'
      );
    } else if (text === 'create') {
      await whatsappService.sendTextMessage(
        from,
        '🎨 Choose format:\n• Story\n• Post\n• Banner\n\nOr describe your design needs in detail!'
      );
    } else if (!isCommand && textBody.length > 10) {
      await whatsappService.sendTextMessage(
        from,
        '✅ Got it! Your design brief has been created. Our designer will start working on it soon.'
      );
    } else {
      await whatsappService.sendTextMessage(
        from,
        '🤖 Type "help" to see options, or describe what design you need!'
      );
    }

  } catch (error) {
    console.error('❌ Webhook error:', error);
  }
});

/* ===== Test DB ===== */
router.get('/test-db', async (_req: Request, res: Response) => {
  const count = await prisma.whatsAppMessage.count();
  const messages = await prisma.whatsAppMessage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ count, messages });
});

/* ===== Inbox API ===== */
router.get('/inbox', async (_req: Request, res: Response) => {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});


export default router;
