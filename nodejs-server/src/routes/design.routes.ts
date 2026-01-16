import { Router, Request, Response } from 'express';
import * as designService from '../services/design.service';

const router = Router();

// ===================== BRIEF ROUTES =====================

/**
 * POST /api/briefs - Create brief from WhatsApp message
 */
router.post('/briefs', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.body;
    
    if (!messageId) {
      return res.status(400).json({ error: 'messageId is required' });
    }

    const brief = await designService.createBriefFromMessage(messageId);
    res.status(201).json(brief);
  } catch (error: any) {
    console.error('Error creating brief:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/briefs - Get all briefs
 */
router.get('/briefs', async (req: Request, res: Response) => {
  try {
    const briefs = await designService.getAllBriefs();
    res.json(briefs);
  } catch (error: any) {
    console.error('Error fetching briefs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/briefs/:id - Get brief by ID
 */
router.get('/briefs/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const brief = await designService.getBriefById(id);
    
    if (!brief) {
      return res.status(404).json({ error: 'Brief not found' });
    }
    
    res.json(brief);
  } catch (error: any) {
    console.error('Error fetching brief:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/briefs/:id/status - Update brief status
 */
router.patch('/briefs/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    
    const brief = await designService.updateBriefStatus(id, status);
    res.json(brief);
  } catch (error: any) {
    console.error('Error updating brief status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/briefs/:id/designs - Create design for a specific brief
 */
router.post('/briefs/:id/designs', async (req: Request, res: Response) => {
  try {
    const briefId = parseInt(req.params.id);
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    
    const design = await designService.createDesign(briefId, title);
    res.status(201).json(design);
  } catch (error: any) {
    console.error('Error creating design:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== DESIGN ROUTES =====================

/**
 * POST /api/designs - Create new design
 */
router.post('/designs', async (req: Request, res: Response) => {
  try {
    const { briefId, title } = req.body;
    
    if (!briefId || !title) {
      return res.status(400).json({ error: 'briefId and title are required' });
    }
    
    const design = await designService.createDesign(briefId, title);
    res.status(201).json(design);
  } catch (error: any) {
    console.error('Error creating design:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/designs/:id - Get design with version history
 */
router.get('/designs/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const design = await designService.getDesignById(id);
    
    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }
    
    res.json(design);
  } catch (error: any) {
    console.error('Error fetching design:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== VERSION CONTROL ROUTES =====================

/**
 * POST /api/designs/:id/versions - COMMIT: Create new version
 */
router.post('/designs/:id/versions', async (req: Request, res: Response) => {
  try {
    const designId = parseInt(req.params.id);
    const { commitMessage, pngBase64, createdBy } = req.body;
    
    const version = await designService.createVersion(designId, {
      commitMessage,
      pngBase64,
      createdBy: createdBy || 'designer'
    });
    
    res.status(201).json(version);
  } catch (error: any) {
    console.error('Error creating version:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/designs/:id/versions/:versionNumber/png - Proxy PNG from S3
 * This bypasses CORS issues by serving the PNG through our backend
 */
router.get('/designs/:id/versions/:versionNumber/png', async (req: Request, res: Response) => {
  try {
    const designId = parseInt(req.params.id);
    const versionNumber = parseInt(req.params.versionNumber);
    
    // Get version from database
    const version = await designService.getVersionByNumber(designId, versionNumber);
    
    if (!version || !version.previewUrl) {
      return res.status(404).json({ error: 'Version or preview not found' });
    }

    // Fetch PNG from S3
    const s3Response = await fetch(version.previewUrl);
    
    if (!s3Response.ok) {
      return res.status(502).json({ error: 'Failed to fetch from S3' });
    }

    const pngBuffer = await s3Response.arrayBuffer();
    
    // Set proper headers and send PNG
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(Buffer.from(pngBuffer));
    
  } catch (error: any) {
    console.error('Error proxying PNG:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/designs/:id/versions - Get version history
 */
router.get('/designs/:id/versions', async (req: Request, res: Response) => {
  try {
    const designId = parseInt(req.params.id);
    const versions = await designService.getVersionHistory(designId);
    res.json(versions);
  } catch (error: any) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/versions/:id - Get specific version
 */
router.get('/versions/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const version = await designService.getVersionById(id);
    
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json(version);
  } catch (error: any) {
    console.error('Error fetching version:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/designs/:id/revert - REVERT: Restore a previous version
 */
router.post('/designs/:id/revert', async (req: Request, res: Response) => {
  try {
    const designId = parseInt(req.params.id);
    const { targetVersion } = req.body;
    
    if (!targetVersion) {
      return res.status(400).json({ error: 'targetVersion is required' });
    }
    
    const version = await designService.revertToVersion(designId, targetVersion);
    res.status(201).json(version);
  } catch (error: any) {
    console.error('Error reverting version:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/designs/:id/compare - DIFF: Compare two versions
 */
router.get('/designs/:id/compare', async (req: Request, res: Response) => {
  try {
    const designId = parseInt(req.params.id);
    const v1 = parseInt(req.query.v1 as string);
    const v2 = parseInt(req.query.v2 as string);
    
    if (!v1 || !v2) {
      return res.status(400).json({ error: 'v1 and v2 query parameters are required' });
    }
    
    const comparison = await designService.compareVersions(designId, v1, v2);
    res.json(comparison);
  } catch (error: any) {
    console.error('Error comparing versions:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================== FEEDBACK ROUTES =====================

/**
 * POST /api/feedback - Add feedback to a version
 */
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const { versionId, from, message } = req.body;
    
    if (!versionId || !from || !message) {
      return res.status(400).json({ error: 'versionId, from, and message are required' });
    }
    
    const feedback = await designService.addFeedback(versionId, from, message);
    res.status(201).json(feedback);
  } catch (error: any) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/feedback/:id/status - Update feedback status
 */
router.patch('/feedback/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    
    const feedback = await designService.updateFeedbackStatus(id, status);
    res.json(feedback);
  } catch (error: any) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/designs/:id/feedback - Get all feedback for a design
 */
router.get('/designs/:id/feedback', async (req: Request, res: Response) => {
  try {
    const designId = parseInt(req.params.id);
    const feedback = await designService.getDesignFeedback(designId);
    res.json(feedback);
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
