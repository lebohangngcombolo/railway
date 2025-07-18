import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  cards: { id: string; label: string }[];
  onDeposit: (amount: number, method: string, note: string) => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ open, onClose, cards, onDeposit }) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(cards[0]?.id || "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum > 0 ? Math.max(2, amountNum * 0.015) : 0;
  const total = amountNum + fee;

  const isValid = amountNum > 0 && method;

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Depositing:", amountNum, method, note);
      await onDeposit(amountNum, method, note);
      // Success handled in parent
    } catch (err) {
      toast.error("Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-2 p-6 relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={onClose}>
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">Deposit Funds</h2>
        <form
          className="space-y-4"
          onSubmit={handleDeposit}
        >
          <div>
            <label className="block text-sm font-medium mb-1">Amount (ZAR)</label>
            <input
              type="number"
              className="input"
              min={1}
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select
              className="input"
              value={method}
              onChange={e => setMethod(e.target.value)}
              required
            >
              {cards.map(card => (
                <option key={card.id} value={card.id}>{card.label}</option>
              ))}
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reference Note <span className="text-gray-400">(optional)</span></label>
            <input
              type="text"
              className="input"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          {/* Deposit Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-2">
            <div className="flex justify-between mb-1">
              <span>Deposit Amount</span>
              <span>R {amountNum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Estimated Fees</span>
              <span>R {fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total Payable</span>
              <span>R {total.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading || !amount || !method}
            >
              {loading ? "Processing..." : "Confirm Deposit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
