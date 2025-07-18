import React, { useState } from "react";
import { X, Info } from "lucide-react";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onWithdraw: (payload: { amount: number; bank_account_number: string; note: string }) => void;
  walletBalance: number;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  open,
  onClose,
  onWithdraw,
  walletBalance,
}) => {
  const [amount, setAmount] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const WITHDRAWAL_FEE_PERCENTAGE = 0.02; // 2%
  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount * WITHDRAWAL_FEE_PERCENTAGE;
  const totalDeduction = parsedAmount + fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !bankAccountNumber) {
      alert("Please fill in all required fields");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      alert("Minimum withdrawal amount is R10.00");
      return;
    }

    if (numAmount > 50000) {
      alert("Maximum withdrawal amount is R50,000.00");
      return;
    }

    if (totalDeduction > walletBalance) {
      alert(`Insufficient balance. You need R${totalDeduction.toFixed(2)} (R${numAmount.toFixed(2)} + R${fee.toFixed(2)} fee)`);
      return;
    }

    if (bankAccountNumber.length !== 10) {
      alert("Bank account number must be exactly 10 digits");
      return;
    }

    setLoading(true);
    try {
      await onWithdraw({
        amount: numAmount,
        bank_account_number: bankAccountNumber,
        note: note,
      });
      
      // Reset form
      setAmount("");
      setBankAccountNumber("");
      setNote("");
      onClose();
    } catch (error) {
      console.error("Withdrawal failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Withdraw Money</h2>
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
              min="10"
              max="50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: ZAR {(walletBalance || 0).toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Account Number
            </label>
            <input
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="1234567890"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 10-digit bank account number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this withdrawal for?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fee Information */}
          {amount && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Fee Breakdown</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>Withdrawal Amount:</span>
                  <span>R{parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee (2%):</span>
                  <span>R{fee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-medium">
                  <span>Total Deduction:</span>
                  <span>R{totalDeduction.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

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
              {loading ? "Processing..." : "Withdraw"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawModal;