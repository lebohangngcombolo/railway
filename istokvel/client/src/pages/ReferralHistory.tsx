import React from 'react';

const mockReferrals = [
  { name: 'Thabo M.', date: '2024-06-01', status: 'Completed', reward: '+30 pts' },
  { name: 'Lerato P.', date: '2024-06-10', status: 'Completed', reward: '+30 pts' },
  { name: 'Sipho K.', date: '2024-06-15', status: 'Pending', reward: '' },
];

const milestones = [
  { label: 'First Referral', achieved: true, date: '2024-06-01', bonus: '+20 pts' },
  { label: '3 Referrals', achieved: false, date: '', bonus: '+100 pts' },
];

const ReferralHistory: React.FC = () => (
  <div className="max-w-2xl mx-auto mt-8">
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Referral History</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="text-gray-500 text-sm">
            <th className="py-2">Name</th>
            <th className="py-2">Date</th>
            <th className="py-2">Status</th>
            <th className="py-2">Reward</th>
          </tr>
        </thead>
        <tbody>
          {mockReferrals.map((ref, i) => (
            <tr key={i} className="border-t">
              <td className="py-2">{ref.name}</td>
              <td className="py-2">{ref.date}</td>
              <td className="py-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${ref.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {ref.status}
                </span>
              </td>
              <td className="py-2">{ref.reward}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold mb-4">Milestones</h3>
      <ul className="space-y-2">
        {milestones.map((m, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${m.achieved ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
            <span className="font-medium">{m.label}</span>
            <span className="ml-auto text-sm text-gray-500">{m.achieved ? m.date : '—'}</span>
            <span className="ml-4 text-emerald-700 font-semibold">{m.bonus}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default ReferralHistory;
