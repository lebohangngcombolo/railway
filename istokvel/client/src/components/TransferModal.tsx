import React, { useState } from "react";
import { X } from "lucide-react";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onTransfer: (payload: { amount: number; recipient_account_number: string; note: string }) => void;
  walletBalance: number;
}

const TransferModal: React.FC<TransferModalProps> = ({
  open,
  onClose,
  onTransfer,
  walletBalance,
}) => {
  const [amount, setAmount] = useState("");
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !recipientAccountNumber) {
      alert("Please fill in all required fields");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (numAmount > walletBalance) {
      alert("Insufficient balance");
      return;
    }

    if (recipientAccountNumber.length !== 10) {
      alert("Account number must be exactly 10 digits");
      return;
    }

    setLoading(true);
    try {
      await onTransfer({
        amount: numAmount,
        recipient_account_number: recipientAccountNumber,
        note: note,
      });
      
      // Reset form
      setAmount("");
      setRecipientAccountNumber("");
      setNote("");
      onClose();
    } catch (error) {
      console.error("Transfer failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Transfer Money</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (ZAR)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              max={walletBalance}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: ZAR {walletBalance.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Account Number
            </label>
            <input
              type="text"
              value={recipientAccountNumber}
              onChange={(e) => setRecipientAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="1234567890"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 10-digit wallet account number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this transfer for?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Processing..." : "Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;