import api from './api';

// --- Interfaces based on your backend ---

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface Transaction {
  id: number;
  amount: number;
  transaction_type: 'deposit' | 'transfer' | 'stokvel_contribution';
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  description: string;
  created_at: string;
  completed_at?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  pages: number;
  current_page: number;
}

export interface Card {
  id: number;
  card_number: string; // Masked, e.g., "**** **** **** 1234"
  card_holder: string;
  expiry_date: string;
  card_type: string;
  is_default: boolean;
}

export interface AddCardPayload {
  card_number: string;
  card_holder: string;
  expiry_date: string; // "MM/YY"
  cvv: string;
}

export interface DepositPayload {
    amount: number;
    card_id: number;
}

export interface TransferPayload {
    amount: number;
    recipient_account_number: string;
    description: string;
}


// --- API Service Functions ---

export const getWalletBalance = async (): Promise<{ balance: number, currency: string }> => {
    const { data } = await api.get('/api/wallet/balance');
  return data;
};

export const getTransactions = async (page: number = 1, perPage: number = 10): Promise<{
    transactions: Transaction[],
    pages: number,
    current_page: number,
    total: number
}> => {
    const { data } = await api.get(`/api/wallet/transactions?page=${page}&per_page=${perPage}`);
  return data;
};

export const getCards = async (): Promise<Card[]> => {
  const response = await api.get('/api/wallet/cards');
  return response.data;
};

export const addCard = async (cardData: any) => {
  const payload = {
    cardholder: cardData.cardholder,
    cardNumber: cardData.cardNumber, // Must match this key exactly
    expiry: cardData.expiry,
    cvv: cardData.cvv,
    primary: cardData.primary ?? false
  };

  console.log("[payload]", payload); // Debug log
  const response = await api.post('/api/wallet/cards', payload);
  return response.data;
};



export const deleteCard = async (cardId: number): Promise<{ message: string }> => {
  const { data } = await api.delete(`/api/wallet/cards/${cardId}`);
  return data;
};

export const makeDeposit = async (depositData: DepositPayload): Promise<{ message: string, new_balance: number }> => {
    const { data } = await api.post('/api/wallet/deposit', depositData);
    return data;
};

export const makeTransfer = async (transferData: TransferPayload): Promise<{ message: string, new_balance: number }> => {
    const { data } = await api.post('/api/wallet/transfer', transferData);
    return data;
};

export const updateCard = async (cardData: any) => {
  // Adjust the endpoint and payload as per your backend API
  const response = await api.put(`/api/wallet/cards/${cardData.id}`, cardData);
  return response.data;
};

export const withdraw = async (amount: number, bankAccount: string, note: string) => {
  const { data } = await api.post('/api/wallet/withdraw', {
    amount,
    bank_account_number: bankAccount,
    description: note,
  });
  return data;
}; 