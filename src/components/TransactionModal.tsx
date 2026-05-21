import React, { useState, useEffect } from 'react';
import { useFinanceStore, TransactionType, Transaction } from '../store/useFinanceStore';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
  transaction?: Transaction;
}

export function TransactionModal({ isOpen, onClose, type, transaction }: Props) {
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const updateTransaction = useFinanceStore((state) => state.updateTransaction);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản');

  const incomeCategories = ['Lương chính', 'Freelance', 'Đầu tư', 'Thưởng', 'Khác'];
  const expenseCategories = ['Ăn uống', 'Đi lại', 'Mua sắm', 'Nhà ở', 'Giải trí'];
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      const isCustom = !categories.includes(transaction.category);
      setCategory(isCustom ? 'Khác' : transaction.category);
      if (isCustom) setCustomCategory(transaction.category);
      setDescription(transaction.description);
      setDate(transaction.date);
      setPaymentMethod(transaction.paymentMethod || 'Chuyển khoản');
    } else {
      setAmount('');
      setCategory(categories[0]);
      setCustomCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Chuyển khoản');
    }
  }, [transaction, isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type,
      amount: parseFloat(amount),
      category: category === 'Khác' ? customCategory : category,
      description,
      date,
      paymentMethod
    };

    if (transaction?.id) {
      updateTransaction(transaction.id, data);
    } else {
      addTransaction(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[380px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-white">{transaction ? 'Sửa' : 'Thêm'} {type === 'income' ? 'Thu nhập' : 'Chi phí'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto scrollbar-hide">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Số tiền</label>
            <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Danh mục</label>
            <div className="space-y-2">
              <select 
                required 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Khác">Khác</option>
              </select>
              
              {category === 'Khác' && (
                <input 
                  type="text" 
                  required 
                  placeholder="Nhập danh mục khác..."
                  value={customCategory} 
                  onChange={(e) => setCustomCategory(e.target.value)} 
                  className="w-full bg-slate-950 border border-indigo-500/30 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium" 
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Mô tả</label>
            <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Phương thức</label>
            <select 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium appearance-none cursor-pointer"
            >
              {['Tiền mặt', 'Chuyển khoản', 'Ví điện tử', 'Thẻ'].map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Ngày</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
          </div>
          <button type="submit" className={cn("w-full py-2 rounded-lg font-bold text-white transition", type === 'income' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500')}>
            {transaction ? 'Cập nhật' : 'Thêm'}
          </button>
        </form>
      </div>
    </div>
  );
}
