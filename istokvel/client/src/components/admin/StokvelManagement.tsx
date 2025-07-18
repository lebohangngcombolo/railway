import React, { useState, useMemo, useEffect } from "react";
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Users,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Filter,
  Clock,
  User,
  Building2,
  PiggyBank,
  Heart,
  TrendingUp,
  Briefcase,
  MoreHorizontal,
  Check,
  X,
  AlertCircle,
  MessageSquare,
  Archive,
  RotateCcw,
  History,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import { adminAPI } from "../../services/api";
import { toast } from "react-hot-toast";
import CreateStokvelGroup from "../CreateStokvelGroup";

// Category configuration
const CATEGORIES = [
  { key: "savings", label: "Savings", icon: PiggyBank, color: "indigo" },
  { key: "burial", label: "Burial", icon: Heart, color: "rose" },
  { key: "investment", label: "Investment", icon: TrendingUp, color: "emerald" },
  { key: "business", label: "Business", icon: Briefcase, color: "violet" },
];

const TIERS = ["Bronze", "Silver", "Gold", "Platinum"];

// Request Status Management
const REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved", 
  REJECTED: "rejected",
  ARCHIVED: "archived"
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    pending: { 
      color: "bg-amber-50 text-amber-700 border-amber-200", 
      icon: Clock,
      bgColor: "bg-amber-100"
    },
    approved: { 
      color: "bg-emerald-50 text-emerald-700 border-emerald-200", 
      icon: CheckCircle,
      bgColor: "bg-emerald-100"
    },
    rejected: { 
      color: "bg-rose-50 text-rose-700 border-rose-200", 
      icon: XCircle,
      bgColor: "bg-rose-100"
    },
    archived: { 
      color: "bg-gray-50 text-gray-700 border-gray-200", 
      icon: Archive,
      bgColor: "bg-gray-100"
    },
  };
  
  const { color, icon: Icon, bgColor } = config[status as keyof typeof config] || config.pending;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon size={12} />
      <span className="capitalize">{status}</span>
    </span>
  );
};

// Archive Management Modal
const ArchiveModal = ({ isOpen, onClose, onRestore, onDelete, request }: {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (id: number) => void;
  onDelete: (id: number) => void;
  request: any;
}) => {
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    try {
      await onRestore(request.id);
      toast.success("Request restored successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to restore request");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this request?")) {
      setLoading(true);
      try {
        await onDelete(request.id);
        toast.success("Request deleted permanently!");
        onClose();
      } catch (error) {
        toast.error("Failed to delete request");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Archive Management</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-indigo-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{request.user}</div>
                <div className="text-sm text-gray-500">{request.groupName} • {request.tier}</div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">Rejected on:</span> {new Date(request.rejectedAt || request.date).toLocaleDateString()}
            </div>

            {request.reason && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Reason:</span> {request.reason}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleRestore}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md font-medium hover:bg-indigo-100 transition disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <RotateCcw size={16} />
                )}
                Restore Request
              </button>
  <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-md font-medium hover:bg-rose-100 transition disabled:opacity-50"
              >
                <Trash2 size={16} />
  </button>
            </div>
      </div>
      </div>
      </div>
    </div>
  );
};

// Modal Component for View Details
const ViewDetailsModal = ({ request, isOpen, onClose }: {
  request: any;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-indigo-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{request.user}</div>
                <div className="text-sm text-gray-500">Applicant</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Group</div>
                <div className="text-sm text-gray-900">{request.groupName}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Category</div>
                <div className="text-sm text-gray-900 capitalize">{request.category}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Tier</div>
                <div className="text-sm text-gray-900">{request.tier}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Monthly Amount</div>
                <div className="text-sm text-gray-900">R{request.monthly}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Status</div>
                <StatusBadge status={request.status} />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Date Applied</div>
                <div className="text-sm text-gray-900">
                  {new Date(request.date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {request.reason && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Reason</div>
                <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {request.reason}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact Join Request Card with improved colors
const CompactRequestCard = ({ request, onApprove, onReject, onView }: {
  request: any;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onView: (id: number) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(request.id);
      toast.success("Request approved successfully!");
    } catch (error) {
      toast.error("Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(request.id);
      toast.success("Request rejected successfully!");
    } catch (error) {
      toast.error("Failed to reject request");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200">
      {/* Main Row */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{request.user}</div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span className="font-medium text-indigo-600">{request.tier}</span>
              <span>•</span>
              <span className="font-medium">R{request.monthly}/month</span>
              <span>•</span>
              <span className="text-xs">{new Date(request.date).toLocaleDateString()}</span>
      </div>
    </div>
  </div>
        
        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} />
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-3 space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Group:</span> {request.groupName}
            </div>
            {request.reason && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Reason:</span> {request.reason}
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              {request.status === "pending" && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium hover:bg-emerald-100 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-3 h-3 border border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
                    ) : (
                      <Check size={14} />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-md text-sm font-medium hover:bg-rose-100 transition disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-3 h-3 border border-rose-300 border-t-rose-600 rounded-full animate-spin"></div>
                    ) : (
                      <X size={14} />
                    )}
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => onView(request.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-100 transition"
              >
                <Eye size={14} />
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Category Section Component with improved colors
const CategorySection = ({ category, requests, onApprove, onReject, onView }: {
  category: any;
  requests: any[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onView: (id: number) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const totalCount = requests.length;
  
  const Icon = category.icon;
  const colorMap = {
    indigo: "text-indigo-600 bg-indigo-50",
    rose: "text-rose-600 bg-rose-50", 
    emerald: "text-emerald-600 bg-emerald-50",
    violet: "text-violet-600 bg-violet-50"
  };
  const colorClass = colorMap[category.color as keyof typeof colorMap] || colorMap.indigo;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Category Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{category.label}</h3>
              <div className="text-sm text-gray-500">
                {totalCount} request{totalCount !== 1 ? 's' : ''} • {pendingCount} pending
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {pendingCount} pending
              </span>
            )}
            <button className="p-1 hover:bg-gray-200 rounded transition">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Category Content */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Tier Tabs */}
          <div className="flex border-b border-gray-100">
            {TIERS.map(tier => {
              const tierRequests = requests.filter(r => r.tier === tier);
              const tierPending = tierRequests.filter(r => r.status === "pending").length;
              
              return (
                <button
                  key={tier}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition ${
                    tierRequests.length > 0 
                      ? 'border-gray-200 text-gray-700 hover:text-gray-900' 
                      : 'border-transparent text-gray-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{tier}</span>
                    {tierPending > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                        {tierPending}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Requests List */}
          <div className="p-4 space-y-3">
            {requests.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <AlertCircle size={24} className="mx-auto mb-2 text-gray-400" />
                No join requests in this category
              </div>
            ) : (
              requests.map(request => (
                <CompactRequestCard
                  key={request.id}
                  request={request}
                  onApprove={onApprove}
                  onReject={onReject}
                  onView={onView}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const GROUP_CATEGORIES = [
  "All", "Savings", "Burial", "Investment", "Business"
];
const GROUP_TIERS = ["All", "Bronze", "Silver", "Gold", "Platinum"];
const GROUP_STATUSES = ["All", "Active", "Inactive"];

const GroupStatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold
    ${status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

const GroupsTable: React.FC<{
  groups: any[];
  onView: (group: any) => void;
  onEdit: (group: any) => void;
  onDelete: (group: any) => void;
}> = ({ groups, onView, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-[#3B4CCA]">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-white">Group Name</th>
            <th className="px-4 py-3 text-left font-semibold text-white">Category</th>
            <th className="px-4 py-3 text-left font-semibold text-white">Tier</th>
            <th className="px-4 py-3 text-center font-semibold text-white">Members</th>
            <th className="px-4 py-3 text-center font-semibold text-white">Status</th>
            <th className="px-4 py-3 text-center font-semibold text-white">Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-gray-400 py-8">No groups found.</td>
            </tr>
          ) : (
            groups.map((group) => (
              <tr key={group.id} className="border-t">
                <td className="px-4 py-3 flex items-center gap-2 font-medium text-gray-900">
                  <Tag size={16} className="text-indigo-500" />
                  {group.name}
                </td>
                <td className="px-4 py-3 capitalize">{group.category}</td>
                <td className="px-4 py-3">{group.tier}</td>
                <td className="px-4 py-3 text-center">{group.members}</td>
                <td className="px-4 py-3 text-center">
                  <GroupStatusBadge status={group.status} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center gap-2 justify-center">
                    <button onClick={() => onView(group)} className="p-1 hover:bg-indigo-50 rounded" title="View">
                      <Eye size={16} className="text-indigo-600" />
                    </button>
                    <button onClick={() => onEdit(group)} className="p-1 hover:bg-emerald-50 rounded" title="Edit">
                      <Edit size={16} className="text-emerald-600" />
                    </button>
                    <button onClick={() => onDelete(group)} className="p-1 hover:bg-rose-50 rounded" title="Delete">
                      <Trash2 size={16} className="text-rose-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="More">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Main Groups Tab Component
const GroupsTab: React.FC<{
  groups: any[];
  loading: boolean;
  error: string | null;
}> = ({ groups, loading, error }) => {
  // State for search, filters, pagination
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tier, setTier] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  // Filtering
  const filtered = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || g.category === category;
      const matchesTier = tier === "All" || g.tier === tier;
      const matchesStatus = status === "All" || g.status.toLowerCase() === status.toLowerCase();
      return matchesSearch && matchesCategory && matchesTier && matchesStatus;
    });
  }, [groups, search, category, tier, status]);

  // Pagination
  const pageSize = 10;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Action handlers (placeholders)
  const handleView = (group: any) => {
    // Show modal or drawer with group details
    alert(`View group: ${group.name}`);
  };
  const handleEdit = (group: any) => {
    alert(`Edit group: ${group.name}`);
  };
  const handleDelete = (group: any) => {
    if (window.confirm(`Delete group "${group.name}"?`)) {
      alert("Deleted (implement actual delete logic)");
    }
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <input
            className="w-48 outline-none bg-white border border-gray-200 rounded px-3 py-2 text-sm"
            placeholder="Search Groups"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="rounded px-2 py-1 border border-gray-200 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
            {GROUP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="rounded px-2 py-1 border border-gray-200 text-sm" value={tier} onChange={e => setTier(e.target.value)}>
            {GROUP_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="rounded px-2 py-1 border border-gray-200 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
            {GROUP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
      </div>
      </div>
      {/* Table */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading groups...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-12">{error}</div>
      ) : (
        <>
          <GroupsTable
            groups={paginated}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              className="p-2 rounded hover:bg-gray-100"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium">
              Page {page} of {totalPages || 1}
            </span>
            <button
              className="p-2 rounded hover:bg-gray-100"
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          </>
        )}
  </div>
);
};

const StokvelManagement: React.FC = () => {
  const [tab, setTab] = useState<"groups" | "requests">("groups");
  const [activeCategory, setActiveCategory] = useState("savings");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Data state
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    setGroupsLoading(true);
    setGroupsError(null);
    adminAPI
      .getGroups()
      .then((res) => {
        const data = res.data.groups || res.data;
        setGroups(
          data.map((g: any) => ({
            id: g.id,
            name: g.name,
            category: g.category,
            tier: g.tier,
            monthly: g.monthly || g.contributionAmount || g.amount || 0,
            members: g.memberCount || g.members || 0,
            created: g.createdAt || g.created || g.dateCreated || "",
            status: g.status || (g.is_active ? "active" : "inactive"),
          }))
        );
        setGroupsLoading(false);
      })
      .catch((err) => {
        setGroupsError(err.message || "Failed to fetch groups");
        setGroupsLoading(false);
      });
  }, []);

  useEffect(() => {
    setRequestsLoading(true);
    setRequestsError(null);
    adminAPI
      .getJoinRequests()
      .then((res) => {
        const data = res.data.requests || res.data;
        setJoinRequests(
          data.map((r: any) => ({
            id: r.id,
            groupName: r.group_name || r.groupName || "Unknown Group",
            groupId: r.group_id || null,
            category: r.category || "savings",
            tier: r.tier || "Bronze",
            monthly: r.amount || 0,
            user: r.user?.name || r.user?.full_name || r.user || "Unknown User",
            date: r.created_at || new Date().toISOString(),
            status: r.status || "pending",
            reason: r.reason || "",
          }))
        );
        setRequestsLoading(false);
      })
      .catch((err) => {
        setRequestsError(err.message || "Failed to fetch join requests");
        setRequestsLoading(false);
      });
  }, []);

  // Filter and group requests
  const filteredRequests = useMemo(() => {
    return joinRequests.filter(request => {
      const userName = (request.user || "").toLowerCase();
      const groupName = (request.groupName || "").toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch =
        userName.includes(searchLower) ||
        groupName.includes(searchLower);
      
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesCategory = (request.category || "savings").toLowerCase() === activeCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [joinRequests, searchTerm, statusFilter, activeCategory]);

  const groupedRequests = useMemo(() => {
    const grouped: { [category: string]: any[] } = {};
    CATEGORIES.forEach(cat => {
      grouped[cat.key] = filteredRequests.filter(r => 
        (r.category || "savings").toLowerCase() === cat.key
      );
    });
    return grouped;
  }, [filteredRequests]);

  // Action handlers with actual API calls
  const handleApprove = async (id: number) => {
    try {
      await adminAPI.approveJoinRequest(id);
      // Refresh the requests list
      const res = await adminAPI.getJoinRequests();
      const data = res.data.requests || res.data;
      setJoinRequests(
        data.map((r: any) => ({
          id: r.id,
          groupName: r.group_name || r.groupName || "Unknown Group",
          groupId: r.group_id || null,
          category: r.category || "savings",
          tier: r.tier || "Bronze",
          monthly: r.amount || 0,
          user: r.user?.name || r.user?.full_name || r.user || "Unknown User",
          date: r.created_at || new Date().toISOString(),
          status: r.status || "pending",
          reason: r.reason || "",
        }))
      );
    } catch (error) {
      throw error;
    }
  };

  const handleReject = async (id: number) => {
    try {
      await adminAPI.rejectJoinRequest(id, { reason: "Request rejected by admin" });
      // Refresh the requests list
      const res = await adminAPI.getJoinRequests();
      const data = res.data.requests || res.data;
      setJoinRequests(
        data.map((r: any) => ({
          id: r.id,
          groupName: r.group_name || r.groupName || "Unknown Group",
          groupId: r.group_id || null,
          category: r.category || "savings",
          tier: r.tier || "Bronze",
          monthly: r.amount || 0,
          user: r.user?.name || r.user?.full_name || r.user || "Unknown User",
          date: r.created_at || new Date().toISOString(),
          status: r.status || "pending",
          reason: r.reason || "",
        }))
      );
    } catch (error) {
      throw error;
    }
  };

  const handleView = (id: number) => {
    const request = joinRequests.find(r => r.id === id);
    if (request) {
      setSelectedRequest(request);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stokvel Management</h1>
        {tab === "groups" && (
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            Create New Group
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: "groups", label: "Groups" },
          { key: "requests", label: "Join Requests" }
        ].map((t) => (
          <button
            key={t.key}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              tab === t.key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setTab(t.key as "groups" | "requests")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Groups Tab (keep existing) */}
      {tab === "groups" && (
        <div className="max-w-5xl mx-auto">
          <GroupsTab groups={groups} loading={groupsLoading} error={groupsError} />
        </div>
      )}

      {/* Join Requests Tab - IMPROVED VERSION */}
      {tab === "requests" && (
        <div className="max-w-6xl mx-auto">
          {/* Search and Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                    type="text"
                    placeholder="Search by user name or group..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
              </div>
              <div className="flex items-center gap-3">
              <select
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
              </select>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {CATEGORIES.map((category) => {
              const categoryRequests = groupedRequests[category.key] || [];
              const pendingCount = categoryRequests.filter(r => r.status === "pending").length;
              
              return (
                <button
                  key={category.key}
                  className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition relative ${
                    activeCategory === category.key
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveCategory(category.key)}
                >
                  <category.icon size={18} />
                  <span>{category.label}</span>
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Requests Content */}
          {requestsLoading ? (
            <div className="text-center text-gray-500 py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              Loading join requests...
            </div>
          ) : requestsError ? (
            <div className="text-center text-red-500 py-12">{requestsError}</div>
          ) : (
            <div className="space-y-6">
              {CATEGORIES.map(category => {
                const categoryRequests = groupedRequests[category.key] || [];
                if (categoryRequests.length === 0) return null;
                
                return (
                  <CategorySection
                    key={category.key}
                    category={category}
                    requests={categoryRequests}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onView={handleView}
                  />
                );
              })}
              
              {Object.values(groupedRequests).every(requests => requests.length === 0) && (
                <div className="text-center text-gray-500 py-12">
                  <MessageSquare size={24} className="mx-auto mb-2 text-gray-400" />
                  No join requests found
                </div>
              )}
              </div>
          )}
        </div>
      )}

      {/* View Details Modal */}
      <ViewDetailsModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
        }}
      />

      {showCreateModal && (
        <CreateStokvelGroup
          onSubmit={async (data) => {
            try {
              await adminAPI.createGroup({
                ...data,
                contributionAmount: data.contributionAmount || data.contribution_amount,
                maxMembers: data.maxMembers || data.max_members,
              });
              // Refresh groups
              const res = await adminAPI.getGroups();
              const data = res.data.groups || res.data;
              setGroups(
                data.map((g: any) => ({
                  id: g.id,
                  name: g.name,
                  category: g.category,
                  tier: g.tier,
                  monthly: g.monthly || g.contributionAmount || g.amount || 0,
                  members: g.memberCount || g.members || 0,
                  created: g.createdAt || g.created || g.dateCreated || "",
                  status: g.status || (g.is_active ? "active" : "inactive"),
                }))
              );
              toast.success("Group created!");
              setShowCreateModal(false);
            } catch (err: any) {
              toast.error(err?.response?.data?.error || "Failed to create group");
            }
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default StokvelManagement; 