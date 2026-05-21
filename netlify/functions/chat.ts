import { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "" || apiKey.includes("MY_GEMINI_API_KEY")) {
    console.error("GEMINI_API_KEY is missing in Netlify function.");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: "Xin lỗi, hiện tại tôi chưa được cấu hình API Key để trả lời. Vui lòng kiểm tra lại cấu hình trên Netlify." 
      }),
    };
  }

  try {
    const { messages, text, financialSummary } = JSON.parse(event.body || "{}");
    
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-netlify',
        }
      }
    });

    const contextPrompt = financialSummary 
      ? `\n\nTHÔNG TIN TÀI CHÍNH HIỆN TẠI CỦA NGƯỜI DÙNG:
- Thu nhập: ${financialSummary.income} VNĐ
- Chi tiêu: ${financialSummary.expense} VNĐ
- Dòng tiền: ${financialSummary.cashFlow} VNĐ
- Tỷ lệ tiết kiệm: ${financialSummary.savingsRate}%.
Hãy ưu tiên sử dụng các số liệu này để cá nhân hóa câu trả lời.`
      : "";

    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));
    
    // Add current user message
    formattedMessages.push({
      role: "user",
      parts: [{ text }],
    });

    // Use gemini-3.5-flash with fallbacks if needed
    const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let result;
    let lastError;

    for (const modelId of models) {
      try {
        console.log(`Calling Gemini API with model: ${modelId}`);
        result = await ai.models.generateContent({
          model: modelId,
          contents: formattedMessages,
          config: {
            systemInstruction: "Bạn là cố vấn tài chính AI chuyên nghiệp của FinVest. Hãy phân tích câu hỏi và trả lời chuyên sâu, tin cậy. Luôn sử dụng danh sách gạch đầu dòng để làm rõ các ý chính trong câu trả lời." + contextPrompt,
            maxOutputTokens: 1024,
          }
        } as any);
        if (result) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelId} failed:`, err.message);
        if (err.message?.includes("503") || err.message?.includes("429")) {
          // Continue to next model
          continue;
        }
        throw err; // Re-throw other errors
      }
    }

    if (!result && lastError) throw lastError;

    const responseText = result.text;
    
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify({ text: responseText }),
    };
  } catch (error: any) {
    console.error("Chat Netlify Function error:", error);
    
    // Fallback response instead of error to keep UI usable
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: "Tôi đang gặp một chút gián đoạn kỹ thuật khi kết nối với bộ não AI. Tuy nhiên, tôi khuyên bạn nên duy trì kỷ luật chi tiêu và theo dõi sát sao dòng tiền hàng ngày để đảm bảo an toàn tài chính. Hãy thử lại sau ít phút nhé!"
      }),
    };
  }
};
