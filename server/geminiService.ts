import { GoogleGenAI, Type } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

function getSafeGeminiError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return apiKey ? message.split(apiKey).join('[REDACTED]') : message;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
}

export interface AiComplaintValidationResult {
  isValidMaintenance: boolean;
  rejectionReason?: string;
  category: 'plumbing' | 'electrical' | 'carpentry' | 'civil_painting' | 'furniture_fixtures' | 'cleaning_sanitation' | 'other';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  reasoning: string;
  issueSummary: string;
  followUpQuestions: string[];
}

export interface AiRepairVerificationResult {
  result: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
  confidence: number;
  visualSummary: string;
  reasoning: string;
  sameObjectDetected: boolean;
  issueResolved: boolean;
  notesSupported: boolean;
}

// Resilient execution across valid models with retry
async function executeGeminiWithRetry<T>(
  fn: (ai: GoogleGenAI, modelName: string) => Promise<T>,
  model: string,
  retries = 2,
  baseDelayMs = 1000
): Promise<T> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  let lastError: any = null;
  let delay = baseDelayMs;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(ai, model);
    } catch (err: any) {
      lastError = err;
      const msg = err.message || '';
      const isTransient =
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota');
      if (isTransient && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      if (isTransient) {
        throw new Error(`Gemini model "${model}" is temporarily unavailable or rate-limited. Please try again later.`);
      }
      if (msg.includes('404') || msg.includes('NOT_FOUND')) {
        throw new Error(
          `Gemini model "${model}" is unavailable for this API key or does not support generateContent. Check GEMINI_MODEL and the model access enabled for this key.`
        );
      }
      if (msg.includes('401') || msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API key')) {
        throw new Error('Gemini authentication failed. Check that GEMINI_API_KEY is valid and has access to the configured model.');
      }
      break;
    }
  }
  throw lastError || new Error(`Gemini request failed using configured model "${model}".`);
}

function parseStructuredJson(text: string | undefined): any {
  if (!text) return {};
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        return {};
      }
    }
    return {};
  }
}

// Fallback rule-based analysis for when Gemini key is not set or network fails
export function fallbackRuleBasedAnalysis(params: {
  description: string;
  hostel?: string;
  location?: string;
}): AiComplaintValidationResult {
  const text = params.description.toLowerCase();
  let category: AiComplaintValidationResult['category'] = 'other';

  if (/leak|tap|pipe|flush|washroom|water|drain|clog|faucet|sink|shower|plumbing/.test(text)) {
    category = 'plumbing';
  } else if (/light|fan|socket|switch|mcb|shock|wire|spark|blackout|plug|ac|bulb|electrical|power/.test(text)) {
    category = 'electrical';
  } else if (/door|window|lock|hinge|latch|wood|handle|cupboard|almirah|carpentry/.test(text)) {
    category = 'carpentry';
  } else if (/paint|wall|crack|seepage|tile|floor|ceiling|plaster|civil/.test(text)) {
    category = 'civil_painting';
  } else if (/cot|bed|chair|table|desk|furniture|mattress/.test(text)) {
    category = 'furniture_fixtures';
  } else if (/clean|sanitation|waste|garbage|pest|cockroach|insect|sweep|dust/.test(text)) {
    category = 'cleaning_sanitation';
  }

  let priority: AiComplaintValidationResult['priority'] = 'MEDIUM';
  if (/emergency|fire|shock|spark|smoke|flood|collapse|severe hazard|urgent/.test(text)) {
    priority = 'CRITICAL';
  } else if (/blackout|no water|main door lock broken|jammed|heavy leak|overflow/.test(text)) {
    priority = 'HIGH';
  } else if (/minor|slow|loose|scratch|small|faint|paint peel|slight/.test(text)) {
    priority = 'LOW';
  }

  const followUpQuestions: string[] = [];
  if (!params.location || (params.location.toLowerCase().includes('room') && !/\d+/.test(params.location))) {
    followUpQuestions.push('Which specific room number or floor location is affected?');
  }
  if (category === 'plumbing' && !/tap|pipe|flush|shower|sink/.test(text)) {
    followUpQuestions.push('Which fixture is leaking or blocked (tap, shower, drain, or flush tank)?');
  }

  return {
    isValidMaintenance: true,
    category,
    priority,
    confidence: 0.92,
    reasoning: `Categorized as ${category} with ${priority} priority based on campus diagnostic keywords.`,
    issueSummary: params.description.slice(0, 140),
    followUpQuestions,
  };
}

export async function validateComplaintWithGemini(params: {
  description: string;
  imageBase64?: string;
  imageMimeType?: string;
  hostel?: string;
  location?: string;
}): Promise<AiComplaintValidationResult> {
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
  const hasPhoto = Boolean(params.imageBase64 && params.imageMimeType);
  if (!getGeminiClient()) {
    throw new Error('Gemini is not configured. Set GEMINI_API_KEY on the backend to classify complaints.');
  }

  const promptText = `
You are the AI Maintenance Inspector for Rajalakshmi Engineering College (REC) Hostel Facilities.
Evaluate this student/staff maintenance report.
Reported Hostel: ${params.hostel || 'Not specified'}
Reported Location: ${params.location || 'Not specified'}
Reported Description: "${params.description}"
Photo Attached: ${hasPhoto ? 'Yes' : 'No'}

Instructions:
1. Accept genuine campus maintenance issues (plumbing, electrical, carpentry, civil_painting, furniture_fixtures, cleaning_sanitation, other).
2. If an image is attached, verify it depicts real maintenance defects.
3. Categorize accurately and assign priority (CRITICAL, HIGH, MEDIUM, LOW).
4. Provide a concise summary and 1-2 follow-up clarification questions if key details are missing.
`;

  const contents: any[] = [];
  if (params.imageBase64 && params.imageMimeType) {
    contents.push({
      inlineData: {
        mimeType: params.imageMimeType,
        data: params.imageBase64.replace(/^data:[^;]+;base64,/, ''),
      },
    });
  }
  contents.push({ text: promptText });

  try {
    const response = await executeGeminiWithRetry(async (ai, configuredModel) => {
      return await ai.models.generateContent({
        model: configuredModel,
        contents: { parts: contents },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValidMaintenance: { type: Type.BOOLEAN },
              rejectionReason: { type: Type.STRING },
              category: { type: Type.STRING },
              priority: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              issueSummary: { type: Type.STRING },
              followUpQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['isValidMaintenance', 'category', 'priority', 'confidence', 'reasoning', 'issueSummary', 'followUpQuestions'],
          },
        },
      });
    }, model);

    const parsed = parseStructuredJson(response.text);
    const validCategories = ['plumbing', 'electrical', 'carpentry', 'civil_painting', 'furniture_fixtures', 'cleaning_sanitation', 'other'];
    const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    if (
      typeof parsed.isValidMaintenance !== 'boolean' ||
      !validCategories.includes(parsed.category) ||
      !validPriorities.includes(parsed.priority) ||
      typeof parsed.confidence !== 'number' ||
      typeof parsed.reasoning !== 'string' ||
      typeof parsed.issueSummary !== 'string' ||
      !Array.isArray(parsed.followUpQuestions)
    ) {
      throw new Error('Gemini returned an incomplete or invalid complaint classification.');
    }

    return {
      isValidMaintenance: parsed.isValidMaintenance,
      rejectionReason: parsed.rejectionReason,
      category: parsed.category,
      priority: parsed.priority,
      confidence: Math.min(Math.max(parsed.confidence, 0), 1),
      reasoning: parsed.reasoning,
      issueSummary: parsed.issueSummary,
      followUpQuestions: parsed.followUpQuestions,
    };
  } catch (err: any) {
    const safeMessage = getSafeGeminiError(err);
    console.error('[Gemini AI Complaint Analysis Error]:', safeMessage);
    throw new Error(`Gemini complaint analysis failed: ${safeMessage || 'Unknown provider error.'}`);
  }
}

export async function verifyRepairWithGemini(params: {
  originalPhotoBase64: string;
  originalMimeType: string;
  repairPhotoBase64: string;
  repairMimeType: string;
  repairNotes: string;
  category: string;
  description: string;
}): Promise<AiRepairVerificationResult> {
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
  if (!getGeminiClient()) {
    throw new Error('Gemini is not configured. Set GEMINI_API_KEY on the backend to verify repairs.');
  }

  const prompt = `
You are the AI Repair Verification Auditor for Rajalakshmi Engineering College (REC).
Compare:
Image 1: Original reported issue (${params.category}) - "${params.description}"
Image 2: After-repair completion photo submitted by the technician.
Technician Notes: "${params.repairNotes}"

Determine:
- Result: PASS, FAIL, or NEEDS_REVIEW
- Was the issue resolved?
- Does the repair photo support the technician's notes?
`;

  const contents = [
    {
      inlineData: {
        mimeType: params.originalMimeType,
        data: params.originalPhotoBase64.replace(/^data:[^;]+;base64,/, ''),
      },
    },
    {
      inlineData: {
        mimeType: params.repairMimeType,
        data: params.repairPhotoBase64.replace(/^data:[^;]+;base64,/, ''),
      },
    },
    { text: prompt },
  ];

  try {
    const response = await executeGeminiWithRetry(async (ai, configuredModel) => {
      return await ai.models.generateContent({
        model: configuredModel,
        contents: { parts: contents },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              result: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              sameObjectDetected: { type: Type.BOOLEAN },
              issueResolved: { type: Type.BOOLEAN },
              notesSupported: { type: Type.BOOLEAN },
              visualSummary: { type: Type.STRING },
              reasoning: { type: Type.STRING },
            },
            required: ['result', 'confidence', 'sameObjectDetected', 'issueResolved', 'notesSupported', 'visualSummary', 'reasoning'],
          },
        },
      });
    }, model);

    const parsed = parseStructuredJson(response.text);
    const validResults = ['PASS', 'FAIL', 'NEEDS_REVIEW'];
    if (
      !validResults.includes(parsed.result) ||
      typeof parsed.confidence !== 'number' ||
      typeof parsed.sameObjectDetected !== 'boolean' ||
      typeof parsed.issueResolved !== 'boolean' ||
      typeof parsed.notesSupported !== 'boolean' ||
      typeof parsed.visualSummary !== 'string' ||
      typeof parsed.reasoning !== 'string'
    ) {
      throw new Error('Gemini returned an incomplete or invalid repair verification.');
    }

    return {
      result: parsed.result,
      confidence: Math.min(Math.max(parsed.confidence, 0), 1),
      sameObjectDetected: parsed.sameObjectDetected,
      issueResolved: parsed.issueResolved,
      notesSupported: parsed.notesSupported,
      visualSummary: parsed.visualSummary,
      reasoning: parsed.reasoning,
    };
  } catch (err: any) {
    const safeMessage = getSafeGeminiError(err);
    console.error('[Gemini AI Repair Verification Error]:', safeMessage);
    throw new Error(`Gemini repair verification failed: ${safeMessage || 'Unknown provider error.'}`);
  }
}
