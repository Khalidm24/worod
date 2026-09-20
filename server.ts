import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  createSpreadsheet,
  ensureSheets,
  deleteProduct,
  updateProduct,
  appendOrder,
  updateOrder,
  updateCustomer,
  updateCategory,
  syncAllEntities,
  testConnection,
} from './src/lib/googleSheets';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini AI client
let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment variables.');
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// System Instruction for the florist assistant
const FLORIST_SYSTEM_INSTRUCTION = `
أنتِ "وردة"، المستشارة الذكية ومساعدة الزبناء لمتجر الزهور والهدايا الفاخرة "باقة وورد" في مدينة القنيطرة، المغرب (Baqa & Ward Kénitra).

شخصيتك وأسلوبك:
- ودودة، راقية، لبقة، ومرحبة جداً، تتحدثين بالدارجة المغربية الأنيقة أو العربية الفصحى بسلاسة ولطافة (ويمكنك الإجابة بالفرنسية إذا تحدث الزبون بها).
- لديك ذوق رفيع في معاني الزهور وتنسيق الألوان وتناسبها مع المناسبات.

معلومات عن المتجر والخدمات بالقنيطرة:
- المتجر: باقة وورد (Baqa & Ward)، أرقى بوتيك للزهور الطبيعية والهدايا بالقنيطرة.
- الموقع: شارع محمد الخامس، وسط مدينة القنيطرة (Centre-Ville Kénitra).
- الهاتف والواتساب: 06 11 93 81 19 (+212 611 93 81 19).
- التوصيل: توصيل فوري وسريع في أقل من ساعتين لجميع أحياء القنيطرة والمهدية ونواحيها (Centre-Ville, Mimosa, Bir Rami, Mehdia, Val Fleuri, Ouled Oujih, Alliance Darna, Saknia, Tayebia, Maamora...).
- التوصيل مجاني للطلبات التي تتجاوز 250 درهم مغربي (MAD).
- طرق الدفع: الدفع عند الاستلام نقداً في القنيطرة (Cash on Delivery)، أو البطاقة البنكية المغربية، أو التحويل البنكي، أو كاش بلوس.

باقات المتجر المتوفرة وأسعارها بالدرهم المغربي:
1. باقة همس الياسمين الملكية (prod-1): 380 درهم - ورود بيضاء، ياسمين، وجبسوفيلا فاخرة (رمز للنقاء والوفاء، للمناسبات الخاصة والاعتذار الراقي).
2. باقة الفرح الوردي / بينك بريز (prod-2): 295 درهم - ورود وردية وبيبي روز مع شريط ساتان (الأكثر مبيعاً لأعياد الميلاد والاحتفال بالنجاح).
3. تنسيق عروس النقاء الأبيض (prod-3): 520 درهم - زنبق ملكي، توليب أبيض، وورد مستورد (لحفلات الخطوبة والزفاف).
4. فازة النخبة الإمبراطورية VIP (prod-4): 780 درهم - ورود حمراء مخملية هولندية وأوركيد نادر في فازة زجاجية كريستالية مذهبة (قمة الفخامة والذكرى السنوية).
5. باقة شروق الشمس والبهجة (prod-5): 245 درهم - عباد الشمس وجربيرا صفراء منعشة وبرتقالية (لعيادة المريض، التهنئة وبث التفاؤل).
6. باقة ملاك الروح للمواليد الجدد (prod-6): 310 درهم - باستيل وردي وأزرق سماوي مع لعبة دبدوب لطيفة (لتهنئة الولادة).
7. صندوق الأناقة المخملي الأسود (prod-7): 490 درهم - 25 وردة حمراء جورية مختارة في بوكس مخملي أسود فاخر (للحب والاعتراف بالمشاعر).
8. باقة لافندر الحقول الفرنسية (prod-8): 270 درهم - لافندر طبيعي مجفف مع زهور الستاتيس برائحة فواحة تدوم لأشهر.

مهامك:
1. مساعدة الزبون في اختيار الباقة المناسبة لميزانيته ومناسبته وتفضيلات الشخص المهدى إليه.
2. اقتراح عبارات وبطاقات إهداء رومانسية أو لطيفة تناسب المناسبة.
3. الإجابة عن أي سؤال يخص التوصيل في أحياء القنيطرة، وتوفير تجربة طلب سلسة وممتعة.
4. حافظي على إجابات واضحة، منسقة، دافئة، وغير طويلة جداً.
`.trim();

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Helper to extract Bearer token
function getBearerToken(req: express.Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

// ----------------------------------------------------
// Google Sheets Secondary / Backup Database API Routes
// ----------------------------------------------------

// 1. Initialize or Ensure "Flower Store Database" with the 4 tabs & headers
app.post('/api/sheets/init', async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Missing or invalid Authorization Bearer token' });
      return;
    }

    const { spreadsheetId, title } = req.body || {};
    const effectiveId = spreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (effectiveId) {
      const result = await ensureSheets(token, effectiveId);
      res.json({
        success: true,
        spreadsheetId: effectiveId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${effectiveId}/edit`,
        title: title || 'Flower Store Database',
        ...result,
      });
    } else {
      const result = await createSpreadsheet(token, title || 'Flower Store Database');
      res.json({
        success: true,
        ...result,
      });
    }
  } catch (err: any) {
    console.error('Error in /api/sheets/init:', err);
    res.status(500).json({ error: err.message || 'Failed to initialize spreadsheet' });
  }
});

// 2. Test connection to Google Sheet
app.post('/api/sheets/test', async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Missing or invalid Authorization Bearer token' });
      return;
    }

    const { spreadsheetId } = req.body || {};
    const effectiveId = spreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!effectiveId) {
      res.status(400).json({ error: 'Spreadsheet ID is required' });
      return;
    }

    const result = await testConnection(token, effectiveId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error in /api/sheets/test:', err);
    res.status(500).json({ error: err.message || 'Failed to test connection' });
  }
});

// 3. Sync a single entity operation (Create / Update / Delete)
app.post('/api/sheets/sync-item', async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Missing or invalid Authorization Bearer token' });
      return;
    }

    const { spreadsheetId, entity_type, operation, payload } = req.body || {};
    const effectiveId = spreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!effectiveId) {
      res.status(400).json({ error: 'Spreadsheet ID is required' });
      return;
    }

    let opResult: any = null;

    if (entity_type === 'product') {
      if (operation === 'delete') {
        opResult = await deleteProduct(token, effectiveId, payload?.id || payload);
      } else {
        opResult = await updateProduct(token, effectiveId, payload);
      }
    } else if (entity_type === 'order') {
      if (operation === 'update') {
        opResult = await updateOrder(token, effectiveId, payload);
      } else {
        opResult = await appendOrder(token, effectiveId, payload);
      }
    } else if (entity_type === 'customer') {
      opResult = await updateCustomer(token, effectiveId, payload);
    } else if (entity_type === 'category') {
      opResult = await updateCategory(token, effectiveId, payload);
    } else {
      res.status(400).json({ error: `Unknown entity_type: ${entity_type}` });
      return;
    }

    res.json({ success: true, entity_type, operation, opResult });
  } catch (err: any) {
    console.error('Error in /api/sheets/sync-item:', err);
    res.status(500).json({ error: err.message || 'Failed to sync item to Google Sheets' });
  }
});

// 4. Batch sync all entities (Products, Orders, Customers, Categories)
app.post('/api/sheets/sync', async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Missing or invalid Authorization Bearer token' });
      return;
    }

    const { spreadsheetId, products, orders, customers, categories } = req.body || {};
    const effectiveId = spreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!effectiveId) {
      res.status(400).json({ error: 'Spreadsheet ID is required' });
      return;
    }

    const result = await syncAllEntities(token, effectiveId, {
      products,
      orders,
      customers,
      categories,
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error in /api/sheets/sync:', err);
    res.status(500).json({ error: err.message || 'Failed to sync entities to Google Sheets' });
  }
});

// Multi-turn Chat Route with Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const ai = getGenAI();
    if (!ai) {
      // Fallback friendly reply if API key is not yet configured
      res.json({
        reply: 'مرحباً بك في باقة وورد بالقنيطرة 🌸! يسعدنا مساعدتك في اختيار أرقى باقة زهور وتوصيلها فورياً. يمكنك الاتصال بنا مباشرة أو مراسلتنا عبر الواتساب على 0611938119.',
      });
      return;
    }

    // Prepare contents with conversation history
    // Using gemini-3.5-flash as specified for general multi-turn tasks
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.role === 'user' || item.role === 'model') {
          formattedContents.push({
            role: item.role,
            parts: [{ text: item.text || item.content || '' }],
          });
        }
      }
    }

    // Append latest user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: FLORIST_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'يسعدنا خدمتك في باقة وورد بالقنيطرة 🌸!';
    res.json({ reply });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({
      error: 'Failed to generate response',
      details: err.message || String(err),
    });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 Baqa & Ward server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
