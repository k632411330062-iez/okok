import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Global logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const generateWithRetry = async (params: any, maxRetries = 4) => {
  // Priority order for models to try
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI API] Attempting with model: ${model}, attempt: ${attempt}/${maxRetries}`);
        return await ai.models.generateContent({ ...params, model });
      } catch (error: any) {
        lastError = error;
        
        // ... (rest logic) ...
        const isRateLimit = error.message?.includes("429") || error.status === 429 || JSON.stringify(error).includes("429");
        const isBusy = error.message?.includes("503") || error.status === 503 || JSON.stringify(error).includes("503");
        const isTimeout = error.message?.includes("504") || error.message?.includes("deadline") || error.message?.includes("timeout");

        if (isRateLimit || isBusy || isTimeout) {
          const baseDelay = isRateLimit ? 3000 : 2000;
          const delay = Math.min(15000, (baseDelay * Math.pow(1.5, attempt - 1)) + Math.random() * 1000);
          console.warn(`[AI API] retrying in ${delay}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
  }
  throw lastError;
};

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is reachable" });
});

app.post("/api/gen-analysis", async (req, res) => {
  try {
    const { analysisData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === "" || apiKey.includes("MY_GEMINI_API_KEY")) {
      console.warn("GEMINI_API_KEY is missing or using placeholder.");
      return res.json({ 
        error: "API key is missing. Vui lòng cấu hình GEMINI_API_KEY trong Settings > Secrets.",
        needsKey: true 
      });
    }

    const response = await generateWithRetry({
      contents: `Hãy phân tích dữ liệu tài chính sau của người dùng và tạo báo cáo chi tiết bằng tiếng Việt, rõ ràng, thực tế và dễ hiểu.

Yêu cầu:
- Chỉ sử dụng dữ liệu được cung cấp.
- Không bịa số liệu.
- Giải thích cụ thể ý nghĩa của từng chỉ số.
- Nêu điểm mạnh, điểm yếu, rủi ro và cơ hội cải thiện.
- Phân tích nguyên nhân chi tiêu tăng (nếu có).
- Đưa ra khuyến nghị định lượng cụ thể.
- Văn phong chuyên nghiệp nhưng thân thiện.

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
        }
      }
    });

    const text = response?.text;
    if (!text) throw new Error("Empty response from AI");
    
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    
    if (error.message?.includes("503") || error.message?.includes("429")) {
      return res.status(503).json({ error: "Hệ thống AI hiện đang quá tải. Vui lòng thử lại sau giây lát." });
    }

    if (error.message?.includes("PERMISSION_DENIED") || error.message?.includes("403")) {
      return res.json({ 
        error: "Permission denied. Please ensure your Gemini API key is valid and has the necessary permissions.",
        details: error.message
      });
    }

    res.json({ error: "Failed to generate analysis", details: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages, text, financialSummary } = req.body;
  console.log(`[Chat API] NEW REQUEST - Text: "${text?.substring(0, 50)}...", Messages: ${messages?.length || 0}`);
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === "" || apiKey.includes("MY_GEMINI_API_KEY")) {
      console.warn("[Chat API] API key missing for chat");
      return res.status(401).json({ error: "Gemini API key is not configured. Vui lòng cấu hình trong Settings > Secrets." });
    }

    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    // Add financial context if available
    let userPrompt = text;
    if (financialSummary) {
      userPrompt = `Dưới đây là thông tin tài chính hiện tại của tôi để bạn tham khảo:\n- Thu nhập: ${financialSummary.income}\n- Chi tiêu: ${financialSummary.expense}\n- Dòng tiền ròng: ${financialSummary.cashFlow}\n- Tỷ lệ tiết kiệm: ${financialSummary.savingsRate}%\n\nCâu hỏi của tôi là: ${text}`;
    }

    formattedMessages.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const response = await generateWithRetry({
      contents: formattedMessages,
      config: {
        systemInstruction: "Bạn là cố vấn tài chính AI chuyên nghiệp của FinVest. Hãy phân tích câu hỏi và trả lời chuyên sâu, tin cậy. Luôn sử dụng danh sách gạch đầu dòng để làm rõ các ý chính trong câu trả lời.",
      }
    });

    const aiText = response?.text || "Tôi không nhận được phản hồi từ mô hình AI.";
    console.log(`[Chat API] Request SUCCESS. Response length: ${aiText.length}`);
    res.json({ text: aiText });
  } catch (error: any) {
    console.error("[Chat API] Unexpected error caught:", error.message);
    if (error.message?.includes("503") || error.message?.includes("429")) {
      return res.status(503).json({ error: "Hệ thống AI hiện đang quá tải. Vui lòng thử lại sau giây lát." });
    }
    res.status(500).json({ error: "Lỗi kết nối AI", details: error.message });
  }
});

// Stock Price Proxy
app.get("/api/stock/:symbol", async (req, res) => {
  let { symbol } = req.params;
  symbol = symbol.toUpperCase();
  
  try {
    if (symbol === "VNINDEX") {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 86400 * 5; // Look back 5 days
      const response = await fetch(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=VNINDEX&from=${from}&to=${to}`);
      if (!response.ok) throw new Error("Failed to fetch VNINDEX");
      const data = await response.json();
      if (data.s === "ok" && data.c.length > 0) {
        const lastIdx = data.c.length - 1;
        const preIdx = Math.max(0, lastIdx - 1);
        const close = data.c[lastIdx];
        const prevClose = data.c[preIdx];
        const percentChange = ((close - prevClose) / prevClose) * 100;
        
        return res.json({
          price: close,
          close,
          percentChange,
          basicPrice: prevClose,
          open: data.o[lastIdx],
          high: data.h[lastIdx],
          low: data.l[lastIdx],
          accumulatedVol: data.v[lastIdx] * 1000,
          accumulatedVal: data.v[lastIdx] * close * 1000,
          lastTime: "14:45"
        });
      }
      throw new Error("No data");
    }

    const response = await fetch(`https://api-finance-t19.24hmoney.vn/v1/ios/stock/detail?symbol=${symbol}`);
    if (!response.ok) throw new Error("Failed to fetch from 24hmoney");
    const json = await response.json();
    if (json.data?.share_detail) {
      const detail = json.data.share_detail;
      return res.json({
        price: detail.match_price || detail.close_price,
        close: detail.close_price,
        percentChange: detail.change_percent,
        basicPrice: detail.basic_price,
        open: detail.open_price,
        high: detail.hieghest_price || detail.highest_price || detail.close_price,
        low: detail.lowest_price || detail.close_price,
        accumulatedVol: detail.accumylated_vol * 10,
        accumulatedVal: detail.accumulated_val * 1000000000,
        lastTime: detail.time
      });
    }
    throw new Error("Invalid format");
  } catch (error) {
    console.error(`Error fetching stock ${symbol}:`, error);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

// Stock Chart Proxy (Last Day)
app.get("/api/stock/:symbol/chart", async (req, res) => {
  let { symbol } = req.params;
  symbol = symbol.toUpperCase();
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 86400 * 3; // Look back 3 days to ensure we have data
    const response = await fetch(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=15&symbol=${symbol}&from=${from}&to=${to}`);
    if (!response.ok) throw new Error("Failed to fetch chart");
    const data = await response.json();
    
    if (data.s === "ok") {
      const points = data.t.map((timestamp: number, idx: number) => {
        const date = new Date(timestamp * 1000);
        return {
          timestamp,
          time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
          price: data.c[idx],
          open: data.o[idx],
          high: data.h[idx],
          low: data.l[idx],
        };
      });
      
      if (points.length === 0) return res.json([]);
      const lastDayPoints = points.slice(-30);
      return res.json(lastDayPoints);
    }
    res.json([]);
  } catch (error) {
    console.error(`Error fetching chart ${symbol}:`, error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

// Export app for serverless deployment (Vercel)
export default app;

// Setup local dev and static serving only if not imported (like by Vercel)
if (process.env.NODE_ENV !== "test" && typeof require !== 'undefined' && require.main === module || process.argv[1].includes('server.ts') || process.argv[1].includes('server.cjs')) {
  (async () => {
    if (process.env.NODE_ENV !== "production") {
       const vite = await createViteServer({
         server: { middlewareMode: true },
         appType: "spa",
       });
       app.use(vite.middlewares);
     } else {
       const distPath = path.join(process.cwd(), "dist");
       app.use(express.static(distPath));
       app.get("*", (req, res) => {
         res.sendFile(path.join(distPath, "index.html"));
       });
     }

     // Global Error Handler
     app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
       console.error("Global error handler caught:", err);
       res.status(err.status || 500).json({
         error: "Unexpected server error",
         details: err.message || String(err)
       });
     });

     app.listen(PORT, "0.0.0.0", () => {
       console.log(`Server running on port ${PORT}`);
     });
  })();
}
