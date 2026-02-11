import api from './config';

export const expenseAPI = {
  create: (expenseData) => {
    return api.post('/expenses', expenseData);
  },

  getExpense: (expenseId) => {
    return api.get(`/expenses/${expenseId}`);
  },

  getExpensesByGathering: (gatheringId) => {
    return api.get(`/expenses/gathering/${gatheringId}`);
  },

  update: (expenseId, expenseData) => {
    return api.patch(`/expenses/${expenseId}`, expenseData);
  },

  delete: (expenseId) => {
    return api.delete(`/expenses/${expenseId}`);
  }
};
