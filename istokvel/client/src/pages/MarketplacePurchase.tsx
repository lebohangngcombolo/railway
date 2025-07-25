import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { CreditCard, Percent, Zap, Wifi, Smartphone } from "lucide-react";
import api from "../services/api"; // Make sure this points to your axios instance

const ITEM_TYPES = [
  { key: "airtime", label: "Airtime", icon: <Smartphone /> },
  { key: "data", label: "Data", icon: <Wifi /> },
  { key: "electricity", label: "Electricity", icon: <Zap /> },
  { key: "voucher", label: "Vouchers", icon: <Percent /> },
];

const PROVIDERS = {
  airtime: ["MTN", "Vodacom", "Cell C", "Telkom"],
  data: ["MTN", "Vodacom", "Cell C", "Telkom"],
  electricity: ["Eskom", "City Power"],
  voucher: ["Netflix", "Google Play", "Takealot"],
};

const MarketplacePurchase: React.FC = () => {
  const [itemType, setItemType] = useState("airtime");
  const [provider, setProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(""); // Added for card selection

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/market/transactions");
      setTransactions(res.data);
    } catch (err) {
      toast.error("Failed to load transactions");
    }
  };

  useEffect(() => {
    setProvider("");
  }, [itemType]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !amount || Number(amount) <= 0) {
      toast.error("Please fill all fields with valid values.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/market/purchase", {
        item_type: itemType,
        provider,
        amount,
        payment_method: paymentMethod,
        card_id: paymentMethod === "card" ? selectedCardId : undefined, // if you have card selection
      });
      toast.success(res.data.message || "Purchase successful!");
      fetchTransactions();
      setAmount("");
      setProvider("");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="bg-white rounded-xl shadow p-8 mb-10">
        <h2 className="text-2xl font-bold mb-6">Marketplace</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          {ITEM_TYPES.map((type) => (
            <button
              key={type.key}
              className={`flex flex-col items-center justify-center py-8 rounded-2xl border-2 transition min-h-[120px] min-w-[120px] shadow-sm
                ${itemType === type.key
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-300"
                }`}
              onClick={() => setItemType(type.key)}
              type="button"
            >
              <span className="mb-2">{React.cloneElement(type.icon, { className: "w-10 h-10" })}</span>
              <span className="text-base font-bold">{type.label}</span>
            </button>
          ))}
        </div>
        <form onSubmit={handlePurchase} className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                required
              >
                <option value="">Select</option>
                {PROVIDERS[itemType as keyof typeof PROVIDERS].map((prov: string) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Amount (R)</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <div className="flex space-x-6 mt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="wallet"
                  checked={paymentMethod === "wallet"}
                  onChange={() => setPaymentMethod("wallet")}
                />
                <span className="flex items-center">Wallet</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <span className="flex items-center"><CreditCard className="w-4 h-4 mr-1" />Card</span>
              </label>
            </div>
            {paymentMethod === "card" && (
              <select
                value={selectedCardId}
                onChange={e => setSelectedCardId(e.target.value)}
                required
              >
                <option value="">Select Card</option>
                {/* Assuming 'cards' state holds the list of user's cards */}
                {/* This part would typically be fetched from an API or state */}
                {/* For now, a placeholder */}
                <option value="1234567890123456">**** **** **** 1234</option>
                <option value="9876543210987654">**** **** **** 9876</option>
              </select>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold mt-4"
            disabled={loading}
          >
            {loading ? "Processing..." : "Buy Now"}
          </button>
        </form>
      </div>
      <div className="bg-white rounded-xl shadow p-8">
        <h3 className="text-xl font-bold mb-4">My Transactions</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-left">Provider</th>
              <th className="py-2 text-left">Amount</th>
              <th className="py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400">No transactions yet.</td>
              </tr>
            )}
            {transactions.map((txn) => (
              <tr key={txn.reference} className="border-b last:border-0">
                <td className="py-2">{txn.item_type.charAt(0).toUpperCase() + txn.item_type.slice(1)}</td>
                <td className="py-2">{txn.provider}</td>
                <td className="py-2">R{txn.amount.toFixed(2)}</td>
                <td className="py-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    txn.status === "successful"
                      ? "bg-green-100 text-green-700"
                      : txn.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketplacePurchase;
