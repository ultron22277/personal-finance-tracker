export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatMonth = (monthStr) => {
  const [year, month] = monthStr.split('-');
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Housing', 'Utilities', 'Healthcare',
  'Entertainment', 'Shopping', 'Education', 'Travel', 'Personal Care',
  'Savings', 'Investment', 'Salary', 'Freelance', 'Other',
];

export const CATEGORY_COLORS = {
  'Food & Dining': '#F59E0B',
  'Transportation': '#3B82F6',
  'Housing': '#8B5CF6',
  'Utilities': '#06B6D4',
  'Healthcare': '#EF4444',
  'Entertainment': '#EC4899',
  'Shopping': '#F97316',
  'Education': '#10B981',
  'Travel': '#14B8A6',
  'Personal Care': '#A78BFA',
  'Savings': '#34D399',
  'Investment': '#60A5FA',
  'Salary': '#6EE7B7',
  'Freelance': '#FCD34D',
  'Other': '#9CA3AF',
};
