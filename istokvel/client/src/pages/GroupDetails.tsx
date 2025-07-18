// my-flask-app-vite/src/pages/GroupDetails.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, CreditCard, Wallet, Loader2, CheckCircle } from "lucide-react";
import api from "../services/api";
import { getWalletBalance, getCards } from "../services/walletService";

const GroupDetails: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contributionAmount, setContributionAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "bank">("wallet");
  const [contributing, setContributing] = useState(false);
  const [contributionStatus, setContributionStatus] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(false);

  // Fetch group info and members
  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const groupRes = await api.get(`/api/admin/groups/${groupId}`);
        setGroup(groupRes.data);

        // Fetch members
        const membersRes = await api.get(`/api/admin/groups/${groupId}/members`);
        setMembers(membersRes.data);

        setContributionAmount(groupRes.data.contribution_amount || 0);
      } catch (err) {
        // Handle error, e.g., group not found
        navigate("/dashboard/stokvel-groups");
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId, navigate]);

  // Fetch wallet balance and cards on mount
  useEffect(() => {
    if (paymentMethod === "wallet") {
      getWalletBalance().then((data) => setWalletBalance(data.balance));
    }
    if (paymentMethod === "bank") {
      getCards().then((data) => setCards(data));
    }
  }, [paymentMethod]);

  // Handle contribution
  const handleContinue = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmContribution = async () => {
    setShowConfirmModal(false);
    setPendingPayment(true);
    setContributionStatus(null);
    try {
      const payload: any = {
        amount: contributionAmount,
        method: paymentMethod,
      };
      if (paymentMethod === "bank") {
        payload.card_id = selectedCardId;
      }
      await api.post(`/api/groups/${groupId}/contribute`, payload);
      setContributionStatus("Contribution successful!");
      setShowSuccessModal(true);
      // Optionally, trigger dashboard/transactions refresh here
    } catch (err: any) {
      setContributionStatus(err.response?.data?.error || "Contribution failed.");
    } finally {
      setPendingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (!group) {
    return <div className="text-center mt-10 text-red-500">Group not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 mb-6 space-x-2">
        <span
          className="hover:underline text-blue-600 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </span>
        <span>/</span>
        <span
          className="hover:underline text-blue-600 cursor-pointer"
          onClick={() => navigate('/dashboard/my-groups')}
        >
          My Groups
        </span>
        <span>/</span>
        <span className="text-gray-700 font-semibold">{group?.name || "Group"}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
        <div className="text-gray-600 mb-1">
          Category: <span className="font-semibold">{group.category}</span>
        </div>
        <div className="text-gray-600 mb-1">
          Tier: <span className="font-semibold">{group.tier}</span>
        </div>
        <div className="text-gray-600 mb-1">
          Monthly Contribution: <span className="font-semibold">R{group.contribution_amount}</span>
        </div>
        <div className="text-gray-600 mb-1">
          Interest Rate: <span className="font-semibold">{group.interest_rate || "N/A"}</span>
        </div>
        <div className="text-gray-600 mb-1">
          Members: <span className="font-semibold">{members.length}</span>
        </div>
        <div className="text-gray-500 mt-2">{group.description}</div>
      </div>

      {/* Contribution Section */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> Contribute to this Group
        </h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Amount</label>
          <input
            type="number"
            className="border rounded px-3 py-2 w-40"
            value={contributionAmount ?? ""}
            min={group.contribution_amount}
            onChange={e => setContributionAmount(Number(e.target.value))}
            disabled={pendingPayment}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Payment Method</label>
          <div className="flex gap-4">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded border ${paymentMethod === "wallet" ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-gray-300"}`}
              onClick={() => setPaymentMethod("wallet")}
              disabled={pendingPayment}
            >
              <Wallet className="w-4 h-4" /> Wallet
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded border ${paymentMethod === "bank" ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-gray-300"}`}
              onClick={() => setPaymentMethod("bank")}
              disabled={pendingPayment}
            >
              <CreditCard className="w-4 h-4" /> Bank/Card
            </button>
          </div>
        </div>

        {/* Wallet balance and warning */}
        {paymentMethod === "wallet" && (
          <div className="mb-4">
            <div className="text-sm text-gray-600">
              Wallet Balance: <span className="font-bold text-blue-700">R{walletBalance.toFixed(2)}</span>
            </div>
            {contributionAmount && walletBalance < contributionAmount && (
              <div className="text-red-600 text-xs mt-1">Insufficient wallet balance.</div>
            )}
          </div>
        )}

        {/* Card picker */}
        {paymentMethod === "bank" && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Select Card</label>
            {cards.length === 0 ? (
              <div className="text-sm text-gray-500">No cards found. Please add a card in your Digital Wallet.</div>
            ) : (
              <select
                className="border rounded px-3 py-2 w-60"
                value={selectedCardId ?? ""}
                onChange={e => setSelectedCardId(Number(e.target.value))}
                disabled={pendingPayment}
              >
                <option value="">-- Select Card --</option>
                {cards.map(card => (
                  <option key={card.id} value={card.id}>
                    {card.card_type.toUpperCase()} ****{card.card_number_last4 || card.card_number?.slice(-4)} (Exp: {card.expiry || card.expiry_date})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <button
          className="bg-green-600 text-white px-6 py-2 rounded font-bold mt-2 disabled:opacity-50"
          onClick={handleContinue}
          disabled={
            pendingPayment ||
            !contributionAmount ||
            (paymentMethod === "wallet" && walletBalance < contributionAmount) ||
            (paymentMethod === "bank" && !selectedCardId)
          }
        >
          Continue
        </button>
        {contributionStatus && (
          <div className="mt-3 text-sm text-center text-green-600">{contributionStatus}</div>
        )}
      </div>

      {/* --- Confirmation Modal --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Contribution</h3>
            <div className="mb-2">Group: <span className="font-semibold">{group.name}</span></div>
            <div className="mb-2">Amount: <span className="font-semibold">R{contributionAmount}</span></div>
            <div className="mb-2">Payment Method: <span className="font-semibold capitalize">{paymentMethod}</span></div>
            {paymentMethod === "bank" && selectedCardId && (
              <div className="mb-2">
                Card: <span className="font-semibold">
                  {cards.find(c => c.id === selectedCardId)?.card_type.toUpperCase()} ****
                  {cards.find(c => c.id === selectedCardId)?.card_number_last4}
                </span>
              </div>
            )}
            <div className="flex gap-4 mt-6">
              <button
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-bold"
                onClick={handleConfirmContribution}
                disabled={pendingPayment}
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Success Modal --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
            <h3 className="text-lg font-bold mb-2">Contribution Successful!</h3>
            <div className="mb-2">You contributed <span className="font-semibold">R{contributionAmount}</span> to <span className="font-semibold">{group.name}</span>.</div>
            <button
              className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded font-bold"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/dashboard");
                // Optionally, trigger a dashboard refresh here
              }}
            >
              Go to Dashboard
            </button>
            <button
              className="mt-2 text-blue-600 hover:underline"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Group Members ({members.length})
        </h2>
        <ul className="space-y-2">
          {members.map((member: any) => (
            <li key={member.id} className="flex items-center gap-2">
              <span className="font-medium">{member.full_name || member.name || "Member"}</span>
              <span className="text-xs text-gray-400">{member.email}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GroupDetails;