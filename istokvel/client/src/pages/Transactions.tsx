import React, { useEffect, useState } from "react";
import { Search, Calendar, ChevronDown } from "lucide-react";

// Define the Transaction type to match your backend
interface Transaction {
  id: string;
  contributor: string;
  group: string;
  group_id: string;
  payment_method: string;
  card_number_last4?: string;
  date: string;
  description: string;
  reference: string;
  amount: number;
}

const dateRanges = [
  { label: "Last 6 months", value: "6m" },
  { label: "Last 3 months", value: "3m" },
  { label: "Last month", value: "1m" },
  { label: "This year", value: "ytd" },
];

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [dateRange, setDateRange] = useState(dateRanges[0].value);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [groupNames, setGroupNames] = useState<string[]>([]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/contributions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTransactions(data);
      setFiltered(data);
    };
    fetchTransactions();
  }, []);

  // Fetch group categories
  useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/admin/group-categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  // Fetch group names for the dropdown
  useEffect(() => {
    const fetchGroupNames = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/admin/group-names', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGroupNames(data);
    };
    fetchGroupNames();
  }, []);

  // Filtering logic
  useEffect(() => {
    setFiltered(
      transactions.filter(
        (t) =>
          (selectedGroup === "all" || t.group === selectedGroup) &&
          (selectedAccount === "all" || t.payment_method === selectedAccount) &&
          (search === "" ||
            t.contributor.toLowerCase().includes(search.toLowerCase()) ||
            t.group.toLowerCase().includes(search.toLowerCase()) ||
            t.reference.toLowerCase().includes(search.toLowerCase()))
      )
    );
  }, [search, transactions, selectedGroup, selectedAccount]);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">All Transactions</h1>
      {/* Filters Row */}
      <div className="flex flex-col gap-2 mb-2 md:flex-row md:items-end md:gap-4">
        {/* Group Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
          <div className="relative">
            <select
              className="border border-gray-300 rounded-lg pl-3 pr-8 py-2 w-56 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
            >
              <option value="all">All Groups</option>
              {groupNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {/* Account Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
          <div className="relative">
            <select
              className="border border-gray-300 rounded-lg pl-3 pr-8 py-2 w-56 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
            >
              <option value="all">All Accounts</option>
              <option value="wallet">Wallet</option>
              <option value="bank">Bank Card</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {/* Date Range Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <div className="relative">
            <select
              className="border border-gray-300 rounded-lg pl-3 pr-8 py-2 w-48 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            >
              {dateRanges.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <Calendar className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      {/* Search Row */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search by User, Group, or Ref No.
        </label>
        <div className="relative w-full md:w-1/2">
          <input
            type="text"
            className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#3B4CCA]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Contributor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">From Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Ref No.</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((txn) => (
                <tr key={txn.id} className="hover:bg-blue-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">{txn.contributor}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {txn.payment_method === 'wallet'
                      ? 'Wallet'
                      : txn.card_number_last4
                        ? `Bank Card ****${txn.card_number_last4}`
                        : 'Bank'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(txn.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{txn.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{txn.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">
                    R {txn.amount.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;