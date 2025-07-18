import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Gift, Users, ShieldCheck, TrendingUp, CheckCircle, ArrowLeft, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../hooks/useAuth";
// Import or copy your tierDetails, getAmountsInRange, getFeatures, getBenefits helpers here

// Example helpers (reuse from your main file or centralize them)
const tierDetails: Record<string, Record<string, {
  amountRange: string;
  interest: string;
  access: string;
  description: string;
  support: string;
}>> = {
  Savings: {
    Bronze: {
      amountRange: "R200–R450",
      interest: "2.5% p.a.",
      access: "Anytime",
      description: "Perfect for individuals or small groups starting their savings journey. Flexible deposits and easy withdrawals.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R500–R950",
      interest: "3.0% p.a.",
      access: "Anytime",
      description: "Ideal for growing groups looking for better returns and added flexibility.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R1000–R1950",
      interest: "3.5% p.a.",
      access: "Anytime",
      description: "For established groups seeking higher interest and exclusive benefits.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R2000–R5000",
      interest: "4.0% p.a.",
      access: "Anytime",
      description: "Top-tier for large groups with maximum benefits and personalized service.",
      support: "Dedicated manager"
    }
  },
  Burial: {
    Bronze: {
      amountRange: "R100–R400",
      interest: "N/A",
      access: "On claim",
      description: "Entry-level cover for individuals or families starting their burial plan.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R450–R900",
      interest: "N/A",
      access: "On claim",
      description: "Enhanced cover for families or small groups with added benefits.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R950–R1900",
      interest: "N/A",
      access: "On claim",
      description: "Comprehensive cover for larger groups with premium services.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R2000–R5000",
      interest: "N/A",
      access: "On claim",
      description: "Maximum cover and personalized support for large groups.",
      support: "Dedicated manager"
    }
  },
  Investment: {
    Bronze: {
      amountRange: "R500–R1000",
      interest: "5.0% p.a.",
      access: "Quarterly",
      description: "Start your investment journey with flexible options and steady growth.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R1100–R2500",
      interest: "6.0% p.a.",
      access: "Quarterly",
      description: "Better returns and more options for growing your investments.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R2600–R5000",
      interest: "7.0% p.a.",
      access: "Quarterly",
      description: "Premium investment options for serious savers and groups.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R5100–R10000",
      interest: "8.0% p.a.",
      access: "Quarterly",
      description: "Top-tier investment with maximum returns and exclusive benefits.",
      support: "Dedicated manager"
    }
  },
  Business: {
    Bronze: {
      amountRange: "R1000–R2500",
      interest: "3.0% p.a.",
      access: "Monthly",
      description: "Entry-level business savings for startups and small businesses.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R2600–R5000",
      interest: "3.5% p.a.",
      access: "Monthly",
      description: "Enhanced business savings with added flexibility and support.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R5100–R10000",
      interest: "4.0% p.a.",
      access: "Monthly",
      description: "Premium business savings for established businesses.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R10100–R20000",
      interest: "4.5% p.a.",
      access: "Monthly",
      description: "Top-tier business savings with maximum benefits and dedicated support.",
      support: "Dedicated manager"
    }
  }
};
function getAmountsInRange(range: string) {
  const match = range.match(/R(\d+)[–-]R?(\d+)?/);
  if (!match) return [];
  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  let amounts = [];
  for (let amt = min; amt <= max; amt += 50) {
    amounts.push(amt);
  }
  return amounts;
}
function getFeatures(amount: number, tier: string) {
  // ...same as before...
  return [
    { icon: <Users className="w-5 h-5 text-blue-500" />, label: "Group Savings" },
    { icon: <TrendingUp className="w-5 h-5 text-green-500" />, label: "Flexible Deposits" },
    { icon: <ShieldCheck className="w-5 h-5 text-yellow-500" />, label: "Safe & Secure" },
  ];
}
function getBenefits(amount: number, tier: string) {
  // ...same as before...
  return [
    { icon: <CheckCircle className="w-5 h-5 text-green-500" />, label: "Basic support" },
    { icon: <Gift className="w-5 h-5 text-pink-500" />, label: "Welcome bonus" },
  ];
}

const TierDetails: React.FC = () => {
  const { category, tier } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  function capitalize(str: string) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  function findKeyInsensitive(obj: Record<string, any>, key: string | undefined) {
    if (!key) return undefined;
    const lowerKey = key.toLowerCase();
    return Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
  }

  const categoryKey = findKeyInsensitive(tierDetails, category);
  if (!categoryKey) return <div>Category not found.</div>;

  const tierKey = findKeyInsensitive(tierDetails[categoryKey], tier);
  if (!tierKey) return <div>Tier not found.</div>;

  const details = tierDetails[categoryKey][tierKey];
  const amounts = getAmountsInRange(details.amountRange);
  const [selectedAmount, setSelectedAmount] = useState(amounts[0] || "");
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    fetch('/api/user/join-requests', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        const pending = data.some(req =>
          req.category === category &&
          req.tier === tier &&
          req.amount === selectedAmount &&
          req.status === "pending"
        );
        setIsPending(pending);
      });
  }, [category, tier, selectedAmount]);

  const handleJoin = (amount: number) => {
    fetch('/api/stokvel/join-group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        category,
        tier,
        amount,
      }),
    })
      .then(res => res.json())
      .then(() => {
        fetch('/api/user/join-requests', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
          .then(res => res.json())
          .then(data => {
            const pending = data.some(req =>
              req.category === category &&
              req.tier === tier &&
              req.amount === selectedAmount &&
              req.status === "pending"
            );
            setIsPending(pending);
          });
      });
  };

  const faqs = [
    {
      question: "Who can join?",
      answer: "Anyone with a valid South African ID and a group of at least 3 members."
    },
    {
      question: "Are there any fees?",
      answer: "No monthly fees. Only a small withdrawal fee applies."
    },
    {
      question: "How do I get started?",
      answer: "Click 'Join Now' above or contact our support team for help."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-6 space-x-2">
          <Link to="/dashboard" className="hover:underline text-blue-600">Dashboard</Link>
          <span>/</span>
          <Link to="/dashboard/stokvel-groups" className="hover:underline text-blue-600">Stokvel Groups</Link>
          <span>/</span>
          <span className="text-gray-700 font-semibold">{capitalize(tier)} {capitalize(category)}</span>
        </div>

        {/* Hero Section */}
        <div className="bg-blue-50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 mb-8">
          <div className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold shadow-lg bg-white text-blue-600 mb-4 md:mb-0">
            {capitalize(tier)[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{capitalize(tier)} {capitalize(category)} Stokvel</h1>
            <p className="text-lg text-gray-600 mb-4">{details.description}</p>
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition mt-4 disabled:opacity-50"
              onClick={() => setShowModal(true)}
              disabled={isPending}
            >
              {isPending ? "Pending Approval" : "Join Now"}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center mb-8">
          <label className="block text-lg font-semibold mb-2 text-gray-700">
            Choose your monthly contribution
          </label>
          <div className="w-full max-w-xs">
            <select
              className="block w-full px-5 py-3 rounded-xl border-2 border-blue-300 bg-white text-blue-700 font-bold text-lg shadow focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
              value={selectedAmount}
              onChange={e => setSelectedAmount(Number(e.target.value))}
            >
              {amounts.map(amt => (
                <option key={amt} value={amt}>
                  R{amt}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Selected: <span className="font-bold text-blue-700">R{selectedAmount}</span>
          </div>
        </div>

        {/* Quick Facts */}
        <div className="bg-blue-100 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <div className="font-semibold text-gray-700">Interest Rate</div>
            <div className="text-xl font-bold">{details.interest}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">Access</div>
            <div className="text-xl font-bold">{details.access}</div>
          </div>
        </div>

        {/* What You Get */}
        <h2 className="text-2xl font-bold mb-4 text-center">What You Get</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <Users className="w-12 h-12 mb-2 text-blue-600" />
            <h3 className="font-semibold text-lg mb-1">Group Savings</h3>
            <p className="text-gray-500 text-center text-sm mb-2">
              Save together and reach your goals faster with pooled resources.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 mb-2 text-green-600" />
            <h3 className="font-semibold text-lg mb-1">Safe & Secure</h3>
            <p className="text-gray-500 text-center text-sm mb-2">
              Your funds are protected and always accessible.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <Gift className="w-12 h-12 mb-2 text-pink-600" />
            <h3 className="font-semibold text-lg mb-1">Exclusive Perks</h3>
            <p className="text-gray-500 text-center text-sm mb-2">
              {details.support}
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <Users className="w-10 h-10 mb-2 text-blue-600" />
              <div className="font-semibold mb-1">Invite Members</div>
              <div className="text-gray-500 text-center text-sm">Invite your group members to join the stokvel.</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <TrendingUp className="w-10 h-10 mb-2 text-green-600" />
              <div className="font-semibold mb-1">Set Contributions</div>
              <div className="text-gray-500 text-center text-sm">Set your monthly contribution and savings goal.</div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <CheckCircle className="w-10 h-10 mb-2 text-purple-600" />
              <div className="font-semibold mb-1">Track Progress</div>
              <div className="text-gray-500 text-center text-sm">Track your progress and earn interest together.</div>
                </div>
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <Calendar className="w-10 h-10 mb-2 text-yellow-600" />
              <div className="font-semibold mb-1">Withdraw Funds</div>
              <div className="text-gray-500 text-center text-sm">Withdraw funds anytime or set payout dates.</div>
                  </div>
                  </div>
                </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow p-4">
                <button
                  className="w-full flex justify-between items-center text-left font-semibold text-blue-700"
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                >
                  {faq.question}
                  <span>{openIndex === idx ? "−" : "+"}</span>
                </button>
                {openIndex === idx && (
                  <div className="mt-2 text-gray-600 text-sm">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-2 p-0 relative">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center pt-8">Review Your Join Request</h2>
            {/* Blue background summary */}
            <div className="bg-blue-50 rounded-xl px-8 py-6 mb-6 flex flex-col gap-4">
              <div className="flex flex-row justify-between">
                <span className="font-medium text-gray-600">Full Name:</span>
                <span className="font-semibold text-blue-900">{user?.full_name || user?.name || "-"}</span>
              </div>
              <div className="flex flex-row justify-between">
                <span className="font-medium text-gray-600">Email:</span>
                <span className="font-semibold text-blue-900">{user?.email || "-"}</span>
              </div>
              <div className="flex flex-row justify-between">
                <span className="font-medium text-gray-600">Category:</span>
                <span className="font-semibold text-blue-900">{capitalize(category)}</span>
              </div>
              <div className="flex flex-row justify-between">
                <span className="font-medium text-gray-600">Tier:</span>
                <span className="font-semibold text-blue-900">{capitalize(tier)}</span>
              </div>
              <div className="flex flex-row justify-between">
                <span className="font-medium text-gray-600">Amount:</span>
                <span className="font-semibold text-blue-900">R{selectedAmount}</span>
              </div>
            </div>
            {/* Note about what happens next */}
            <div className="text-gray-500 text-sm text-center mb-6">
              Your request will be reviewed by an admin. You'll be notified once it's approved.
            </div>
            {/* Confirm button */}
          <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition mb-8 mx-auto block"
              onClick={() => {
                handleJoin(selectedAmount);
                setShowModal(false);
                setShowSuccess(true);

                // Refetch join requests to update pending state
                fetch('/api/user/join-requests', {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  }
                })
                  .then(res => res.json())
                  .then(data => {
                    const pending = data.some(req =>
                      req.category === category &&
                      req.tier === tier &&
                      req.amount === selectedAmount &&
                      req.status === "pending"
                    );
                    setIsPending(pending);
                  });
              }}
            >
              Confirm
          </button>
        </div>
      </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-8 flex flex-col items-center relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowSuccess(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-2 text-center">Request Sent!</h2>
            <p className="text-gray-600 text-center mb-4">
              Your join request has been submitted successfully.<br />
              You'll be notified once an admin reviews and approves your request.
            </p>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
              onClick={() => setShowSuccess(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const LearnMoreStokvel = () => (
  <div className="max-w-4xl mx-auto py-10 px-4">
    {/* Hero Section */}
    <div className="bg-blue-50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 mb-8">
      <img src="/src/assets/realistic.png" alt="Stokvel Group" className="w-40 h-40 object-contain" />
      <div>
        <h1 className="text-3xl font-bold mb-2">Platinum Savings Stokvel</h1>
        <p className="text-lg text-gray-600 mb-4">
          Maximize your group's savings with high interest, flexible access, and premium support.
        </p>
        <Link to="/dashboard/stokvel-groups/join">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition">
            Join Now
          </button>
        </Link>
      </div>
    </div>

    {/* Key Benefits */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <DollarSign className="w-12 h-12 mb-2 text-blue-600" />
        <h3 className="font-semibold text-lg mb-1">High Interest</h3>
        <p className="text-gray-500 text-center">Earn up to 5% p.a. on your group savings.</p>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <CheckCircle className="w-12 h-12 mb-2 text-green-600" />
        <h3 className="font-semibold text-lg mb-1">Flexible Access</h3>
        <p className="text-gray-500 text-center">Withdraw funds anytime, no penalties.</p>
      </div>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
        <Users className="w-12 h-12 mb-2 text-purple-600" />
        <h3 className="font-semibold text-lg mb-1">24/7 Support</h3>
        <p className="text-gray-500 text-center">Get premium support for your group.</p>
      </div>
    </div>

    {/* Quick Facts */}
    <div className="bg-blue-100 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center mb-8">
      <div>
        <div className="font-semibold text-gray-700">Minimum Contribution</div>
        <div className="text-xl font-bold">R2,000</div>
      </div>
      <div>
        <div className="font-semibold text-gray-700">Interest Rate</div>
        <div className="text-xl font-bold">5.0% p.a.</div>
      </div>
      <div>
        <div className="font-semibold text-gray-700">Access</div>
        <div className="text-xl font-bold">Anytime</div>
      </div>
    </div>

    {/* How it Works */}
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">How it Works</h2>
      <ol className="list-decimal list-inside space-y-2 text-gray-600">
        <li>Invite your group members to join the stokvel.</li>
        <li>Set your monthly contribution and savings goal.</li>
        <li>Track your progress and earn interest together.</li>
        <li>Withdraw funds anytime or set payout dates.</li>
      </ol>
    </div>

    {/* FAQ */}
    <div>
      <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
      <div className="mb-2">
        <div className="font-semibold">Who can join?</div>
        <div className="text-gray-600">Anyone with a valid South African ID and a group of at least 3 members.</div>
      </div>
      <div className="mb-2">
        <div className="font-semibold">Are there any fees?</div>
        <div className="text-gray-600">No monthly fees. Only a small withdrawal fee applies.</div>
      </div>
      <div className="mb-2">
        <div className="font-semibold">How do I get started?</div>
        <div className="text-gray-600">Click "Join Now" above or contact our support team for help.</div>
      </div>
    </div>
  </div>
);

export default TierDetails;