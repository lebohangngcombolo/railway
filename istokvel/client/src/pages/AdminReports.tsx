import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const tabs = [
  { label: 'Transactions', key: 'transactions' },
  { label: 'Contributions', key: 'contributions' },
  { label: 'Withdrawals', key: 'withdrawals' },
  { label: 'Users', key: 'users' },
  { label: 'Groups', key: 'groups' },
  { label: 'Referrals', key: 'referrals' },
];

const columns: { [key: string]: string[] } = {
  transactions: ['created_at', 'user_name', 'transaction_type', 'amount', 'status', 'payment_method'],
  contributions: ['date', 'contributor', 'group', 'amount', 'status'],
  withdrawals: ['created_at', 'user_name', 'group_name', 'amount', 'status'],
  users: ['full_name', 'email', 'role', 'is_verified', 'created_at'],
  groups: ['name', 'category', 'member_count', 'total_contributions', 'status'],
  referrals: ['referrer_name', 'referee_name', 'status', 'created_at'],
};

const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [filters, setFilters] = useState({
    user: 'All Users',
    group: 'All Groups',
    type: 'All Types',
    status: 'All Statuses',
    start: '',
    end: '',
    search: '',
  });
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<string[]>(['All Users']);
  const [groupOptions, setGroupOptions] = useState<string[]>(['All Groups']);
  const [statusOptions, setStatusOptions] = useState<string[]>(['All Statuses']);
  const [typeOptions, setTypeOptions] = useState<string[]>(['All Types']);
  const [exporting, setExporting] = useState(false); // Add this state
  const [exportProgress, setExportProgress] = useState(0); // Add this state for progress

  // Helper function to get most common value
  const getMostCommon = (data: any[], field: string) => {
    const counts: { [key: string]: number } = {};
    data.forEach(item => {
      const value = item[field];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    const maxKey = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '');
    return maxKey || 'N/A';
  };

  // Fetch dropdown options
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const usersRes = await adminAPI.getUsers();
        const groupsRes = await adminAPI.getGroupsDetailed();
        
        setUserOptions(['All Users', ...usersRes.data.map((u: any) => u.full_name)]);
        setGroupOptions(['All Groups', ...groupsRes.data.map((g: any) => g.name)]);
      } catch (error) {
        console.error('Error fetching dropdowns:', error);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch data for active tab
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        let result: any = {};
        
        switch (activeTab) {
          case 'transactions':
            const transactionsRes = await adminAPI.getTransactions();
            result = transactionsRes.data.map((item: any) => ({
              created_at: new Date(item.created_at).toLocaleDateString(),
              user_name: item.user_name,
              transaction_type: item.transaction_type,
              amount: `R${item.amount.toFixed(2)}`,
              status: item.status,
              payment_method: item.payment_method || 'N/A',
              // For filtering - use consistent field names
              date: item.created_at, // for date filtering
              user: item.user_name, // for user filtering
              type: item.transaction_type, // for type filtering
              group: 'N/A', // transactions don't have groups
            }));
            // Update type options for transactions
            const transactionTypes = [...new Set(result.map((item: any) => item.transaction_type))];
            setTypeOptions(['All Types', ...transactionTypes]);
            break;
            
          case 'contributions':
            const contributionsRes = await adminAPI.getContributions();
            result = contributionsRes.data.map((item: any) => ({
              date: new Date(item.date).toLocaleDateString(),
              contributor: item.contributor,
              group: item.group,
              amount: `R${item.amount.toFixed(2)}`,
              status: item.status,
              // For filtering - use consistent field names
              user: item.contributor, // for user filtering
              type: 'Contribution', // for type filtering
            }));
            setTypeOptions(['All Types', 'Contribution']);
            break;
            
          case 'withdrawals':
            const withdrawalsRes = await adminAPI.getWithdrawals();
            result = withdrawalsRes.data.map((item: any) => ({
              created_at: new Date(item.created_at).toLocaleDateString(),
              user_name: item.user_name,
              group_name: item.group_name,
              amount: `R${item.amount.toFixed(2)}`,
              status: item.status,
              // For filtering - use consistent field names
              date: item.created_at, // for date filtering
              user: item.user_name, // for user filtering
              group: item.group_name, // for group filtering
              type: 'Withdrawal', // for type filtering
            }));
            setTypeOptions(['All Types', 'Withdrawal']);
            break;
            
          case 'users':
            const usersRes = await adminAPI.getUsers();
            result = usersRes.data.map((item: any) => ({
              full_name: item.full_name,
              email: item.email,
              role: item.role,
              is_verified: item.is_verified ? 'Yes' : 'No',
              created_at: new Date(item.created_at).toLocaleDateString(),
              // For filtering - use consistent field names
              date: item.created_at, // for date filtering
              user: item.full_name, // for user filtering
              type: item.role, // for type filtering (admin/member)
              group: item.groups?.join(', ') || 'N/A', // for group filtering
            }));
            setTypeOptions(['All Types', 'admin', 'member']);
            break;
            
          case 'groups':
            const groupsRes = await adminAPI.getGroupsDetailed();
            result = groupsRes.data.map((item: any) => ({
              name: item.name,
              category: item.category,
              member_count: item.member_count,
              total_contributions: `R${item.total_contributions.toFixed(2)}`,
              status: item.status,
              // For filtering - use consistent field names
              date: item.created_at, // for date filtering
              user: 'N/A', // groups don't have users
              group: item.name, // for group filtering
              type: item.category, // for type filtering
            }));
            const groupTypes = [...new Set(result.map((item: any) => item.category))];
            setTypeOptions(['All Types', ...groupTypes]);
            break;
            
          case 'referrals':
            const referralsRes = await adminAPI.getReferrals();
            result = referralsRes.data.map((item: any) => ({
              referrer_name: item.referrer_name,
              referee_name: item.referee_name,
              status: item.status,
              created_at: new Date(item.created_at).toLocaleDateString(),
              // For filtering - use consistent field names
              date: item.created_at, // for date filtering
              user: item.referrer_name, // for user filtering
              type: 'Referral', // for type filtering
              group: 'N/A', // referrals don't have groups
            }));
            setTypeOptions(['All Types', 'Referral']);
            break;
        }
        
        // Update status options based on current data
        const statuses = [...new Set(result.map((item: any) => item.status))];
        setStatusOptions(['All Statuses', ...statuses]);
        
        setData((prev: any) => ({ ...prev, [activeTab]: result }));
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
        setData((prev: any) => ({ ...prev, [activeTab]: [] }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);

  // Filtered data
  const tableData = (data[activeTab] || []).filter((row: any) => {
    // Date filter
    if (filters.start && row.date) {
      const rowDate = new Date(row.date);
      const startDate = new Date(filters.start);
      if (rowDate < startDate) return false;
    }
    if (filters.end && row.date) {
      const rowDate = new Date(row.date);
      const endDate = new Date(filters.end);
      if (rowDate > endDate) return false;
    }
    
    // User filter
    if (filters.user !== 'All Users' && row.user && row.user !== filters.user) return false;
    
    // Group filter
    if (filters.group !== 'All Groups' && row.group && row.group !== filters.group) return false;
    
    // Type filter
    if (filters.type !== 'All Types' && row.type && row.type !== filters.type) return false;
    
    // Status filter
    if (filters.status !== 'All Statuses' && row.status && row.status !== filters.status) return false;
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const hasMatch = Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchLower)
      );
      if (!hasMatch) return false;
    }
    
    return true;
  });

  // Add this useEffect to recalculate insights when filters change
  useEffect(() => {
    // This will trigger a re-render of the insights when filters change
    // The calculateInsights function will use the updated tableData
  }, [filters, data, activeTab]);

  // Calculate insights based on current FILTERED data (not all data)
  const calculateInsights = () => {
    const currentData = tableData; // Use filtered data instead of all data
    if (currentData.length === 0) return [];

    switch (activeTab) {
      case 'transactions':
        const totalVolume = currentData.reduce((sum: number, item: any) => {
          const amount = parseFloat(item.amount.replace('R', '').replace(',', ''));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        return [
          { label: "Total Volume", value: `R${totalVolume.toFixed(2)}` },
          { label: "Total Transactions", value: currentData.length.toString() },
          { label: "Most Common Type", value: getMostCommon(currentData, 'transaction_type') },
          { label: "Pending Transactions", value: currentData.filter((item: any) => item.status === 'pending').length.toString() },
        ];
        
      case 'contributions':
        const totalContributions = currentData.reduce((sum: number, item: any) => {
          const amount = parseFloat(item.amount.replace('R', '').replace(',', ''));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        return [
          { label: "Total Contributions", value: `R${totalContributions.toFixed(2)}` },
          { label: "Total Count", value: currentData.length.toString() },
          { label: "Top Contributor", value: getMostCommon(currentData, 'contributor') },
          { label: "Top Group", value: getMostCommon(currentData, 'group') },
        ];
        
      case 'withdrawals':
        const totalWithdrawals = currentData.reduce((sum: number, item: any) => {
          const amount = parseFloat(item.amount.replace('R', '').replace(',', ''));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        return [
          { label: "Total Withdrawals", value: `R${totalWithdrawals.toFixed(2)}` },
          { label: "Pending Withdrawals", value: currentData.filter((item: any) => item.status === 'pending').length.toString() },
          { label: "Top Withdrawer", value: getMostCommon(currentData, 'user_name') },
          { label: "Top Group", value: getMostCommon(currentData, 'group_name') },
        ];
        
      case 'users':
        return [
          { label: "Total Users", value: currentData.length.toString() },
          { label: "Verified Users", value: currentData.filter((item: any) => item.is_verified === 'Yes').length.toString() },
          { label: "Admins", value: currentData.filter((item: any) => item.role === 'admin').length.toString() },
          { label: "Members", value: currentData.filter((item: any) => item.role === 'member').length.toString() },
        ];
        
      case 'groups':
        const totalMembers = currentData.reduce((sum: number, item: any) => sum + item.member_count, 0);
        const totalGroupContributions = currentData.reduce((sum: number, item: any) => {
          const amount = parseFloat(item.total_contributions.replace('R', '').replace(',', ''));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        return [
          { label: "Total Groups", value: currentData.length.toString() },
          { label: "Total Members", value: totalMembers.toString() },
          { label: "Total Contributions", value: `R${totalGroupContributions.toFixed(2)}` },
          { label: "Active Groups", value: currentData.filter((item: any) => item.status === 'active').length.toString() },
        ];
        
      case 'referrals':
        return [
          { label: "Total Referrals", value: currentData.length.toString() },
          { label: "Completed", value: currentData.filter((item: any) => item.status === 'completed').length.toString() },
          { label: "Pending", value: currentData.filter((item: any) => item.status === 'pending').length.toString() },
          { label: "Top Referrer", value: getMostCommon(currentData, 'referrer_name') },
        ];
        
      default:
        return [];
    }
  };

  const insights = calculateInsights();

  // Add this function inside your AdminReports component
  const convertToCSV = (data: any[], columns: string[]) => {
    if (data.length === 0) return '';
    
    // Create header row
    const headers = columns.map(col => col.replace('_', ' ').toUpperCase());
    const csvRows = [headers.join(',')];
    
    // Create data rows
    data.forEach(row => {
      const values = columns.map(col => {
        const value = row[col] || '';
        // Escape commas and quotes in the value
        const escapedValue = String(value).replace(/"/g, '""');
        return `"${escapedValue}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportProgress(0);
      
      if (tableData.length === 0) {
        alert('No data to export');
        return;
      }

      // Show loading state with progress for 5 seconds
      const duration = 5000; // 5 seconds
      const interval = 100; // Update every 100ms
      const steps = duration / interval;
      
      for (let i = 0; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        setExportProgress((i / steps) * 100);
      }

      // Convert data to CSV
      const csv = convertToCSV(tableData, columns[activeTab]);

      // Create and download the file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      // Create filename with current date and tab name
      const date = new Date().toISOString().split('T')[0];
      let filename = `${activeTab}_${date}`;
      
      // Add filter info to filename if any filters are applied
      const filterParts = [];
      if (filters.user !== 'All Users') filterParts.push(filters.user.replace(/\s+/g, '_'));
      if (filters.group !== 'All Groups') filterParts.push(filters.group.replace(/\s+/g, '_'));
      if (filters.status !== 'All Statuses') filterParts.push(filters.status);
      if (filters.type !== 'All Types') filterParts.push(filters.type);
      
      if (filterParts.length > 0) {
        filename += `_filtered_${filterParts.join('_')}`;
      }
      
      filename += '.csv';
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      
      {/* Filters Bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur flex flex-wrap gap-4 mb-6 items-end rounded-xl shadow-sm p-4">
        <input 
          type="date" 
          value={filters.start} 
          onChange={e => setFilters(f => ({ ...f, start: e.target.value }))} 
          className="border rounded px-3 py-2 text-sm" 
          placeholder="Start Date"
        />
        <input 
          type="date" 
          value={filters.end} 
          onChange={e => setFilters(f => ({ ...f, end: e.target.value }))} 
          className="border rounded px-3 py-2 text-sm" 
          placeholder="End Date"
        />
        <select 
          value={filters.user} 
          onChange={e => setFilters(f => ({ ...f, user: e.target.value }))} 
          className="border rounded px-3 py-2 text-sm"
        >
          {userOptions.map(u => <option key={u}>{u}</option>)}
        </select>
        <select 
          value={filters.group} 
          onChange={e => setFilters(f => ({ ...f, group: e.target.value }))} 
          className="border rounded px-3 py-2 text-sm"
        >
          {groupOptions.map(g => <option key={g}>{g}</option>)}
        </select>
        <select 
          value={filters.type} 
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} 
          className="border rounded px-3 py-2 text-sm"
        >
          {typeOptions.map(t => <option key={t}>{t}</option>)}
        </select>
        <select 
          value={filters.status} 
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} 
          className="border rounded px-3 py-2 text-sm"
        >
          {statusOptions.map(s => <option key={s}>{s}</option>)}
        </select>
        <button 
          onClick={handleExport}
          disabled={tableData.length === 0 || exporting}
          className={`px-4 py-2 rounded shadow transition text-sm flex items-center gap-2 relative overflow-hidden ${
            tableData.length === 0 || exporting
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Preparing Export... {Math.round(exportProgress)}%</span>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-out"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{tableData.length === 0 ? 'No Data to Export' : 'Export CSV'}</span>
            </>
          )}
        </button>
        <div className="ml-auto">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Search..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Insights */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          {filters.user !== 'All Users' && `Filtered by: ${filters.user}`}
          {filters.group !== 'All Groups' && ` | Group: ${filters.group}`}
          {filters.status !== 'All Statuses' && ` | Status: ${filters.status}`}
          {filters.type !== 'All Types' && ` | Type: ${filters.type}`}
          {(filters.user === 'All Users' && filters.group === 'All Groups' && 
            filters.status === 'All Statuses' && filters.type === 'All Types') && 
            'Showing all data'
          }
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {insights.map(card => (
            <div key={card.label} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-1">{card.label}</div>
              <div className="text-lg font-bold text-indigo-700">{card.value}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              {columns[activeTab].map(col => (
                <th key={col} className="px-4 py-3 text-left capitalize text-sm font-medium text-gray-700">
                  {col.replace('_', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns[activeTab].length} className="text-center text-gray-400 py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : tableData.length === 0 ? (
              <tr>
                <td colSpan={columns[activeTab].length} className="text-center text-gray-400 py-8">
                  No data found.
                </td>
              </tr>
            ) : (
              tableData.map((row, idx) => (
                <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors`}>
                  {columns[activeTab].map(col => (
                    <td key={col} className="px-4 py-3 text-sm">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination placeholder */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing {tableData.length} of {data[activeTab]?.length || 0} results
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
          <button className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
