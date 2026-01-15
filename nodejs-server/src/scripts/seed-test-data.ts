import { prisma } from '../lib/prisma';
import * as designService from '../services/design.service';

/**
 * Seed script to create test data for version control demo
 * Run: npx ts-node src/scripts/seed-test-data.ts
 */

async function seedTestData() {
  console.log('🌱 Starting seed...');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Cleaning existing test data...');
    await prisma.feedback.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.designVersion.deleteMany({});
    await prisma.design.deleteMany({});
    await prisma.brief.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.whatsAppMessage.deleteMany({});
    console.log('✅ Cleaned existing data');

    // ========== Test Case 1: Diwali Sale Poster ==========
    const msg1 = await prisma.whatsAppMessage.create({
      data: {
        from: '+919876543210',
        text: 'I need a Diwali sale poster with 50% off offer, festive colors with diyas and rangoli, our shop name is "Maharaja Sweets"',
        messageId: `msg_diwali_${Date.now()}`
      }
    });
    console.log('✅ Created WhatsApp message 1: Diwali Sale');

    const brief1 = await designService.createBriefFromMessage(msg1.messageId);
    const design1 = await designService.createDesign(brief1.id, 'Diwali Sale Poster - Maharaja Sweets');
    console.log(`✅ Created Brief #${brief1.id} → Design #${design1?.id}`);

    if (design1) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await designService.createVersion(design1.id, {
        commitMessage: 'Increased diya size and added more rangoli patterns',
        createdBy: 'designer'
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      await designService.createVersion(design1.id, {
        commitMessage: 'Changed background to golden gradient',
        createdBy: 'designer'
      });

      const v1 = await prisma.designVersion.findFirst({
        where: { designId: design1.id, versionNumber: 1 }
      });
      if (v1) {
        await designService.addFeedback(v1.id, '+919876543210', 'Can you make the diyas bigger and brighter?');
      }

      const v2 = await prisma.designVersion.findFirst({
        where: { designId: design1.id, versionNumber: 2 }
      });
      if (v2) {
        await designService.addFeedback(v2.id, '+919876543210', 'Perfect! Now can you change to golden background?');
      }

      console.log('✅ Created 3 versions for Design #' + design1.id);
    }

    // ========== Test Case 2: New Year Banner ==========
    const msg2 = await prisma.whatsAppMessage.create({
      data: {
        from: '+918765432109',
        text: 'Design a New Year 2026 banner for my restaurant with fireworks and "Happy New Year" text',
        messageId: `msg_newyear_${Date.now()}`
      }
    });
    console.log('✅ Created WhatsApp message 2: New Year Banner');

    const brief2 = await designService.createBriefFromMessage(msg2.messageId);
    const design2 = await designService.createDesign(brief2.id, 'New Year 2026 Banner');
    console.log(`✅ Created Brief #${brief2.id} → Design #${design2?.id}`);

    if (design2) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await designService.createVersion(design2.id, {
        commitMessage: 'Added animated fireworks effect',
        createdBy: 'designer'
      });

      const v1 = await prisma.designVersion.findFirst({
        where: { designId: design2.id, versionNumber: 1 }
      });
      if (v1) {
        await designService.addFeedback(v1.id, '+918765432109', 'Looks great! Can you add some sparkle effects?');
      }

      console.log('✅ Created 2 versions for Design #' + design2.id);
    }

    // ========== Test Case 3: Product Launch ==========
    const msg3 = await prisma.whatsAppMessage.create({
      data: {
        from: '+917654321098',
        text: 'Need Instagram story for our new product launch - wireless earbuds, make it tech and modern',
        messageId: `msg_product_${Date.now()}`
      }
    });
    console.log('✅ Created WhatsApp message 3: Product Launch');

    const brief3 = await designService.createBriefFromMessage(msg3.messageId);
    console.log(`✅ Created Brief #${brief3.id} (No design yet - pending)`);

    // ========== Test Case 4: Weekend Sale ==========
    const msg4 = await prisma.whatsAppMessage.create({
      data: {
        from: '+916543210987',
        text: 'Weekend flash sale poster - 70% off on all items, urgent need by tomorrow',
        messageId: `msg_weekend_${Date.now()}`
      }
    });
    console.log('✅ Created WhatsApp message 4: Weekend Sale');

    const brief4 = await designService.createBriefFromMessage(msg4.messageId);
    const design4 = await designService.createDesign(brief4.id, 'Weekend Flash Sale');
    console.log(`✅ Created Brief #${brief4.id} → Design #${design4?.id}`);

    if (design4) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await designService.createVersion(design4.id, {
        commitMessage: 'Changed discount badge style to more prominent',
        createdBy: 'designer'
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      await designService.createVersion(design4.id, {
        commitMessage: 'Added urgency timer graphic',
        createdBy: 'designer'
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      await designService.createVersion(design4.id, {
        commitMessage: 'Final version - ready for approval',
        createdBy: 'designer'
      });

      const v3 = await prisma.designVersion.findFirst({
        where: { designId: design4.id, versionNumber: 3 }
      });
      if (v3) {
        await designService.addFeedback(v3.id, '+916543210987', 'Make the timer more eye-catching');
      }

      const v4 = await prisma.designVersion.findFirst({
        where: { designId: design4.id, versionNumber: 4 }
      });
      if (v4) {
        await designService.addFeedback(v4.id, '+916543210987', 'Perfect! Approved ✅ Please send it');
      }

      console.log('✅ Created 4 versions for Design #' + design4.id);
    }

    // Update some brief statuses
    await prisma.brief.update({
      where: { id: brief1.id },
      data: { status: 'in-progress' }
    });

    await prisma.brief.update({
      where: { id: brief4.id },
      data: { status: 'completed' }
    });

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 4 WhatsApp messages from different clients');
    console.log('  - 4 Clients created');
    console.log('  - 4 Briefs (1 pending, 1 in-progress, 1 completed, 1 no-design)');
    console.log('  - 3 Designs with version history');
    console.log('  - Multiple versions with commit messages');
    console.log('  - Feedback items on various versions');
    console.log('\n🚀 Now start the server and check the addon!');
    console.log('   → Inbox: See all 4 briefs');
    console.log('   → Click "Create Design" or view existing designs');
    console.log('   → Generate tab: Save versions');
    console.log('   → Activity tab: View version history & feedback');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
