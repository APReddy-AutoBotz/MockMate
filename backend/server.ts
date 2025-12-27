import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { db, auth, Timestamp } from './firebase';
import { Buffer } from 'buffer';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Initialized GoogleGenAI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Cost Control & Security Middlewares ---

// 1. Log Sampling: Use 'tiny' in production to save on Cloud Logging costs
app.use(morgan(isProd ? 'tiny' : 'dev'));

// 2. Global Rate Limiter: Prevent brute force and runaway usage
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// 3. Heavy-Task Limiter: Specific limit for expensive AI report generation
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 report generations per hour
  message: { error: 'Report generation quota exceeded for this hour.' }
});

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// Apply global limiter to all API routes
app.use('/api', globalLimiter);

// --- Auth Middleware ---
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  try {
    (req as any).user = await auth.verifyIdToken(token);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};

app.get('/health', (req, res) => res.json({ status: 'ok' }));

/**
 * @route   POST /api/reports/:sessionId/generate
 * @desc    Generate a comprehensive AI report with fail-closed logic
 */
app.post('/api/reports/:sessionId/generate', authenticateToken, reportLimiter, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.uid;

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const turnsSnapshot = await db.collection('sessions').doc(sessionId).collection('turns').orderBy('timestamp', 'asc').get();
    const turns = turnsSnapshot.docs.map(d => d.data());

    if (turns.length === 0) return res.status(400).json({ error: 'No turns to analyze' });

    const sessionData = sessionDoc.data()!;
    const historyText = turns.map(t => `Q: ${t.question}\nA: ${t.candidateResponse}`).join('\n\n');

    const prompt = `You are a world-class interview panel analyzing this session for: ${sessionData.role}.
    Context: ${sessionData.companyBrief || 'N/A'}
    Transcript:
    ${historyText}
    Generate report in JSON format.`;

    // Fail-Closed Logic: Catch Gemini API quota or server errors
    let result;
    try {
      result = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 4000 } // Reduced budget to save tokens/cost
        }
      });
    } catch (apiError: any) {
      console.error('Gemini API Error:', apiError.message);
      if (apiError.message?.includes('429') || apiError.message?.includes('quota')) {
        return res.status(429).json({ error: 'AI Quota exceeded. Please try again in a few minutes.' });
      }
      throw apiError;
    }

    const reportData = {
      ...JSON.parse(result.text || '{}'),
      sessionId,
      userId,
      createdAt: Timestamp.now()
    };

    await db.collection('reports').doc(sessionId).set(reportData);
    res.status(201).json(reportData);

  } catch (error: any) {
    console.error('Report Generation Error:', error);
    res.status(500).json({ error: 'System processing error. No tokens were consumed.' });
  }
});

app.get('/api/reports/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.uid;
  const doc = await db.collection('reports').doc(id).get();
  if (!doc.exists || doc.data()?.userId !== userId) return res.status(404).json({ error: 'Report not found' });
  res.json(doc.data());
});

app.get('/api/reports/:id/pdf', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.uid;
    const doc = await db.collection('reports').doc(id).get();
    if (!doc.exists || doc.data()?.userId !== userId) return res.status(404).json({ error: 'Report not found' });

    const report = doc.data()!;
    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([595, 842]);
    page.drawRectangle({ x: 0, y: 740, width: 595, height: 102, color: rgb(10/255, 25/255, 47/255) });
    page.drawText('MOCKMATE PERFORMANCE DOSSIER', { x: 50, y: 780, font: fontBold, size: 20, color: rgb(1, 1, 1) });
    
    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="MockMate_Report_${id}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({ error: 'PDF Generation Failed' });
  }
});

app.listen(PORT, () => console.log(`[server]: MockMate backend active on ${PORT} (Cost Rails Enabled)`));