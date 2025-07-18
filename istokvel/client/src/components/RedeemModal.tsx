import React, { useState } from 'react';
import { referralAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface RedeemModalProps {
  open: boolean;
  reward: { key: string; description: string; points: number; image?: string };
  onClose: () => void;
  onRedeemSuccess: () => void;
}

const RedeemModal: React.FC<RedeemModalProps> = ({ open, reward, onClose, onRedeemSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    setLoading(true);
    try {
      await referralAPI.redeemReward(reward.key);
      toast.success('Reward redeemed successfully!');
      onRedeemSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Redemption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative"
            initial={{ scale: 0.9, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 40 }}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={onClose}
              disabled={loading}
            >
              &times;
            </button>
            <div className="flex flex-col items-center">
              <img src={reward.image} alt={reward.description} className="w-20 h-20 object-contain mb-4" />
              <h2 className="text-xl font-bold mb-2">{reward.description}</h2>
              <div className="text-blue-600 font-semibold mb-4">{reward.points} Points</div>
              <button
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium mt-2"
                onClick={handleRedeem}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Redemption'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RedeemModal;
