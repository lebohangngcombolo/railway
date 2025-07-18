import React, { useEffect, useState } from "react";
import {
  getWalletBalance,
  getTransactions,
  getCards,
  addCard,
  deleteCard,
  makeDeposit,
  makeTransfer,
  Card,
  Transaction,
  updateCard,
  withdraw,
} from "../services/walletService";
import { toast } from "react-toastify";
import { Plus, CreditCard, Send, Trash2, Loader2, Clipboard, Check } from "lucide-react";
import AddCardModal from "../components/AddCardModal";
import DepositModal from "../components/DepositModal";
import TransferModal from "../components/TransferModal";
import WithdrawModal from "../components/WithdrawModal";
import api from "../services/api"; // or wherever your axios instance is

const Spinner = ({ className = "h-5 w-5" }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Add this mapping for card icons (update paths as needed)
const cardTypeIcons: Record<string, string> = {
  visa: "/icons/visa.svg",
  mastercard: "/icons/mastercard.svg",
  amex: "/icons/amex.svg",
  unknown: "/icons/unknown.svg",
};

const maskCardNumber = (num: string) => {
  if (!num) return "•••• •••• •••• ••••";
  const cleaned = num.replace(/\s/g, '');
  const last4 = cleaned.slice(-4);
  const masked = "•••• •••• •••• " + last4;
  return masked;
};

const DigitalWallet: React.FC = () => {
  // State
  const [balance, setBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("ZAR");
  const [loading, setLoading] = useState(true);

  // Cards
  const [cards, setCards] = useState<Card[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Modals
  const [showDeposit, setShowDeposit] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCard, setDepositCard] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  // Transfer form
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [transferDesc, setTransferDesc] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  // Card form
  const [cardForm, setCardForm] = useState({
    card_number: "",
    card_holder: "",
    expiry_date: "",
    cvv: "",
    card_type: "visa",
  });
  const [addCardLoading, setAddCardLoading] = useState(false);

  // Summary
  const [summary, setSummary] = useState({ totalDeposits: 0, totalTransfers: 0, totalWithdrawals: 0 });

  // Transfer modal
  const [open, setOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0.0);

  // Additional state for editing
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // Additional state for deleting
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Additional state for transaction filters
  const [transactionFilters, setTransactionFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: '30'
  });

  // AddBeneficiaryModal state
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState("");
  const [copied, setCopied] = useState(false);

  // New state for Withdraw modal
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Fetch wallet balance
  useEffect(() => {
    setLoading(true);
    getWalletBalance()
      .then((data) => {
        console.log('Wallet balance response:', data);
        console.log('Balance type:', typeof data.balance);
        console.log('Balance value:', data.balance);
        
        // Ensure balance is a number
        const balanceValue = typeof data.balance === 'number' ? data.balance : parseFloat(data.balance) || 0;
        console.log('Processed balance:', balanceValue);
        
        setBalance(balanceValue);
        setCurrency(data.currency || 'ZAR');
        setWalletBalance(balanceValue);
      })
      .catch((error) => {
        console.error('Error fetching balance:', error);
        toast.error("Failed to load balance");
        setBalance(0);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch cards
  const fetchCards = async () => {
    setCardsLoading(true);
    try {
      const res = await getCards();
      console.log("Backend cards:", res);
      const mapped = res.map((c: any) => ({
        id: c.id,
        card_number: c.card_number,
        card_holder: c.cardholder,
        expiry_date: c.expiry,
        card_type: c.card_type,
        is_default: c.is_primary,
      }));
      console.log("Mapped cards:", mapped);
      setCards(mapped);
    } catch (err) {
      // handle error
    } finally {
      setCardsLoading(false);
    }
  };

  // Fetch transactions
  useEffect(() => {
    setTxLoading(true);
    getTransactions(page, 10)
      .then((data) => {
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        setPages(data.pages || 1);
      })
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setTxLoading(false));
  }, [page]);

  // Calculate summary
  useEffect(() => {
    const deposits = transactions.filter(tx => tx.transaction_type === "deposit" && tx.status === "completed")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const transfers = transactions.filter(tx => tx.transaction_type === "transfer" && tx.status === "completed")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const withdrawals = transactions.filter(tx => tx.transaction_type === "withdrawal" && tx.status === "completed")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    setSummary({ 
      totalDeposits: deposits, 
      totalTransfers: transfers,
      totalWithdrawals: withdrawals 
    });
  }, [transactions]);

  // Fetch account number
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/api/user/profile');
        console.log('Profile data:', data);
        console.log('Account number:', data.account_number);
        
        if (data.account_number) {
          setAccountNumber(data.account_number);
        } else {
          console.warn('No account number received from server');
          setAccountNumber('Generating...');
          // Retry after a short delay
          setTimeout(() => fetchProfile(), 1000);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setAccountNumber('Error loading');
      }
    };
    fetchProfile();
  }, []);

  // Deposit handler
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    try {
      const res = await makeDeposit({
        amount: Number(depositAmount),
        card_id: Number(depositCard),
      });
      toast.success(res.message || "Deposit successful!");
      setBalance(res.new_balance);
      setShowDeposit(false);
      setDepositAmount("");
      setDepositCard("");
      setPage(1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Deposit failed");
    } finally {
      setDepositLoading(false);
    }
  };

  // Transfer handler
  const handleTransfer = async ({ amount, recipient_account_number, note }) => {
    try {
      console.log("🚀 Starting transfer with data:", { amount, recipient_account_number, note }); // Debug log
      
      const res = await makeTransfer({
        amount,
        recipient_account_number,
        description: note,
      });
      
      console.log("✅ Transfer response:", res); // Debug log
      
      toast.success(res.message || "Transfer successful!");
      
      // Refresh balance and transactions
      const balanceData = await getWalletBalance();
      setBalance(balanceData.balance);
      setWalletBalance(balanceData.balance);
      setPage(1);
    } catch (error: any) {
      console.error("❌ Transfer error:", error); // Debug log
      console.error("❌ Error response:", error.response?.data); // Debug log
      toast.error(error.response?.data?.error || "Transfer failed");
      throw error;
    }
  };

  // Withdraw handler
  const handleWithdraw = async ({ amount, bank_account_number, note }) => {
    try {
      const res = await withdraw(amount, bank_account_number, note);
      toast.success(res.message || "Withdrawal successful!");
      
      // Refresh balance and transactions
      const balanceData = await getWalletBalance();
      setBalance(balanceData.balance);
      setWalletBalance(balanceData.balance);
      setPage(1);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Withdrawal failed");
      throw error;
    }
  };

  // Add card handler
  const handleAddCard = async (cardData: any) => {
    setAddCardLoading(true);
    try {
      await addCard(cardData);
      toast.success("Card added!");
      setShowAddCard(false);
      await fetchCards();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add card");
    } finally {
      setAddCardLoading(false);
    }
  };

  // Delete card handler
  const handleDeleteCard = async (id: number) => {
    try {
      await deleteCard(id);
      toast.success("Card deleted");
      await fetchCards();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete card");
    }
  };

  // Set default card (requires backend/service implementation)
  const handleSetDefaultCard = async (id: number) => {
    // await setDefaultCard(id);
    // toast.success("Default card set!");
    // setCards(cards.map(card => ({ ...card, is_default: card.id === id })));
    toast.info("Set default card functionality not yet implemented.");
  };

  // Find default card for deposit modal
  const defaultCardId = cards.find(card => card.is_default)?.id?.toString() || "";

  // Additional handler for editing
  const handleEditCard = (card: Card) => setEditingCard(card);

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // UI
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-background py-10 px-4 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Wallet Overview */}
        <div className="backdrop-blur-md bg-white/70 border border-blue-100 rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row items-center justify-between transition-all">
          <div>
            <div className="text-gray-500 text-sm">Wallet Balance</div>
            <div className="text-4xl font-extrabold text-blue-700 tracking-tight">
              {loading ? <Spinner /> : `ZAR ${(Number(balance) || 0).toFixed(2)}`}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              <span>Total Deposits: ZAR {summary.totalDeposits.toFixed(2)}</span> |{" "}
              <span>Total Transfers: ZAR {summary.totalTransfers.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Wallet Account Number:</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {accountNumber || 'Loading...'}
              </span>
              {accountNumber && 
               accountNumber !== 'Loading...' && 
               accountNumber !== 'Error loading' && 
               accountNumber !== 'Generating...' && (
                <>
                  <button
                    className="ml-1 p-1 rounded hover:bg-blue-100 transition"
                    onClick={handleCopy}
                    title="Copy account number"
                    type="button"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4 text-blue-600" />}
                  </button>
                  {copied && <span className="text-xs text-green-600 ml-1">Copied!</span>}
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              className="btn-primary flex items-center gap-2 shadow hover:scale-105 transition"
              onClick={() => setShowDeposit(true)}
            >
              <Plus className="w-4 h-4" /> Deposit
            </button>
            <button
              className="btn-secondary flex items-center gap-2 shadow hover:scale-105 transition"
              onClick={() => setShowTransfer(true)}
            >
              <Send className="w-4 h-4" /> Transfer
            </button>
            <button
              className="btn-secondary flex items-center gap-2 shadow hover:scale-105 transition"
              onClick={() => setShowWithdraw(true)}
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Cards Section */}
        <div className="backdrop-blur-md bg-white/70 border border-indigo-100 rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-4">
            <div className="font-semibold text-lg">
              My Cards <span className="text-xs text-gray-400">({cards.length})</span>
            </div>
            <button
              className="btn-outline flex items-center gap-2 hover:bg-indigo-50 transition"
              onClick={() => setShowAddCard(true)}
            >
              <CreditCard className="w-4 h-4" /> Add Card
            </button>
          </div>
          {cardsLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <CreditCard className="w-10 h-10 mb-2" />
              <span>No cards added yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cards.map(card => (
                <div
                  key={card.id}
                  className="relative w-full max-w-sm mx-auto rounded-2xl shadow-2xl overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-3xl"
                  style={{
                    background: card.card_type === 'visa' 
                      ? "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)"
                      : card.card_type === 'mastercard'
                      ? "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)"
                      : card.card_type === 'amex'
                      ? "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)"
                      : "linear-gradient(135deg, #23295A 60%, #3B4CCA 100%)",
                    minHeight: 220, // Increased height for more realistic proportions
                    aspectRatio: "1.586", // Standard credit card ratio (85.6mm x 53.98mm)
                    border: "2px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {/* Card Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    {/* Top Section */}
                    <div className="flex justify-between items-start">
                      <div className="text-white/90 text-sm font-medium">
                        {card.card_type
                          ? card.card_type.toLowerCase() === "visa"
                            ? "Visa"
                            : card.card_type.toLowerCase() === "mastercard"
                              ? "Mastercard"
                              : card.card_type.toUpperCase()
                          : "Card"}
                      </div>
                      {card.is_default && (
                        <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white font-medium">
                          DEFAULT
                        </div>
                      )}
                    </div>

                    {/* Middle Section - Card Number */}
                    <div className="text-center">
                      <div className="text-white/80 text-xs mb-2">Card Number</div>
                      <div className="text-white text-xl font-mono tracking-wider font-bold">
                        {maskCardNumber(card.card_number)}
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-white/60 text-xs mb-1">Cardholder</div>
                        <div className="text-white font-semibold text-sm">
                          {card.card_holder}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/60 text-xs mb-1">Expires</div>
                        <div className="text-white font-semibold text-sm">
                          {card.expiry_date}
                        </div>
                      </div>
                    </div>

                    {/* Card Chip */}
                    <div className="absolute top-1/2 left-6 transform -translate-y-1/2">
                      <div className="w-8 h-6 bg-yellow-400/80 rounded-sm"></div>
                    </div>

                    {/* Card Logo */}
                    <div className="absolute top-6 right-6">
                      {card.card_type === 'visa' && (
                        <div className="text-white font-bold text-lg">VISA</div>
                      )}
                      {card.card_type === 'mastercard' && (
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-red-500 rounded-full -mr-2"></div>
                          <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
                        </div>
                      )}
                      {card.card_type === 'amex' && (
                        <div className="text-white font-bold text-lg">AMEX</div>
                      )}
                    </div>

                    {/* Hover Overlay with Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCard(card)}
                          className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
                          title="Edit card"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCardToDelete(card)}
                          className="bg-red-500/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-500 transition-colors"
                          title="Delete card"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        {!card.is_default && (
                          <button
                            onClick={() => handleSetDefaultCard(card.id)}
                            className="bg-blue-500/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-blue-500 transition-colors"
                            title="Set as default"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="backdrop-blur-md bg-white/70 border border-pink-100 rounded-2xl shadow-xl p-8">
          <div className="font-semibold text-lg mb-4">Recent Transactions</div>
          {txLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <Loader2 className="w-10 h-10 mb-2 animate-spin" />
              <span>No transactions yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="px-2 py-1">Type</th>
                    <th className="px-2 py-1">Amount</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Reference</th>
                    <th className="px-2 py-1">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-blue-50/40 transition">
                      <td className="px-2 py-1">{tx.transaction_type}</td>
                      <td className={`px-2 py-1 font-mono ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </td>
                      <td className="px-2 py-1">{tx.status}</td>
                      <td className="px-2 py-1">{tx.reference}</td>
                      <td className="px-2 py-1">{new Date(tx.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              <div className="flex justify-end mt-2 gap-2">
                <button
                  className="btn-outline"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >Prev</button>
                <span className="text-gray-500">{page} / {pages}</span>
                <button
                  className="btn-outline"
                  disabled={page >= pages}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                >Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddCardModal
        open={showAddCard}
        onClose={() => setShowAddCard(false)}
        onSave={async (form) => {
          // Map form fields to backend expected names
          const payload = {
            cardholder: form.cardholder,
            cardNumber: form.cardNumber,
            expiry: form.expiry,
            cvv: form.cvv,
            primary: form.primary,
          };
          console.log("Submitting card data:", payload);
          await addCard(payload);
          toast.success("Card added!");
          setShowAddCard(false);
          await fetchCards();
        }}
      />

      <DepositModal
        open={showDeposit}
        onClose={() => setShowDeposit(false)}
        cards={cards.map(card => ({
          id: String(card.id),
          label: `${card.card_type?.toUpperCase() || "Card"} •••• ${card.card_number?.slice(-4)}`,
        }))}
        onDeposit={async (amount, method, note) => {
          try {
            const res = await makeDeposit({ 
              amount, 
              card_id: Number(method),
              description: note 
            });
            toast.success(res.message || "Deposit successful!");
            setShowDeposit(false);
            // Refresh balance and transactions
            const balanceData = await getWalletBalance();
            setBalance(balanceData.balance);
            setWalletBalance(balanceData.balance);
            // Refresh transactions
            setPage(1);
          } catch (error: any) {
            toast.error(error.response?.data?.error || "Deposit failed");
            throw error; // Re-throw so the modal can handle the loading state
          }
        }}
      />

      {/* Transfer Modal */}
      <TransferModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        onTransfer={handleTransfer}
        walletBalance={walletBalance}
      />

      {editingCard && (
        <AddCardModal
          open={!!editingCard}
          onClose={() => setEditingCard(null)}
          initialCard={{
            cardholder: editingCard.card_holder,
            cardNumber: editingCard.card_number,
            expiry: editingCard.expiry_date,
            cvv: "", // Don't prefill CVV for security
            primary: editingCard.is_default,
          }}
          onSave={async (form) => {
            const payload = {
              cardholder: form.cardholder,
              cardNumber: form.cardNumber,
              expiry: form.expiry,
              cvv: form.cvv,
              primary: form.primary,
            };
            await updateCard({ ...payload, id: editingCard.id });
            toast.success("Card updated!");
            setEditingCard(null);
            await fetchCards();
          }}
        />
      )}

      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
              <h2 className="text-xl font-bold mb-2 text-red-600">Delete Card?</h2>
              <p className="text-gray-600 mb-4 text-center">
                Are you sure you want to delete this card ending in <b>{cardToDelete.card_number.slice(-4)}</b>?<br />
                This action cannot be undone.
              </p>
              <div className="flex gap-2 w-full">
                <button
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
                  onClick={() => setCardToDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold"
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await handleDeleteCard(cardToDelete.id);
                      setCardToDelete(null);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <WithdrawModal
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        onWithdraw={handleWithdraw}
        walletBalance={walletBalance}
      />
    </div>
  );
};

export default DigitalWallet;