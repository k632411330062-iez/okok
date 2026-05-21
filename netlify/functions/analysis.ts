import { Handler } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "" || apiKey.includes("MY_GEMINI_API_KEY")) {
    console.error("GEMINI_API_KEY is missing in Netlify analysis function.");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Gemini API key is not configured." }),
    };
  }

  try {
    const { analysisData } = JSON.parse(event.body || "{}");
    
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build-analysis-netlify' }
      }
    });

    const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let response;
    let lastError;

    for (const modelId of models) {
      try {
        console.log(`Calling Gemini API for analysis with model: ${modelId}`);
        response = await ai.models.generateContent({
          model: modelId,
          contents: `Hãy phân tích dữ liệu tài chính sau của người dùng và tạo báo cáo chi tiết bằng tiếng Việt, rõ ràng, thực tế và dễ hiểu.

Dữ liệu:
${JSON.stringify(analysisData)}`,
          config: {
            systemInstruction: "Bạn là cố vấn tài chính chuyên nghiệp. Hãy phân tích dữ liệu tài chính của người dùng và trả về báo cáo theo cấu trúc JSON định sẵn (deepAnalysis, strategy). Mọi nhận xét phải dựa trên dữ liệu thực tế và có chiều sâu.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                deepAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    overallAnalysis: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                    contextualInsights: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          text: { type: Type.STRING }
                        },
                        required: ["type", "text"]
                      }
                    },
                    investmentAnalysis: { type: Type.STRING },
                    optimizationAnalysis: { type: Type.STRING },
                    opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    optimization: {
                      type: Type.OBJECT,
                      properties: {
                        potentialSaving: { type: Type.NUMBER },
                        tips: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              title: { type: Type.STRING },
                              saving: { type: Type.NUMBER }
                            },
                            required: ["title", "saving"]
                          }
                        }
                      },
                      required: ["potentialSaving", "tips"]
                    }
                  },
                  required: ["overallAnalysis", "strengths", "risks", "contextualInsights", "investmentAnalysis", "optimizationAnalysis", "opportunities", "optimization"]
                },
                strategy: {
                  type: Type.OBJECT,
                  properties: {
                    priorityActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    expenseControls: { type: Type.ARRAY, items: { type: Type.STRING } },
                    incomeOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedSavingsRate: {
                      type: Type.OBJECT,
                      properties: {
                        rate: { type: Type.NUMBER },
                        amount: { type: Type.NUMBER }
                      },
                      required: ["rate", "amount"]
                    },
                    plan90Days: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["priorityActions", "expenseControls", "incomeOpportunities", "suggestedSavingsRate", "plan90Days"]
                }
              },
              required: ["deepAnalysis", "strategy"]
            },
          }
        } as any);
        if (response) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelId} failed for analysis:`, err.message);
        if (err.message?.includes("503") || err.message?.includes("429")) {
          continue;
        }
        throw err;
      }
    }

    if (!response && lastError) throw lastError;

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: text,
    };
  } catch (error: any) {
    console.error("AI Analysis Netlify error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate analysis", details: error.message }),
    };
  }
};
