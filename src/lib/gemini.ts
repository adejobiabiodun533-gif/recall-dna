import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

export type ProcessingType = 'summary' | 'keyPoints' | 'mnemonics' | 'mcqs' | 'theory' | 'gaps';

export async function processStudyContent(content: string, types: ProcessingType[] = ['summary', 'keyPoints', 'mnemonics', 'mcqs', 'theory', 'gaps']) {
  const model = "gemini-3-flash-preview";

  const sanitizedContent = content
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .substring(0, 30000); 
  
  const properties: any = {};
  if (types.includes('summary')) properties.summary = { type: Type.STRING };
  if (types.includes('keyPoints')) properties.keyPoints = { type: Type.ARRAY, items: { type: Type.STRING } };
  if (types.includes('mnemonics')) properties.mnemonics = { type: Type.ARRAY, items: { type: Type.STRING } };
  if (types.includes('mcqs')) {
    properties.mcqs = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "answer"]
      }
    };
  }
  if (types.includes('theory')) {
    properties.theoryQuestions = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING }
        },
        required: ["question", "answer"]
      }
    };
  }
  if (types.includes('gaps')) {
    properties.fillInGaps = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING }
        },
        required: ["question", "answer"]
      }
    };
  }

  const response = await ai.models.generateContent({
    model,
    contents: `LECTURE NOTES:\n${sanitizedContent}`,
    config: {
      systemInstruction: `You are an elite academic tutor.
      CRITICAL: Use ONLY facts from the provided LECTURE NOTES.
      GOAL: Generate ${types.join(', ')}.
      VOLUME: Exhaust the material. If questions are requested, generate 20-30 total questions to ensure deep coverage.
      FORMAT: JSON ONLY.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties,
        required: types.map(t => {
          if (t === 'theory') return 'theoryQuestions';
          if (t === 'gaps') return 'fillInGaps';
          return t;
        })
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("AI returned an empty response.");

  try {
    return JSON.parse(text);
  } catch (e: any) {
    console.error("JSON Parse Error:", e.message);
    throw new Error("The AI response was incomplete. Try selecting fewer options or a shorter section.");
  }
}

export async function compareStudyAnswer(question: string, correctAnswer: string, userAnswer: string) {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Question: ${question}\nCorrect Answer: ${correctAnswer}\nUser Answer: ${userAnswer}`,
    config: {
      systemInstruction: `Compare the user's answer with the correct answer. 
      Be encouraging but honest. Score out of 100%. 
      Provide a brief feedback (max 2 sentences) explaining what they missed or got right.
      JSON format: { "score": number, "feedback": "string", "isCorrect": boolean }`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          feedback: { type: Type.STRING },
          isCorrect: { type: Type.BOOLEAN }
        },
        required: ["score", "feedback", "isCorrect"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { score: 0, feedback: "Error grading answer.", isCorrect: false };
  }
}

