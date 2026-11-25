import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.status(allowedOrigins.includes(String(origin)) ? 204 : 403).end();
  }
  return next();
});

app.use(express.json({ limit: '10mb' }));

// --- Basic in-memory rate limiting (per IP, per window) ---
type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: true,
      message: `Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ${retryAfter} giây.`,
    });
  }
  return next();
}

app.use('/api/', rateLimit);

// Initialize GoogleGenAI SDK on server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const HAS_API_KEY = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

const MEDICAL_SAFETY_INSTRUCTION = `QUY TẮC AN TOÀN Y KHOA BẮT BUỘC:
- Nội dung chỉ phục vụ mục đích giáo dục/học tập cho sinh viên, không thay thế chẩn đoán, kê đơn, điều trị hoặc tư vấn y tế cá nhân.
- Không đưa ra chỉ định điều trị cá nhân hóa, liều thuốc cho ca cụ thể, hoặc hướng dẫn xử trí cấp cứu thay cho cơ sở y tế.
- Nếu câu hỏi mang tính chẩn đoán/điều trị cá nhân hoặc tình huống khẩn cấp, hãy khuyên người dùng liên hệ bác sĩ/nhân viên y tế/cơ sở cấp cứu phù hợp.
- Nêu rõ giới hạn của thông tin, ưu tiên kiến thức dựa trên nguồn tài liệu được cung cấp hoặc kiến thức y khoa chuẩn mực; không bịa đặt nguồn, số trang, hoặc dữ liệu lâm sàng.
- Khi không chắc chắn, phải nói rõ "không đủ bằng chứng trong tài liệu/không chắc chắn" thay vì suy đoán.`;

function getErrorMessage(error: any): string {
  const raw = String(error?.message || '').toLowerCase();
  if (raw.includes('api key') || raw.includes('unauthorized') || raw.includes('permission denied') || error?.status === 401 || error?.status === 403) {
    return 'Không thể xác thực với dịch vụ AI. Vui lòng kiểm tra cấu hình GEMINI_API_KEY phía máy chủ.';
  }
  if (raw.includes('quota') || raw.includes('rate') || error?.status === 429) {
    return 'Dịch vụ AI đang tạm quá tải hoặc vượt hạn mức. Vui lòng thử lại sau ít phút.';
  }
  if (raw.includes('timeout') || raw.includes('timed out') || raw.includes('network') || raw.includes('fetch failed') || raw.includes('econn')) {
    return 'Không thể kết nối tới dịch vụ AI. Vui lòng kiểm tra mạng hoặc thử lại sau.';
  }
  return 'Có lỗi xảy ra khi xử lý yêu cầu AI. Vui lòng thử lại sau.';
}

// Helper for error responses
function handleGeminiError(error: any, res: Response, fallbackGenerator?: () => any) {
  console.error('Gemini API Error:', error);
  const status = Number(error?.status) || 500;
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  const message = getErrorMessage(error);

  if (fallbackGenerator) {
    try {
      const fallbackData = fallbackGenerator();
      return res.status(200).json({
        ...fallbackData,
        _fallback: true,
        _fallbackMessage: `${message} Hệ thống hiển thị nội dung dự phòng mang tính tham khảo học tập; cần kiểm chứng trước khi sử dụng.`,
      });
    } catch {
      // fall through to error response
    }
  }

  return res.status(safeStatus).json({
    error: true,
    message,
  });
}

// 0. Endpoint trích xuất văn bản từ tệp tải lên (.docx, .pdf, .txt, .md, .json)
app.post('/api/documents/extract', async (req: Request, res: Response) => {
  try {
    const { fileName = '', mimeType = '', data = '' } = req.body || {};
    if (!data || typeof data !== 'string') {
      return res.status(400).json({ error: true, message: 'Không nhận được dữ liệu tệp.' });
    }

    const cleanBase64 = data.includes(',') ? data.split(',')[1] : data;
    const buffer = Buffer.from(cleanBase64, 'base64');
    const lowerName = String(fileName).toLowerCase();

    if (lowerName.endsWith('.docx') || String(mimeType).includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ buffer });
      const extracted = (result.value || '').trim();
      if (!extracted) {
        return res.status(400).json({
          error: true,
          message: 'Tệp .docx không có nội dung văn bản có thể trích xuất (có thể chỉ chứa hình ảnh).',
        });
      }
      return res.json({ text: extracted });
    }

    if (lowerName.endsWith('.pdf') || mimeType === 'application/pdf') {
      if (!HAS_API_KEY) {
        return res.status(400).json({
          error: true,
          message: 'Trích xuất văn bản từ tệp PDF cần GEMINI_API_KEY. Bạn vẫn có thể tóm tắt PDF trực tiếp ở mục Tóm tắt bài giảng.',
        });
      }
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: cleanBase64,
              },
            },
            {
              text: 'Hãy trích xuất toàn bộ nội dung văn bản trong PDF này theo từng trang. Với mỗi trang, bắt đầu bằng dòng "[Trang N]" (N là số trang). Giữ nguyên ngôn ngữ gốc, tiêu đề, danh sách, bảng biểu ở dạng Markdown. Với hình ảnh/biểu đồ, thêm dòng mô tả ngắn dạng "[Hình ảnh trang N: ...]". Không bỏ sót thông tin và không bình luận thêm.',
            },
          ],
        },
      });
      const extractedPdf = (response.text || '').trim();
      if (!extractedPdf) {
        return res.status(400).json({
          error: true,
          message: 'Không thể trích xuất văn bản từ tệp PDF này.',
        });
      }
      return res.json({ text: extractedPdf });
    }

    if (lowerName.endsWith('.doc')) {
      return res.status(400).json({
        error: true,
        message: 'Định dạng .doc cũ chưa được hỗ trợ trực tiếp. Vui lòng lưu lại thành .docx hoặc .pdf.',
      });
    }

    const decodedText = buffer.toString('utf-8').trim();
    if (!decodedText) {
      return res.status(400).json({ error: true, message: 'Tệp tải lên đang trống.' });
    }
    return res.json({ text: decodedText });
  } catch (error: any) {
    console.error('Document Extract Error:', error);
    return res.status(500).json({
      error: true,
      message: 'Không thể đọc nội dung tệp tải lên. Vui lòng kiểm tra lại định dạng tệp.',
    });
  }
});

// 1. Endpoint Tóm tắt bài giảng & tài liệu chuyên sâu Y - Dược - Đại học
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  const { text = '', file, title = '', subject = 'Chung', detailLevel = 'standard', language = 'vi' } = req.body;
  const textInput = typeof text === 'string' ? text.trim() : '';
  const hasFile = Boolean(file && typeof file.data === 'string' && file.data.trim().length > 0 && typeof file.mimeType === 'string');

  if (!textInput && !hasFile) {
    return res.status(400).json({ error: true, message: 'Vui lòng cung cấp nội dung hoặc tệp tài liệu cần tóm tắt.' });
  }

  const labelForFallback = title || file?.name || textInput.slice(0, 40) || subject;

  const generateFallback = () => ({
    title: title || 'Tóm tắt Chuyên sâu: ' + labelForFallback,
    overview: 'Tài liệu cung cấp kiến thức nền tảng và cơ chế hoạt động chi tiết, nhấn mạnh vào các nguyên lý ứng dụng thực tiễn và liên hệ bệnh lý.',
    keyPoints: [
      'Xác định cấu trúc giải phẫu và vị trí tương quan then chốt.',
      'Cơ chế sinh lý học và nguyên nhân rối loạn chức năng bệnh sinh.',
      'Các dấu hiệu lâm sàng và triệu chứng cơ năng/thực thể điển hình.',
      'Nguyên tắc chẩn đoán phân biệt và phương pháp cận lâm sàng bổ trợ.',
      'Phác đồ can thiệp, chống chỉ định và theo dõi biến chứng.',
    ],
    glossary: [
      { term: 'Etiology (Căn nguyên)', definition: 'Nguyên nhân khởi phát và yếu tố nguy cơ dẫn đến tổn thương bệnh học.' },
      { term: 'Pathophysiology (Sinh lý bệnh)', definition: 'Quy luật rối loạn chức năng và cơ chế sinh học của bệnh lý.' },
      { term: 'Differential Diagnosis', definition: 'Quy trình loại trừ các bệnh cảnh có triệu chứng tương đồng.' },
    ],
    clinicalAspects: {
      anatomicalStructures: 'Cấu trúc giải phẫu liên quan trực tiếp và mạch máu/thần kinh chi phối.',
      clinicalManifestations: 'Triệu chứng sớm, triệu chứng toàn phát và hội chứng đặc hiệu.',
      diagnosticPrinciples: 'Tiêu chuẩn vàng chẩn đoán và các xét nghiệm cận lâm sàng cần ưu tiên.',
      treatmentPrinciples: 'Mục tiêu điều trị, can thiệp nội khoa/ngoại khoa và phục hồi chức năng.',
      contraindications: 'Các chống chỉ định tuyệt đối và tương đối, biến chứng nguy hiểm cần phòng ngừa.',
    },
    reflectionQuestions: [
      'Dấu hiệu nào trên lâm sàng giúp phân biệt chính xác bệnh cảnh này với các tổn thương lân cận?',
      'Tại sao cơ chế sinh lý bệnh trên lại dẫn đến biến chứng nguy hiểm nhất?',
      'Khi nào cần chuyển viện hoặc chỉ định can thiệp cấp cứu khẩn cấp?',
    ],
    pitfalls: [
      'Nhầm lẫn giữa triệu chứng cơ năng ban đầu với phản ứng sinh lý lành tính.',
      'Bỏ sót chống chỉ định thuốc khi bệnh nhân có bệnh nền chuyển hóa.',
    ],
    takeawayAction: 'Vẽ sơ đồ tư duy cơ chế sinh bệnh và liên hệ với ca lâm sàng thực tế.',
  });

  if (!HAS_API_KEY) {
    return res.json(generateFallback());
  }

  try {
    const detailPrompt = {
      concise: 'Tóm tắt nhanh, cô đọng tối đa, tập trung vào 4-5 điểm cốt lõi nhất.',
      standard: 'Tóm tắt tiêu chuẩn, cân bằng giữa tổng quan và chiều sâu lý thuyết.',
      detailed: 'Tóm tắt chi tiết, phân tích đầy đủ từng quy trình, cơ chế và dấu hiệu lâm sàng.',
      deepdive: 'Phân tích chuyên sâu học thuật bậc đại học/sau đại học, giải phẫu, sinh lý bệnh và y học chứng cứ.',
    }[detailLevel as string] || 'Tóm tắt tiêu chuẩn';

    let combinedText = textInput;
    const parts: any[] = [];

    if (hasFile) {
      const cleanBase64 = file.data.includes(',') ? file.data.split(',')[1] : file.data;
      const lowerName = String(file.name || '').toLowerCase();

      if (lowerName.endsWith('.docx') || file.mimeType.includes('wordprocessingml')) {
        const extracted = await mammoth.extractRawText({ buffer: Buffer.from(cleanBase64, 'base64') });
        if (extracted.value?.trim()) {
          combinedText = [combinedText, extracted.value.trim()].filter(Boolean).join('\n\n');
        }
      } else {
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: cleanBase64,
          },
        });
      }
    }

    const promptText = `Hãy phân tích và tóm tắt tài liệu học tập sau đây một cách bài bản, khoa học bằng Tiếng Việt (hoặc ngôn ngữ yêu cầu: ${language}):
Môn học / Chuyên khoa: ${subject}
Mức độ chi tiết: ${detailPrompt}
${file?.name ? `Tên tệp đính kèm: ${file.name}` : ''}

${combinedText ? `--- NỘI DUNG TÀI LIỆU / GHI CHÚ BỔ SUNG ---\n${combinedText}\n--- HẾT NỘI DUNG ---` : 'Hãy đọc kỹ toàn bộ nội dung trong tệp tài liệu đính kèm để trích xuất và tóm tắt đầy đủ.'}`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: parts.length === 1 ? promptText : { parts },
      config: {
        systemInstruction: `Bạn là Giáo sư kiêm Cố vấn Học thuật Y khoa và Đại học hàng đầu (StudyMate AI).
${MEDICAL_SAFETY_INSTRUCTION}
Nếu tài liệu liên quan đến Y học, Nha khoa hoặc Khoa học sự sống, hãy trích xuất chính xác:
- Cấu trúc giải phẫu (Anatomical structures)
- Biểu hiện lâm sàng (Clinical manifestations)
- Nguyên tắc chẩn đoán (Diagnostic principles)
- Nguyên tắc điều trị (Treatment principles)
- Chống chỉ định & biến chứng (Contraindications & complications)
- Những điểm dễ nhầm lẫn (Pitfalls)
Chỉ dựa trên nội dung tài liệu được cung cấp; không bịa đặt. Nếu tài liệu thiếu dữ liệu, ghi rõ "Không có trong tài liệu". Trả về cấu trúc JSON đúng chuẩn.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            overview: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            glossary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ['term', 'definition'],
              },
            },
            clinicalAspects: {
              type: Type.OBJECT,
              properties: {
                anatomicalStructures: { type: Type.STRING },
                clinicalManifestations: { type: Type.STRING },
                diagnosticPrinciples: { type: Type.STRING },
                treatmentPrinciples: { type: Type.STRING },
                contraindications: { type: Type.STRING },
              },
            },
            reflectionQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            pitfalls: { type: Type.ARRAY, items: { type: Type.STRING } },
            takeawayAction: { type: Type.STRING },
          },
          required: ['title', 'overview', 'keyPoints', 'glossary', 'reflectionQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return handleGeminiError(error, res, generateFallback);
  }
});

// 2. Endpoint Giải thích khái niệm đa góc nhìn (ELI5, Thực tế, Chuyên sâu, Lâm sàng, Socrates)
app.post('/api/gemini/explain', async (req: Request, res: Response) => {
  const { topic, subject = 'Chung', level = 'Đại học', mode = 'eli5', followUpHistory = [] } = req.body;
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({ error: true, message: 'Vui lòng cung cấp khái niệm cần giải thích.' });
  }

  const generateFallback = () => ({
    topic,
    mode,
    coreDefinition: `Khái niệm "${topic}" là một nguyên lý trọng tâm trong môn học ${subject}.`,
    explanation: `Bản chất của ${topic} liên quan đến mối tương tác có hệ thống giữa các yếu tố thành phần. Trong học tập và nghiên cứu, việc nắm vững ${topic} giúp liên kết các quy luật từ vi mô đến vĩ mô.`,
    mechanism: 'Cơ chế kích hoạt bao gồm 3 pha: Khởi động tín hiệu, chuyển tiếp trung gian và đáp ứng thực thi.',
    clinicalOrRealWorld: 'Trong thực tiễn lâm sàng/công việc, ${topic} xuất hiện khi xuất hiện sự mất cân bằng nội môi hoặc thay đổi tham số môi trường.',
    analogies: [
      'Ví như hệ thống van một chiều kiểm soát lưu lượng dòng chảy.',
      'Tương tự như trạm biến áp điều phối điện năng khi mạng lưới quá tải.',
    ],
    comparisonTable: [
      { feature: 'Bản chất', thisConcept: topic, relatedConcept: 'Khái niệm đối ứng tương tự' },
      { feature: 'Thời gian đáp ứng', thisConcept: 'Nhanh, cục bộ', relatedConcept: 'Chậm, toàn thân' },
      { feature: 'Ý nghĩa lâm sàng', thisConcept: 'Phát hiện sớm', relatedConcept: 'Theo dõi mạn tính' },
    ],
    keyTakeaways: [
      'Luôn ghi nhớ 3 dấu hiệu nhận biết bản chất của ' + topic,
      'Phân biệt rõ ràng với hiện tượng thứ phát đi kèm',
      'Liên hệ ngay với bài tập hoặc ca lâm sàng cụ thể',
    ],
    commonMistakes: [
      'Nhầm lẫn giữa nguyên nhân gốc rễ và triệu chứng hệ quả.',
    ],
    checkQuestions: [
      'Bạn hãy nêu lại cơ chế của ' + topic + ' mà không nhìn tài liệu?',
      'Nếu một tham số đầu vào bị ức chế, hệ thống sẽ biến đổi như thế nào?',
    ],
  });

  if (!HAS_API_KEY) {
    return res.json(generateFallback());
  }

  try {
    const modeInstructions: Record<string, string> = {
      eli5: 'Chế độ ELI5: Giải thích cực kỳ mộc mạc, dí dỏm, dùng hình tượng đời thường như đồ chơi, bóng bay, căn bếp để học sinh lớp 5 cũng hiểu ngay.',
      practical: 'Chế độ Ví dụ thực tiễn: Giải thích thông qua các tình huống đời sống, công việc, chuỗi lập luận từng bước rõ ràng.',
      deepdive: 'Chế độ Chuyên sâu Học thuật: Phân tích chi tiết mức độ đại học/sau đại học, cơ chế phân tử, định lý hoặc giải phẫu bệnh học chính xác.',
      clinical: 'Chế độ Ứng dụng Lâm sàng: Kết nối lý thuyết với bệnh cảnh lâm sàng, ca bệnh mô phỏng (Case vignette), biện luận chẩn đoán và lưu ý an toàn.',
      socratic: 'Chế độ Gia sư Socrates: Đặt các câu hỏi gợi mở, hướng dẫn người học tự suy luận từng bước thay vì đưa ra ngay đáp án hoàn chỉnh.',
    };

    const instruction = modeInstructions[mode] || modeInstructions.eli5;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Khái niệm cần giải thích: "${topic}"
Môn học: ${subject}
Trình độ người học: ${level}
Yêu cầu phong cách: ${instruction}
${followUpHistory.length > 0 ? `Lịch sử trao đổi trước đó: ${JSON.stringify(followUpHistory)}` : ''}`,
      config: {
        systemInstruction: `Bạn là Gia sư AI kiêm Giáo sư Y học/Đại học tận tâm (StudyMate AI).
${MEDICAL_SAFETY_INSTRUCTION}
Giải thích chính xác, logic, truyền cảm hứng bằng Tiếng Việt. Phân biệt rõ ví dụ sư phạm với phác đồ điều trị thực tế. Không đưa chỉ định cá nhân. Trả về JSON theo đúng schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            mode: { type: Type.STRING },
            coreDefinition: { type: Type.STRING },
            explanation: { type: Type.STRING },
            mechanism: { type: Type.STRING },
            clinicalOrRealWorld: { type: Type.STRING },
            analogies: { type: Type.ARRAY, items: { type: Type.STRING } },
            comparisonTable: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  feature: { type: Type.STRING },
                  thisConcept: { type: Type.STRING },
                  relatedConcept: { type: Type.STRING },
                },
                required: ['feature', 'thisConcept', 'relatedConcept'],
              },
            },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
            checkQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['topic', 'coreDefinition', 'explanation', 'keyTakeaways', 'checkQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return handleGeminiError(error, res, generateFallback);
  }
});

// 3. Endpoint Tạo Quiz trắc nghiệm tương tác & Ca lâm sàng
app.post('/api/gemini/quiz', async (req: Request, res: Response) => {
  const { content, subject = 'Y khoa', difficulty = 'medium', count = 5, questionType = 'mcq' } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: true, message: 'Vui lòng cung cấp nội dung hoặc chủ đề để tạo câu hỏi.' });
  }

  const clampedCount = Math.min(Math.max(Number(count) || 5, 2), 15);

  const generateFallback = () => ({
    quizTitle: `Bộ câu hỏi Ôn luyện: ${subject} (${difficulty.toUpperCase()})`,
    description: `Bộ câu hỏi kiểm tra khả năng Active Recall và biện luận kiến thức về ${content.slice(0, 35)}...`,
    questions: Array.from({ length: clampedCount }).map((_, idx) => ({
      id: idx + 1,
      type: questionType === 'vignette' ? 'vignette' : 'mcq',
      question: questionType === 'vignette'
        ? `[Ca lâm sàng ${idx + 1}] Bệnh nhân nam 45 tuổi nhập viện vì triệu chứng liên quan đến ${content.slice(0, 30)}. Xét nghiệm cho thấy bất thường chỉ số. Biện luận nào sau đây là phù hợp nhất?`
        : `Câu hỏi ${idx + 1}: Đặc điểm sinh lý bệnh học nào sau đây là quan trọng nhất liên quan đến ${content.slice(0, 30)}?`,
      options: [
        'A. Cơ chế bù trừ qua trung gian thần kinh thể dịch làm thay đổi tính thấm.',
        'B. Tăng áp lực thẩm thấu nội bào dẫn tới thoái hóa mô hạt cục bộ.',
        'C. Ức chế chọn lọc thụ thể bề mặt màng tế bào đích.',
        'D. Kích hoạt chuỗi phản ứng enzym phosphoryl hóa tầng.',
      ],
      correctAnswerIndex: (idx % 4),
      explanation: 'Phương án được chọn phản ánh đúng cơ chế bệnh sinh học được mô tả trong y văn chuẩn mực.',
      optionExplanations: [
        'A: Đúng vì đáp ứng thể dịch diễn ra sớm nhất trong pha kích hoạt.',
        'B: Sai vì áp lực thẩm thấu duy trì ổn định trong giai đoạn này.',
        'C: Sai vì thụ thể không bị ức chế mà được tăng cường biểu hiện.',
        'D: Sai vì quá trình phosphoryl hóa chỉ xảy ra ở pha tiếp theo.',
      ],
    })),
  });

  if (!HAS_API_KEY) {
    return res.json(generateFallback());
  }

  try {
    const diffDesc: Record<string, string> = {
      easy: 'Cơ bản (Ghi nhớ và nhận biết khái niệm cơ bản)',
      medium: 'Trung bình (Hiểu bản chất và vận dụng giải thích cơ chế)',
      hard: 'Nâng cao (Phân tích, chẩn đoán phân biệt và phản biện)',
      exam: 'Ôn thi chuyên sâu / Chứng chỉ hành nghề (Câu hỏi tình huống ca bệnh lâm sàng phức tạp, tích hợp đa môn)',
    };

    const typeDesc: Record<string, string> = {
      mcq: 'Trắc nghiệm chọn 1 đáp án đúng nhất (Single-best-answer MCQs chuẩn USMLE/Bộ Y Tế)',
      vignette: 'Câu hỏi ca lâm sàng tình huống bệnh nhân thực tế (Clinical Vignette) kèm triệu chứng, xét nghiệm và biện luận',
      multi: 'Câu hỏi nhiều lựa chọn đúng (Multiple-select)',
      tf: 'Câu hỏi Đúng / Sai kiểm tra các nhận định cốt lõi',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Hãy biên soạn bộ câu hỏi trắc nghiệm gồm ${clampedCount} câu chất lượng cao.
Chuyên ngành: ${subject}
Độ khó: ${diffDesc[difficulty] || diffDesc.medium}
Dạng câu hỏi: ${typeDesc[questionType] || typeDesc.mcq}

--- NỘI DUNG TÀI LIỆU ---
${content}
--- HẾT NỘI DUNG ---`,
      config: {
        systemInstruction: `Bạn là Chủ tịch Hội đồng Khảo thí Đại học Y Dược (StudyMate AI).
${MEDICAL_SAFETY_INSTRUCTION}
Thiết kế các câu hỏi trắc nghiệm khách quan chuẩn mực cho mục đích học tập:
- Câu hỏi rõ ràng, bám sát kiến thức chuẩn, không mập mờ.
- Đầy đủ 4 phương án (A, B, C, D) với distractors hợp lý có tính sư phạm.
- Có đúng chỉ số correctAnswerIndex (0, 1, 2 hoặc 3).
- Giải thích tổng quan lý do đáp án đúng.
- Phân tích chi tiết tại sao từng phương án đúng hoặc sai (optionExplanations).
- Không sử dụng ca lâm sàng như tư vấn điều trị cho bệnh nhân thật; ca lâm sàng chỉ là tình huống giả định phục vụ ôn tập.
Tất cả bằng Tiếng Việt. Trả về JSON theo đúng schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { type: Type.STRING },
            description: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  optionExplanations: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['id', 'question', 'options', 'correctAnswerIndex', 'explanation', 'optionExplanations'],
              },
            },
          },
          required: ['quizTitle', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return handleGeminiError(error, res, generateFallback);
  }
});

// 4. Endpoint Lập Lộ trình Học tập Spaced Repetition & Pomodoro
app.post('/api/gemini/roadmap', async (req: Request, res: Response) => {
  const { goal, subject = 'Y khoa', timeframeDays = 7, hoursPerDay = 2, currentLevel = 'Sinh viên Y khoa', examDate = '' } = req.body;
  if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
    return res.status(400).json({ error: true, message: 'Vui lòng cung cấp mục tiêu học tập.' });
  }

  const generateFallback = () => ({
    planTitle: `Lộ trình ${timeframeDays} ngày: ${goal}`,
    methodology: 'Spaced Repetition (Lặp lại ngắt quãng Ngày 1, 3, 7) kết hợp Pomodoro tập trung sâu',
    totalEstimatedPomodoros: timeframeDays * Math.round(Number(hoursPerDay) * 2),
    milestones: Array.from({ length: Math.min(Number(timeframeDays), 14) }).map((_, i) => ({
      day: i + 1,
      focusArea: `Giai đoạn ${i + 1}: Trọng tâm kiến thức phần ${i + 1} của ${goal.slice(0, 30)}`,
      pomodoroSessions: Math.round(Number(hoursPerDay) * 2),
      tasks: [
        { id: `t-${i}-1`, title: 'Chủ động đọc & Tóm tắt khái niệm nòng cốt', durationMinutes: 25, completed: false },
        { id: `t-${i}-2`, title: 'Active Recall: Tự giải thích lại cơ chế sinh bệnh', durationMinutes: 25, reviewInterval: i > 0 ? `Ôn ngắt quãng Ngày ${Math.max(1, i - 1)}` : undefined, completed: false },
        { id: `t-${i}-3`, title: 'Luyện 10 câu trắc nghiệm ca lâm sàng củng cố', durationMinutes: 25, completed: false },
      ],
      revisionTechnique: 'Phương pháp Feynman: Giải thích cho người học khác để lấp lỗ hổng kiến thức',
    })),
    studyTips: [
      'Áp dụng chu kỳ Pomodoro 25 phút tập trung + 5 phút nghỉ ngơi tuyệt đối không nhìn màn hình.',
      'Ôn lại bài cũ vào các ngày 1, 3, 7 để ký ức chuyển sang vùng lưu trữ dài hạn (Long-Term Potentiation).',
      'Luôn tự kiểm tra (Practice Testing) trước khi xem lại đáp án.',
    ],
  });

  if (!HAS_API_KEY) {
    return res.json(generateFallback());
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Hãy thiết kế một lộ trình học tập cá nhân hóa chuẩn sư phạm:
Mục tiêu: "${goal}"
Chuyên ngành: ${subject}
Thời lượng: ${timeframeDays} ngày
Thời gian mỗi ngày: ${hoursPerDay} giờ (${Math.round(hoursPerDay * 2)} phiên Pomodoro)
Trình độ hiện tại: ${currentLevel}
${examDate ? `Ngày thi dự kiến: ${examDate}` : ''}`,
      config: {
        systemInstruction: `Bạn là Chuyên gia Cố vấn Học tập & Huấn luyện viên Trí nhớ Khoa học (StudyMate AI).
${MEDICAL_SAFETY_INSTRUCTION}
Lập kế hoạch học tập giáo dục, không đưa chỉ định điều trị cá nhân. Áp dụng:
1. Spaced Repetition (Ôn lặp lại bài cũ các ngày trước).
2. Active Recall & Practice Testing (Câu hỏi kiểm tra, ca bệnh giả định cho ôn tập).
3. Pomodoro (25 phút mỗi phiên).
Trả về JSON đúng cấu trúc.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            methodology: { type: Type.STRING },
            totalEstimatedPomodoros: { type: Type.INTEGER },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  focusArea: { type: Type.STRING },
                  pomodoroSessions: { type: Type.INTEGER },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        durationMinutes: { type: Type.INTEGER },
                        reviewInterval: { type: Type.STRING },
                      },
                      required: ['id', 'title', 'durationMinutes'],
                    },
                  },
                  revisionTechnique: { type: Type.STRING },
                },
                required: ['day', 'focusArea', 'pomodoroSessions', 'tasks', 'revisionTechnique'],
              },
            },
            studyTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['planTitle', 'methodology', 'milestones', 'studyTips'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return handleGeminiError(error, res, generateFallback);
  }
});

// 5. Endpoint Gemini Notebook — Hỏi đáp & Tổng hợp có trích dẫn nguồn trên kho tài liệu
app.post('/api/gemini/notebook', async (req: Request, res: Response) => {
  const { question = '', sources = [], mode = 'qa', history = [] } = req.body || {};

  if (!Array.isArray(sources) || sources.length === 0) {
    return res.status(400).json({ error: true, message: 'Vui lòng chọn ít nhất 1 tài liệu nguồn trong kho lưu trữ.' });
  }
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: true, message: 'Vui lòng nhập câu hỏi hoặc yêu cầu tổng hợp cho Gemini Notebook.' });
  }

  const normalizedSources = sources.slice(0, 12).map((src: any, idx: number) => {
    const content = String(src.content || '').slice(0, 12000);
    const pageMatches = Array.from(content.matchAll(/\[Trang\s+(\d+)\]/gi)).map((m) => Number(m[1]));
    const pages = Array.from(new Set(pageMatches)).filter((n) => Number.isFinite(n)).slice(0, 20);
    return {
      index: idx + 1,
      id: String(src.id || ''),
      title: String(src.title || `Nguồn ${idx + 1}`),
      subject: String(src.subject || 'Chung'),
      content,
      pages,
    };
  });

  const generateFallback = () => ({
    answer: `Không thể kết nối AI để tổng hợp chính xác từ nguồn. Bạn đã chọn ${normalizedSources.length} tài liệu: ${normalizedSources.map((s) => `[Nguồn ${s.index}] ${s.title}`).join(', ')}. Vui lòng thử lại sau khi kết nối AI ổn định để nhận câu trả lời có trích dẫn kiểm chứng.`,
    citations: normalizedSources.slice(0, 3).map((s) => ({
      sourceIndex: s.index,
      sourceTitle: s.title,
      page: s.pages[0],
      excerpt: s.content.slice(0, 160) + (s.content.length > 160 ? '...' : ''),
    })),
    keyInsights: [
      'Chế độ dự phòng không tạo phân tích mới để tránh suy diễn ngoài tài liệu.',
      'Hãy kiểm tra trực tiếp các nguồn đã chọn và thử lại khi AI sẵn sàng.',
    ],
    suggestedQuestions: [
      'Những trang nào trong nguồn nói trực tiếp về vấn đề tôi đang hỏi?',
      'Nguồn nào có bằng chứng mạnh nhất cho câu hỏi này?',
    ],
  });

  if (!HAS_API_KEY) {
    return res.json(generateFallback());
  }

  try {
    const modeDirectives: Record<string, string> = {
      qa: 'Trả lời chính xác câu hỏi dựa hoàn toàn vào các tài liệu nguồn được cung cấp, kèm trích dẫn [Nguồn X, Trang Y] khi có thông tin trang.',
      study_guide: 'Biên soạn Study Guide có hệ thống từ các nguồn đã chọn, kèm trích dẫn [Nguồn X, Trang Y] khi có.',
      briefing: 'Tạo Briefing Doc nêu luận điểm chính và liên kết giữa các nguồn, kèm trích dẫn [Nguồn X, Trang Y] khi có.',
      compare: 'So sánh/đối chiếu các nguồn, nêu rõ điểm giống/khác và nêu [Nguồn X, Trang Y] cho từng luận điểm khi có.',
    };

    const sourceContext = normalizedSources
      .map((s) => {
        const pageInfo = s.pages.length ? ` | Trang phát hiện: ${s.pages.join(', ')}` : ' | Không có marker trang';
        return `=== [Nguồn ${s.index}] ${s.title} (Môn: ${s.subject}${pageInfo}) ===\n${s.content}\n=== Hết Nguồn ${s.index} ===`;
      })
      .join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Chế độ Notebook: ${modeDirectives[mode] || modeDirectives.qa}

--- KHO TÀI LIỆU NGUỒN ---
${sourceContext}
--- HẾT KHO TÀI LIỆU ---

${Array.isArray(history) && history.length > 0 ? `Lịch sử hỏi đáp trước đó:\n${JSON.stringify(history.slice(-6))}\n\n` : ''}Yêu cầu của người học: "${String(question).trim()}"`,
      config: {
        systemInstruction: `Bạn là Trợ lý Gemini Notebook của StudyMate AI.
${MEDICAL_SAFETY_INSTRUCTION}
Quy tắc bắt buộc:
1. Chỉ sử dụng thông tin có trong KHO TÀI LIỆU NGUỒN được cung cấp. Nếu nguồn không có, nói rõ "Không tìm thấy trong nguồn đã chọn".
2. Mọi luận điểm quan trọng phải có trích dẫn. Ưu tiên định dạng [Nguồn X, Trang Y] khi có marker trang; nếu không có trang, dùng [Nguồn X].
3. Không bịa số trang. Nếu thiếu số trang, để page = null hoặc bỏ qua Trang Y.
4. Trả lời bằng Tiếng Việt, rõ ràng, có cấu trúc. Trả về đúng schema JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sourceIndex: { type: Type.INTEGER },
                  sourceTitle: { type: Type.STRING },
                  page: { type: Type.INTEGER },
                  excerpt: { type: Type.STRING },
                },
                required: ['sourceTitle', 'excerpt'],
              },
            },
            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['answer', 'citations', 'keyInsights', 'suggestedQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return handleGeminiError(error, res, generateFallback);
  }
});

// 6. Endpoint Chatbot học thuật (thay thế gọi Gemini trực tiếp từ frontend)
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  const { question = '', history = [] } = req.body || {};
  const q = typeof question === 'string' ? question.trim() : '';
  if (!q) {
    return res.status(400).json({ error: true, message: 'Vui lòng nhập câu hỏi.' });
  }
  if (q.length > 4000) {
    return res.status(400).json({ error: true, message: 'Câu hỏi quá dài. Vui lòng rút gọn dưới 4000 ký tự.' });
  }

  const safeHistory = Array.isArray(history)
    ? history.slice(-8).map((m: any) => ({
        role: m?.role === 'assistant' ? 'assistant' : 'user',
        text: String(m?.text || '').slice(0, 1000),
      }))
    : [];

  const generateFallback = () => ({
    reply:
      'Mình đang gặp sự cố kết nối AI nên chưa thể trả lời chi tiết. Bạn có thể thử lại sau ít phút. Trong lúc chờ, hãy nêu rõ: (1) chủ đề, (2) bối cảnh học tập/ôn thi, (3) phần bạn đang chưa hiểu để mình hỗ trợ chính xác hơn khi hệ thống hoạt động trở lại.\n\nLưu ý: Nội dung chỉ mang tính giáo dục, không thay thế chẩn đoán hoặc tư vấn điều trị cá nhân.',
  });

  if (!HAS_API_KEY) {
    return res.json({
      ...generateFallback(),
      _fallback: true,
      _fallbackMessage: 'Máy chủ chưa cấu hình GEMINI_API_KEY. Vui lòng liên hệ quản trị viên.',
    });
  }

  try {
    const historyText = safeHistory
      .map((m) => `${m.role === 'assistant' ? 'Trợ lý' : 'Người học'}: ${m.text}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `${historyText ? `Lịch sử hội thoại gần đây:\n${historyText}\n\n` : ''}Câu hỏi hiện tại của người học: ${q}`,
      config: {
        systemInstruction: `Bạn là trợ lý học thuật AI cho sinh viên Y khoa, Răng Hàm Mặt và Đại học.
${MEDICAL_SAFETY_INSTRUCTION}
Phong cách: rõ ràng, sư phạm, dùng Markdown khi phù hợp, giải thích cơ chế và lưu ý điểm dễ nhầm.
Nếu người dùng hỏi chẩn đoán/điều trị cá nhân: từ chối đưa chỉ định cá nhân, cung cấp kiến thức giáo dục tổng quát và khuyến nghị gặp bác sĩ/chuyên gia y tế.
Cuối câu trả lời nên có 1 câu hỏi gợi mở học tập (không phải câu hỏi chẩn đoán cá nhân).`,
      },
    });

    const reply = (response.text || '').trim();
    return res.json({ reply: reply || generateFallback().reply });
  } catch (error) {
    return handleGeminiError(error, res, generateFallback);
  }
});

// Production vs Development setup with Vite
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`StudyMate AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
