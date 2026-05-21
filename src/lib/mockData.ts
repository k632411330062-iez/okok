import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../store/useFinanceStore';

export const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  
  const random = (min: number, max: number, step: number = 50000) => {
    return Math.floor((Math.random() * (max - min) + min) / step) * step;
  };
  
  const addTx = (type: 'income' | 'expense', amount: number, category: string, description: string, date: string, paymentMethod: string) => {
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    transactions.push({
      id: uuidv4(),
      type,
      amount,
      category,
      description,
      date,
      time,
      paymentMethod
    });
  };

  // Timeline: Oct 2025 to May 2026
  const timepoints = [
    { year: 2025, month: 10 },
    { year: 2025, month: 11 },
    { year: 2025, month: 12 },
    { year: 2026, month: 1 },
    { year: 2026, month: 2 },
    { year: 2026, month: 3 },
    { year: 2026, month: 4 },
    { year: 2026, month: 5 },
  ];
  
  timepoints.forEach(({ year, month }) => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    let income = 0;
    let expense = 0;

    const isCurrentMonth = month === 5 && year === 2026;

    if (month === 10 && year === 2025) {
      expense = 20000000;
      income = isCurrentMonth ? 30000000 : expense;
    } else if (month === 11 && year === 2025) {
      expense = 20000000;
      income = isCurrentMonth ? 35000000 : expense;
    } else if (month === 12 && year === 2025) {
      expense = 45000000;
      income = isCurrentMonth ? 30000000 : expense;
    } else if (month === 1 && year === 2026) {
      expense = 50000000;
      income = isCurrentMonth ? 80000000 : expense;
    } else if (month === 2 && year === 2026) {
      expense = 65000000;
      income = isCurrentMonth ? 35000000 : expense;
    } else if (month === 3 && year === 2026) {
      expense = 30000000;
      income = isCurrentMonth ? 40000000 : expense;
    } else if (month === 4 && year === 2026) {
      expense = 45000000;
      income = isCurrentMonth ? 35000000 : expense;
    } else if (month === 5 && year === 2026) {
      income = 45000000;
      expense = 27000000;
    }

    // Distribute income
    addTx('income', income * 0.8, 'Lương chính', `Lương tháng ${month}/${year}`, `${monthStr}-05`, 'Chuyển khoản');
    addTx('income', income * 0.2, 'Freelance', 'Dự án phụ', `${monthStr}-20`, 'Tiền mặt');

    // Distribute expense
    const rent = 9000000;
    const util = 2000000;
    const travel = 1500000;
    const food = 4000000;
    const remaining = expense - (rent + util + travel + food);

    addTx('expense', rent, 'Nhà ở', 'Tiền thuê nhà', `${monthStr}-02`, 'Chuyển khoản');
    addTx('expense', util, 'Hóa đơn', 'Điện nước', `${monthStr}-08`, 'Thanh toán online');
    addTx('expense', travel, 'Đi lại', 'Xăng xe & Grab', `${monthStr}-15`, 'Ví điện tử');
    addTx('expense', food, 'Ăn uống', 'Ăn uống hàng ngày', `${monthStr}-12`, 'Thẻ');

    if (remaining > 0) {
      addTx('expense', remaining * 0.7, 'Mua sắm', 'Mua sắm cá nhân', `${monthStr}-22`, 'Thẻ');
      addTx('expense', remaining * 0.3, 'Giải trí', 'Xem phim, Cafe', `${monthStr}-25`, 'Tiền mặt');
    } else if (remaining < 0) {
      // If expense is small, just put one entry
       addTx('expense', expense, 'Cá nhân', 'Chi phí tổng hợp', `${monthStr}-10`, 'Thẻ');
    }
  });

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
