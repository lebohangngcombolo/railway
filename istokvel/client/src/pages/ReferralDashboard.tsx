import React, { useEffect, useState } from 'react';
import { referralAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { Gift, Copy, Share2, Users, Star } from 'lucide-react';

interface Reward {
  key: string;
  description: string;
  points: number;
  image?: string;
}

const rewardImages: Record<string, string> = {
  airtime_10: 'https://cdn-icons-png.flaticon.com/512/724/724664.png',
  voucher_50: 'https://img.icons8.com/ios-filled/100/4682B4/shopping-basket-2.png',
  credit_100: 'https://img.icons8.com/ios-filled/100/4169E1/wallet-app.png',
  // Add more as needed
};

const ReferralDashboard = () => {
  const [details, setDetails] = useState<any>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  useEffect(() => {
    referralAPI.getReferralDetails()
      .then(res => setDetails(res.data))
      .catch(() => toast.error('Failed to load referral details'));

    referralAPI.getRewardsCatalog()
      .then(res => {
        const catalog = res.data;
        setRewards(Object.entries(catalog).map(([key, value]: [string, any]) => ({
          key,
          ...value,
          image: rewardImages[key] || '/rewards/default.png'
        })));
      })
      .catch(() => toast.error('Failed to load rewards'));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(details.referral_link);
    toast.success('Referral link copied!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ url: details.referral_link });
    } else {
      handleCopy();
    }
  };

  if (!details) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      {/* Referral Card */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-2">Referral</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={details.referral_link}
            readOnly
            className="flex-1 bg-gray-100 rounded px-3 py-2 text-gray-700 font-mono"
          />
          <button
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
            onClick={handleCopy}
          >
            Copy
          </button>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div>
            <div className="text-xs text-gray-500">Referral Code</div>
            <div className="font-bold text-lg">{details.referral_code}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Valid Referrals</div>
            <div className="font-bold text-lg">{details.valid_referrals ?? 0}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Points</div>
            <div className="font-bold text-lg">{details.points ?? 0}</div>
          </div>
          <button
            className="text-blue-600 font-semibold hover:underline"
            onClick={handleShare}
          >
            Share Referral
          </button>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Rewards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rewards.map(reward => (
            <div key={reward.key} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
              <img src={reward.image} alt={reward.description} className="w-16 h-16 object-contain rounded" />
              <div className="flex-1">
                <div className="font-semibold text-lg">{reward.description}</div>
                <div className="text-gray-500 text-sm">{reward.points} points</div>
              </div>
              <button
                className={`px-4 py-2 rounded font-semibold transition ${
                  (details.points ?? 0) >= reward.points
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={(details.points ?? 0) < reward.points}
                onClick={() => setSelectedReward(reward)}
              >
                Redeem
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Redeem Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setSelectedReward(null)}
            >
              &times;
            </button>
            <div className="flex flex-col items-center">
              <img src={selectedReward.image} alt={selectedReward.description} className="w-20 h-20 object-contain mb-4" />
              <h2 className="text-xl font-bold mb-2">{selectedReward.description}</h2>
              <div className="text-blue-600 font-semibold mb-4">{selectedReward.points} Points</div>
              <button
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium mt-2"
                onClick={async () => {
                  try {
                    await referralAPI.redeemReward(selectedReward.key);
                    toast.success('Reward redeemed successfully!');
                    setSelectedReward(null);
                    // Update points in UI
                    setDetails((prev: any) => ({
                      ...prev,
                      points: (prev.points ?? 0) - selectedReward.points
                    }));
                  } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Redemption failed');
                  }
                }}
              >
                Confirm Redemption
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralDashboard;
