import React, { useEffect, useState } from 'react';
import { referralAPI } from '../services/api';
import RedeemModal from '../components/RedeemModal';
import { toast } from 'react-hot-toast';

interface Reward {
  key: string;
  points: number;
  description: string;
  image?: string;
}

const rewardImages: Record<string, string> = {
  airtime_10: '/rewards/airtime.png',
  voucher_50: '/rewards/voucher.png',
  credit_100: '/rewards/credit.png',
};

const RewardsCatalog: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  useEffect(() => {
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

    // Fetch user points (assume endpoint or from profile)
    referralAPI.getReferralDetails()
      .then(res => setUserPoints(res.data.points || 0))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Rewards Catalog</h2>
      <div className="mb-4 text-right text-lg font-semibold text-emerald-700">
        Your Points: <span className="font-bold">{userPoints}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {rewards.map(reward => (
          <div key={reward.key} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <img src={reward.image} alt={reward.description} className="w-20 h-20 object-contain mb-4" />
            <div className="font-bold text-lg mb-2">{reward.description}</div>
            <div className="text-blue-600 font-semibold mb-4">{reward.points} Points</div>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition ${
                userPoints >= reward.points
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={userPoints < reward.points}
              onClick={() => setSelectedReward(reward)}
            >
              Redeem
            </button>
          </div>
        ))}
      </div>
      {selectedReward && (
        <RedeemModal
          open={!!selectedReward}
          reward={selectedReward}
          onClose={() => setSelectedReward(null)}
          onRedeemSuccess={() => {
            setUserPoints(p => p - (selectedReward?.points || 0));
            setSelectedReward(null);
          }}
        />
      )}
    </div>
  );
};

export default RewardsCatalog;
