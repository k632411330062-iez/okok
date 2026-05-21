import { Handler } from "@netlify/functions";
import axios from "axios";

export const handler: Handler = async (event) => {
  const path = event.path;
  // Match /api/stock/SYMBOL or /api/stock/SYMBOL/chart
  // event.path might be "/.netlify/functions/stock/..." or "/api/stock/..."
  // Depending on how Netlify handles the redirect.
  
  const segments = path.split("/").filter(Boolean);
  // Expected segments: ["api", "stock", "SYMBOL"] or ["api", "stock", "SYMBOL", "chart"]
  // Or if redirected: [".netlify", "functions", "stock", "SYMBOL"]
  
  // Find where "stock" is
  const stockIdx = segments.indexOf("stock");
  if (stockIdx === -1 || segments.length <= stockIdx + 1) {
    return { statusCode: 400, body: "Symbol missing" };
  }

  const symbol = segments[stockIdx + 1].toUpperCase();
  const isChart = segments[stockIdx + 2] === "chart";

  try {
    if (isChart) {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 86400 * 3;
      const response = await axios.get(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=15&symbol=${symbol}&from=${from}&to=${to}`);
      const data = response.data;
      
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
        
        const lastDayPoints = points.slice(-30);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lastDayPoints),
        };
      }
      return { statusCode: 200, body: "[]" };
    } else {
      // Detail
      if (symbol === "VNINDEX") {
        const to = Math.floor(Date.now() / 1000);
        const from = to - 86400 * 5;
        const response = await axios.get(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=VNINDEX&from=${from}&to=${to}`);
        const data = response.data;
        if (data.s === "ok" && data.c.length > 0) {
          const lastIdx = data.c.length - 1;
          const preIdx = Math.max(0, lastIdx - 1);
          const close = data.c[lastIdx];
          const prevClose = data.c[preIdx];
          const percentChange = ((close - prevClose) / prevClose) * 100;
          
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
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
            }),
          };
        }
        throw new Error("No data for VNINDEX");
      }

      const response = await axios.get(`https://api-finance-t19.24hmoney.vn/v1/ios/stock/detail?symbol=${symbol}`);
      const json = response.data;
      if (json.data?.share_detail) {
        const detail = json.data.share_detail;
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
          }),
        };
      }
      throw new Error("Invalid stock format");
    }
  } catch (error: any) {
    console.error(`Error in stock function for ${symbol}:`, error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch stock data", details: error.message }),
    };
  }
};
