
export interface ExpenseVarianceAnalysis {
  changeAmount: number;
  changePercent: number;
  direction: "increase" | "decrease" | "none";
  topDrivers: {
    category: string;
    change: number;
    contribution: number;
  }[];
  summary: string;
}

export function analyzeExpenseVariance(
  currentTotalExpense: number,
  previousTotalExpense: number,
  currentCategories: { name: string; amount: number }[],
  previousCategories: { name: string; amount: number }[]
): ExpenseVarianceAnalysis {
  const changeAmount = currentTotalExpense - previousTotalExpense;
  const changePercent = previousTotalExpense === 0 
    ? 0 
    : (changeAmount / previousTotalExpense) * 100;
  
  const direction = changeAmount > 0 ? "increase" : changeAmount < 0 ? "decrease" : "none";

  if (direction === "none") {
    return {
      changeAmount: 0,
      changePercent: 0,
      direction: "none",
      topDrivers: [],
      summary: "Chi tiêu không thay đổi đáng kể so với kỳ trước."
    };
  }

  // Calculate category changes
  const categoryChanges: { category: string; change: number; contribution: number }[] = [];
  const allCategoryNames = Array.from(new Set([
    ...currentCategories.map(c => c.name),
    ...previousCategories.map(c => c.name)
  ]));

  for (const name of allCategoryNames) {
    const currentAmount = currentCategories.find(c => c.name === name)?.amount || 0;
    const previousAmount = previousCategories.find(c => c.name === name)?.amount || 0;
    const categoryChange = currentAmount - previousAmount;

    // Filter relevant changes based on direction
    if ((direction === "increase" && categoryChange > 0) || (direction === "decrease" && categoryChange < 0)) {
      categoryChanges.push({
        category: name,
        change: Math.abs(categoryChange), // Keep absolute change for sorting drivers
        contribution: 0 // Will calculate next
      });
    }
  }

  // We need the absolute total change for contribution distribution among the filtered categories.
  // Wait, the prompt says: Contribution Percent = categoryChange / Total Expense Change × 100.
  // Let's use the actual category change and total change to maintain signs, but since we filtered based on direction, both should have the same sign.
  for (const item of categoryChanges) {
    item.contribution = (item.change / Math.abs(changeAmount)) * 100;
  }

  // Sort by contribution
  categoryChanges.sort((a, b) => b.contribution - a.contribution);
  const topDrivers = categoryChanges.slice(0, 3);

  // Generate summary
  let summary = "";
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu VNĐ`;
    if (amount >= 1000) return `${(amount / 1000).toLocaleString('vi-VN')} nghìn VNĐ`;
    return `${amount.toLocaleString('vi-VN')} VNĐ`;
  };

  const formattedPercent = Math.abs(changePercent).toLocaleString('vi-VN', { maximumFractionDigits: 1 });

  if (topDrivers.length === 0) {
    summary = `Chi tiêu ${direction === "increase" ? "tăng" : "giảm"} ${formattedPercent}% so với kỳ trước, nhưng bù trừ đều giữa các danh mục.`;
  } else {
    const dirText = direction === "increase" ? "tăng" : "giảm";
    summary = `Chi tiêu ${dirText} ${formattedPercent}% so với kỳ trước. `;
    
    if (topDrivers[0].contribution >= 50) {
      summary += `Nguyên nhân chính là chi phí ${topDrivers[0].category} ${dirText} ${formatAmount(topDrivers[0].change)}, đóng góp ${Math.round(topDrivers[0].contribution)}% vào tổng mức ${dirText}. `;
      if (topDrivers.length > 1) {
        const others = topDrivers.slice(1).map(d => `${d.category} và `).join('').slice(0, -4);
        const othersVerbs = topDrivers.slice(1).map(d => `${formatAmount(d.change)}`).join(' và ');
        if (topDrivers.length === 2) {
           summary += `Ngoài ra, ${topDrivers[1].category} cũng ${dirText} ${formatAmount(topDrivers[1].change)}.`;
        } else {
           summary += `Ngoài ra, ${topDrivers[1].category} và ${topDrivers[2].category} cũng lần lượt ${dirText} ${formatAmount(topDrivers[1].change)} và ${formatAmount(topDrivers[2].change)}.`;
        }
      }
    } else {
      const driverNames = topDrivers.map(d => d.category).join(', ').replace(/, ([^,]*)$/, ' và $1');
      summary += `Chi tiêu ${dirText} do sự ${direction === "increase" ? "gia tăng" : "sụt giảm"} ở ${driverNames}.`;
    }
  }

  // Restore sign for output 'change' field based on direction, though absolute might be fine for UI, let's keep exact math for the 'change' property
  const finalizedDrivers = topDrivers.map(d => ({
    category: d.category,
    change: direction === "increase" ? d.change : -d.change,
    contribution: d.contribution
  }));

  return {
    changeAmount,
    changePercent,
    direction,
    topDrivers: finalizedDrivers,
    summary: summary.trim()
  };
}

export interface AIAnalysis {
  deepAnalysis: {
    overallAnalysis: string;
    strengths: string[];
    risks: string[];
    contextualInsights: {
      type: "savings" | "emergency" | "investment";
      text: string;
    }[];
    investmentAnalysis: string;
    optimizationAnalysis: string;
    opportunities: string[];
    optimization: {
      potentialSaving: number;
      tips: {
        title: string;
        saving: number;
      }[];
    };
  };
  strategy: {
    priorityActions: string[];
    expenseControls: string[];
    incomeOpportunities: string[];
    suggestedSavingsRate: {
      rate: number;
      amount: number;
    };
    plan90Days: string[];
  };
}

export function generateFinancialAnalysis(
  healthMetrics: {
    total: number;
    rating: string;
    components: {
      cashFlow: { score: number };
      savings: { score: number };
      investment: { score: number };
      safety: { score: number };
    };
  },
  totalIncome: number,
  totalExpense: number,
  savingsRate: number,
  investmentRate: number,
  emergencyFundMonths: number,
  topExpenseCategories: { name: string; amount: number; ratio: number }[],
  spendingTrend?: number,
  incomeDependency?: number
): AIAnalysis {
  const savingsRatePercent = savingsRate * 100;
  const netCashFlow = totalIncome - totalExpense;
  
  // 1. Generate Overall Analysis (STRICT 3-SENTENCE RULE)
  let overallAnalysis = "";
  if (totalIncome > 0) {
    // Sentence 1: Conclusion
    overallAnalysis += `Với ${healthMetrics.total}/100 điểm, sức khỏe tài chính của bạn đang ở mức ${healthMetrics.rating}. `;

    // Sentence 2: Strengths (Highest sub-score)
    const scores = [
      { name: "dòng tiền", score: healthMetrics.components.cashFlow.score },
      { name: "tích lũy", score: healthMetrics.components.savings.score },
      { name: "đầu tư", score: healthMetrics.components.investment.score },
      { name: "an toàn tài chính", score: healthMetrics.components.safety.score },
    ];
    const best = scores.reduce((prev, current) => (prev.score > current.score) ? prev : current);
    
    overallAnalysis += `Điểm mạnh nổi bật là ${best.name} được duy trì ở mức ${best.score}/100, giúp bạn ${best.score >= 80 ? 'hoàn toàn chủ động' : 'bắt đầu ổn định'} các kế hoạch dài hạn. `;

    // Sentence 3: Weakness / Recommendation (Lowest sub-score or critical metric)
    const worst = scores.reduce((prev, current) => (prev.score < current.score) ? prev : current);
    
    if (emergencyFundMonths < 3) {
      overallAnalysis += `Tuy nhiên, bạn nên ưu tiên củng cố quỹ dự phòng vì mức ${emergencyFundMonths.toFixed(1)} tháng chi tiêu hiện tại vẫn dưới ngưỡng an toàn tối thiểu (3-6 tháng).`;
    } else if (incomeDependency && incomeDependency > 70) {
      overallAnalysis += `Tuy nhiên, mức phụ thuộc thu nhập ${Math.round(incomeDependency)}% vào một nguồn duy nhất là một rủi ro đáng kể cần đa dạng hóa sớm.`;
    } else if (spendingTrend && spendingTrend > 15) {
      overallAnalysis += `Tuy nhiên, xu hướng chi tiêu đang tăng mạnh (+${spendingTrend.toFixed(1)}%) so với kỳ trước, đòi hỏi sự kiểm soát chặt chẽ hơn để bảo toàn thặng dư.`;
    } else if (worst.score < 60) {
      overallAnalysis += `Hành động ưu tiên hiện nay là tập trung cải thiện chỉ số ${worst.name} để củng cố sức khỏe tài chính tổng thể bền vững hơn.`;
    } else {
      overallAnalysis += `Bạn hãy tiếp tục duy trì kỷ luật hiện tại và cân nhắc việc tối ưu hóa tỷ suất đầu tư để tận dụng tối đa sức mạnh của lãi kép.`;
    }
  } else {
    overallAnalysis = "Chưa có dữ liệu thu nhập để thực hiện phân tích tổng thể. Vui lòng cập nhật thông tin dòng tiền của bạn.";
  }

  // 2. Strengths & Risks
  const strengths: string[] = [];
  const risks: string[] = [];

  if (netCashFlow > 0) strengths.push("Duy trì dòng tiền dương ổn định hàng tháng.");
  if (savingsRatePercent >= 20) strengths.push("Tỷ lệ tích lũy vốn liên tục và kỉ luật.");
  if (investmentRate > 0.15) strengths.push("Tỷ lệ đầu tư cao hơn mức khuyến nghị 15%.");
  if (emergencyFundMonths >= 3) strengths.push("Sở hữu lượng tiền dự phòng vững chắc.");

  if (emergencyFundMonths < 3) risks.push("Quỹ khẩn cấp chưa đạt chuẩn an toàn 3-6 tháng.");
  if (topExpenseCategories.some(c => c.ratio > 40)) risks.push("Cơ cấu chi tiêu thiếu đa dạng, tập trung quá mức vào một nhóm.");
  if (savingsRatePercent < 15) risks.push("Tốc độ tích lũy tài sản còn chậm so với tiềm năng.");
  if (totalIncome > 0 && netCashFlow < totalIncome * 0.1) risks.push("Biên độ an toàn tài chính mỏng, dễ tổn thương trước biến cố.");

  // 3. Contextual Insights
  const contextualInsights: { type: "savings" | "emergency" | "investment", text: string }[] = [];
  
  // Savings
  if (savingsRatePercent >= 30) {
    contextualInsights.push({ type: "savings", text: `Tỷ lệ tích lũy đạt ${savingsRatePercent.toFixed(1)}%, cao hơn đáng kể so with mức khuyến nghị tối thiểu 20%. Bạn đang dành một phần lớn thu nhập cho mục tiêu gia tăng tài sản trung và dài hạn.` });
  } else if (savingsRatePercent >= 20) {
    contextualInsights.push({ type: "savings", text: `Tỷ lệ tích lũy đạt mức ${savingsRatePercent.toFixed(1)}%, cho thấy bạn đã tạo lập thói quen kiểm soát tốt chi tiêu và tích lũy.` });
  } else {
    contextualInsights.push({ type: "savings", text: `Tỷ lệ tích lũy của bạn hiện là ${savingsRatePercent.toFixed(1)}%, thấp hơn mức chuẩn 20%. Bạn cần có chiến lược dồn nhiều hơn thu nhập vào tiết kiệm.` });
  }

  // Emergency
  if (emergencyFundMonths < 3) {
    contextualInsights.push({ type: "emergency", text: `Quy mô quỹ khẩn cấp hiện tương đương ${emergencyFundMonths.toFixed(1)} tháng thu chi, đang ở dưới ngưỡng đảm bảo an toàn tối thiểu (3 - 6 tháng). Dòng tiền có thể gặp khó khăn nếu xảy ra biến cố.` });
  } else {
    contextualInsights.push({ type: "emergency", text: `Tài sản thanh khoản quy đổi được thành quỹ khẩn cấp đủ cho ${emergencyFundMonths.toFixed(1)} tháng, đáp ứng định mức đề nghị và giúp bạn an tâm xử lý rủi ro.` });
  }

  // Investment
  const invRatePercent = investmentRate * 100;
  if (invRatePercent >= 15) {
     contextualInsights.push({ type: "investment", text: `Tỷ suất đầu tư chủ động chiếm ${invRatePercent.toFixed(1)}% thu nhập dư dả. Việc đẩy dòng tiền vào các tài sản sinh lời sẽ tối đa hóa tác động của sức mạnh lãi kép qua thời gian.` });
  } else {
     contextualInsights.push({ type: "investment", text: `Tỷ suất đầu tư hiện đạt ${invRatePercent.toFixed(1)}%. Gia tăng tỷ lệ này sẽ giúp bạn đạt được các mục tiêu tài chính dài hạn nhanh chóng hơn.` });
  }

  // 4. Investment & Optimization Analysis (Strings for the right box)
  const investmentAnalysis = `Cơ cấu danh mục đầu tư hiện tại đang tập trung vào sự tăng trưởng ổn định. Với lợi suất kỳ vọng trung bình đạt mức hợp lý, bạn có thể cân nhắc gia tăng nhẹ phần tài sản rủi ro nếu thời gian đầu tư còn dài. Danh mục này phù hợp với mục tiêu tích lũy lâu dài, tuy nhiên cần chú ý bám sát biến động thị trường.`;
  
  let optimizationAnalysis = "";
  if (topExpenseCategories.length > 0) {
    const topCat = topExpenseCategories[0];
    const saveAmt = topCat.amount * 0.15;
    optimizationAnalysis = `Khoản chi lớn nhất hiện tại là ${topCat.name}, chiếm ${Math.round(topCat.ratio)}% tổng chi tiêu. Nếu chủ động cắt giảm khoảng 15%, bạn có thể tiết kiệm được khoảng ${(saveAmt / 1000000).toFixed(1)} triệu VNĐ mỗi tháng, quy đổi ra xấp xỉ ${((saveAmt * 12) / 1000000).toFixed(1)} triệu VNĐ mỗi năm.`;
  } else {
    optimizationAnalysis = "Biểu đồ chi tiêu cho thấy sự kiểm soát khá tốt. Bạn có thể xem xét tối ưu thêm các dịch vụ định kỳ hoặc cắt giảm 5-10% chi phí biến đổi để tăng thêm thanh khoản.";
  }

  const opportunities = [
     `Tối ưu hóa các nhóm tiêu sản hàng đầu như ${topExpenseCategories[0]?.name || 'chi tiêu cá nhân'} sẽ ngay lập tức giải phóng một lượng thanh khoản không nhỏ.`
  ];

  // 5. Optimization Tips
  const tips = [];
  let potentialSaving = 0;
  
  for (const cat of topExpenseCategories) {
    if (cat.name === "Ăn uống" && cat.ratio > 20) {
       const saving = cat.amount * 0.15;
       tips.push({ title: "Cắt giảm 15% ăn uống", saving });
       potentialSaving += saving;
    }
  }

  // 5. Strategy
  const priorityActions = ["Tăng quỹ khẩn cấp", "Tối ưu các khoản chi lớn", "Tăng tỷ lệ đầu tư"];
  const expenseControls = topExpenseCategories.slice(0, 3).map(c => c.name);
  const incomeOpportunities = [
    "Kinh doanh Freelance phù hợp kỹ năng",
    "Đầu tư vào chứng chỉ quỹ hoặc cổ phiếu",
    "Tìm kiếm thêm nguồn thu nhập thụ động"
  ];
  
  const suggestedRate = savingsRatePercent < 20 ? 20 : Math.max(savingsRatePercent, 20);
  const suggestedSavingsRate = {
    rate: suggestedRate,
    amount: (totalIncome * suggestedRate) / 100
  };
  
  const plan90Days = ["Tối ưu dòng tiền", "Tăng thu nhập", "Xây dựng quỹ khẩn cấp"];

  return {
    deepAnalysis: {
      overallAnalysis,
      strengths: strengths.slice(0, 4),
      risks: risks.slice(0, 4),
      contextualInsights,
      investmentAnalysis,
      optimizationAnalysis,
      opportunities,
      optimization: { potentialSaving, tips },
    },
    strategy: {
      priorityActions,
      expenseControls,
      incomeOpportunities,
      suggestedSavingsRate,
      plan90Days
    }
  };
}
