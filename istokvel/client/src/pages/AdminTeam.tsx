import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { 
  Plus, Search, Edit, Trash2, Shield, Users, UserPlus, 
  Lock, Unlock, Eye, EyeOff, AlertTriangle, CheckCircle,
  Clock, Activity, Key, QrCode, Download, Loader, X,
  Save, RotateCcw, UserCheck, UserX, Settings, Copy
} from 'lucide-react';

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  mfa_enabled: boolean;
  is_locked: boolean;
  created_at: string;
  last_activity: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: any;
  is_system_role: boolean;
  created_at: string;
}

interface AuditLog {
  id: number;
  admin_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  created_at: string;
}

interface MfaSetupData {
  secret: string;
  qr_url: string;
  backup_codes: string[];
}

const AdminTeam: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentTab, setCurrentTab] = useState<'admins' | 'roles' | 'audit'>('admins');
  
  // Modal states
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showRoleDetails, setShowRoleDetails] = useState(false);
  const [showEditAdmin, setShowEditAdmin] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [mfaSetupData, setMfaSetupData] = useState<MfaSetupData | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [showMfaToken, setShowMfaToken] = useState(false);

  // Form states
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role_id: ''
  });

  const [editAdminForm, setEditAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    role_id: ''
  });

  // Update the roleForm permissions structure to match the backend
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: {
      users: { read: false, write: false, delete: false },
      groups: { read: false, write: false, delete: false },
      analytics: { read: false, export: false },
      approvals: { read: false, approve: false, reject: false },
      support: { read: false, respond: false },
      team: { read: false, write: false, delete: false },
      payouts: { read: false, approve: false, reject: false },
      audit: { read: false },
      settings: { read: false, write: false },
      financial: { read: false, write: false, approve: false },
      content: { read: false, write: false, delete: false },
      security: { read: false, write: false, configure: false }
    }
  });

  const [editRoleForm, setEditRoleForm] = useState({
    name: '',
    description: '',
    permissions: {
      users: { read: false, write: false, delete: false },
      groups: { read: false, write: false, delete: false },
      analytics: { read: false, export: false },
      approvals: { read: false, approve: false, reject: false },
      support: { read: false, respond: false },
      team: { read: false, write: false, delete: false },
      payouts: { read: false, approve: false, reject: false },
      audit: { read: false },
      settings: { read: false, write: false }
    }
  });

  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [mfaSubmitting, setMfaSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (currentTab === 'admins') {
        const [adminsRes, rolesRes] = await Promise.all([
          adminAPI.getTeam(),
          adminAPI.getRoles()
        ]);
        setAdmins(adminsRes.data.admins || []);
        setRoles(rolesRes.data || []);
      } else if (currentTab === 'roles') {
        const rolesRes = await adminAPI.getRoles();
        setRoles(rolesRes.data || []);
      } else if (currentTab === 'audit') {
        const auditRes = await adminAPI.getAuditLogs();
        setAuditLogs(auditRes.data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to load roles for modals
  const loadRolesForModal = async () => {
    try {
      const rolesRes = await adminAPI.getRoles();
      setRoles(rolesRes.data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminAPI.createAdmin(adminForm);
      setShowAddAdmin(false);
      setAdminForm({ name: '', email: '', password: '', phone: '', role_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating admin:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Enhanced handleAddRole function with better validation and user feedback
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate role name
    if (!roleForm.name.trim()) {
      alert('Role name is required');
      return;
    }
    
    // Check if role name already exists
    const existingRole = roles.find(r => r.name.toLowerCase() === roleForm.name.toLowerCase());
    if (existingRole) {
      alert('A role with this name already exists');
      return;
    }
    
    // Validate that at least one permission is selected
    const hasPermissions = Object.values(roleForm.permissions).some(resource => 
      Object.values(resource as any).some(Boolean)
    );
    
    if (!hasPermissions) {
      alert('Please select at least one permission for this role');
      return;
    }
    
    try {
      setSubmitting(true);
      await adminAPI.createRole(roleForm);
      setShowAddRole(false);
      
      // Reset form
      setRoleForm({
        name: '',
        description: '',
        permissions: {
          users: { read: false, write: false, delete: false },
          groups: { read: false, write: false, delete: false },
          analytics: { read: false, export: false },
          approvals: { read: false, approve: false, reject: false },
          support: { read: false, respond: false },
          team: { read: false, write: false, delete: false },
          payouts: { read: false, approve: false, reject: false },
          audit: { read: false },
          settings: { read: false, write: false },
          financial: { read: false, write: false, approve: false },
          content: { read: false, write: false, delete: false },
          security: { read: false, write: false, configure: false }
        }
      });
      
      // Show success message
      alert('Role created successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error creating role:', error);
      alert(`Error creating role: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    
    try {
      setSubmitting(true);
      await adminAPI.updateAdminRole(selectedAdmin.id, {
        name: editAdminForm.name,
        email: editAdminForm.email,
        phone: editAdminForm.phone,
        role_id: editAdminForm.role_id
      });
      setShowEditAdmin(false);
      setSelectedAdmin(null);
      fetchData();
    } catch (error) {
      console.error('Error updating admin:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    try {
      setSubmitting(true);
      await adminAPI.updateRole(selectedRole.id, editRoleForm);
      setShowEditRole(false);
      setSelectedRole(null);
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;
    
    try {
      setSubmitting(true);
      await adminAPI.deleteRole(roleId);
      fetchData();
    } catch (error) {
      console.error('Error deleting role:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdminRole = async (adminId: number, roleId: number) => {
    try {
      setSubmitting(true);
      await adminAPI.updateAdminRole(adminId, { role_id: roleId });
      fetchData();
    } catch (error) {
      console.error('Error updating admin role:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLockAdmin = async (adminId: number, lock: boolean) => {
    try {
      setSubmitting(true);
      // Add this endpoint to your backend if it doesn't exist
      await adminAPI.lockAdmin(adminId, { locked: lock });
      fetchData();
    } catch (error) {
      console.error('Error updating admin lock status:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMfaSetup = async (adminId: number) => {
    try {
      const response = await adminAPI.setupMfa();
      setMfaSetupData(response.data);
      setSelectedAdmin(admins.find(a => a.id === adminId) || null);
      setShowMfaSetup(true);
    } catch (error) {
      console.error('Error setting up MFA:', error);
    }
  };

  const handleMfaVerify = async () => {
    if (!mfaToken) return;
    
    try {
      setMfaSubmitting(true);
      await adminAPI.verifyMfa({ token: mfaToken });
      setShowMfaSetup(false);
      setMfaToken('');
      setMfaSetupData(null);
      setSelectedAdmin(null);
      fetchData();
    } catch (error) {
      console.error('Error verifying MFA:', error);
    } finally {
      setMfaSubmitting(false);
    }
  };

  const openEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setEditAdminForm({
      name: admin.name,
      email: admin.email,
      phone: '', // You might want to add phone to the Admin interface
      role_id: roles.find(r => r.name === admin.role)?.id.toString() || ''
    });
    setShowEditAdmin(true);
  };

  const openEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setShowEditRole(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(search.toLowerCase()) ||
    admin.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Update the Add Admin button click handler
  const handleAddAdminClick = () => {
    loadRolesForModal(); // Load roles when opening the modal
    setShowAddAdmin(true);
  };

  // Update the Add Role button click handler
  const handleAddRoleClick = () => {
    // Reset form to default state
    setRoleForm({
      name: '',
      description: '',
      permissions: {
        users: { read: false, write: false, delete: false },
        groups: { read: false, write: false, delete: false },
        analytics: { read: false, export: false },
        approvals: { read: false, approve: false, reject: false },
        support: { read: false, respond: false },
        team: { read: false, write: false, delete: false },
        payouts: { read: false, approve: false, reject: false },
        audit: { read: false },
        settings: { read: false, write: false },
        financial: { read: false, write: false, approve: false },
        content: { read: false, write: false, delete: false },
        security: { read: false, write: false, configure: false }
      }
    });
    setShowAddRole(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600 mt-2">Manage admin team and role-based access control</p>
        </div>
        <div className="flex gap-3">
          {currentTab === 'admins' && (
            <button
              onClick={handleAddAdminClick} // Use the new handler
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <UserPlus className="w-4 h-4" />
              Add Admin
            </button>
          )}
          {currentTab === 'roles' && (
            <button
              onClick={handleAddRoleClick} // Use the new handler
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Role
            </button>
          )}
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">Security Features Enabled</h3>
            <p className="text-blue-700 text-sm">MFA, Audit Logging, Least Privilege Access Control</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setCurrentTab('admins')}
          className={`px-6 py-3 font-medium transition ${
            currentTab === 'admins'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Admins ({admins.length})
        </button>
        <button
          onClick={() => setCurrentTab('roles')}
          className={`px-6 py-3 font-medium transition ${
            currentTab === 'roles'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Roles ({roles.length})
        </button>
        <button
          onClick={() => setCurrentTab('audit')}
          className={`px-6 py-3 font-medium transition ${
            currentTab === 'audit'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Audit Logs
        </button>
      </div>

      {/* Search */}
      {currentTab === 'admins' && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search admins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {currentTab === 'admins' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Security
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {admin.role || 'No Role'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {admin.mfa_enabled ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            MFA Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            MFA Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.is_locked ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <Unlock className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.last_activity ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(admin.last_activity).toLocaleDateString()}
                        </div>
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEditAdmin(admin)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Admin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleMfaSetup(admin.id)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Setup MFA"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        {admin.is_locked ? (
                          <button 
                            onClick={() => handleLockAdmin(admin.id, false)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Unlock Account"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleLockAdmin(admin.id, true)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Lock Account"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentTab === 'roles' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setShowRoleDetails(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!role.is_system_role && (
                    <>
                      <button 
                        onClick={() => openEditRole(role)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {role.is_system_role && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    System Role
                  </span>
                </div>
              )}
              
              <div className="space-y-2">
                {Object.entries(role.permissions).map(([resource, actions]) => (
                  <div key={resource} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{resource}</span>
                    <div className="flex gap-1">
                      {Object.entries(actions as any).map(([action, enabled]) => (
                        <span
                          key={action}
                          className={`w-2 h-2 rounded-full ${
                            enabled ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          title={`${action}: ${enabled ? 'Allowed' : 'Denied'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentTab === 'audit' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.admin_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                        log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-800' :
                        log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.resource_type} {log.resource_id && `#${log.resource_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Admin</h2>
              <button
                onClick={() => setShowAddAdmin(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm({...adminForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={12}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 12 characters with uppercase, lowercase, number, and special character
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={adminForm.role_id}
                  onChange={(e) => setAdminForm({...adminForm, role_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
                {roles.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No roles available. Please create roles first.
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting || roles.length === 0}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Add Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAdmin(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditAdmin && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Admin</h2>
              <button
                onClick={() => setShowEditAdmin(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editAdminForm.name}
                  onChange={(e) => setEditAdminForm({...editAdminForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editAdminForm.email}
                  onChange={(e) => setEditAdminForm({...editAdminForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editAdminForm.phone}
                  onChange={(e) => setEditAdminForm({...editAdminForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editAdminForm.role_id}
                  onChange={(e) => setEditAdminForm({...editAdminForm, role_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Update Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditAdmin(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Role</h2>
              <button
                onClick={() => setShowAddRole(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddRole} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., content_manager, support_specialist"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use lowercase with underscores (e.g., content_manager)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this role can do..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Select at least one permission)</span>
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(roleForm.permissions).map(([resource, actions]) => (
                    <div key={resource} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 capitalize mb-3">
                        {resource === 'kyc' ? 'KYC Management' :
                         resource === 'financial' ? 'Financial Operations' :
                         resource === 'content' ? 'Content Management' :
                         resource === 'security' ? 'Security & Compliance' :
                         resource}
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(actions as any).map(([action, enabled]) => (
                          <label key={action} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => setRoleForm({
                                ...roleForm,
                                permissions: {
                                  ...roleForm.permissions,
                                  [resource]: {
                                    ...roleForm.permissions[resource as keyof typeof roleForm.permissions],
                                    [action]: e.target.checked
                                  }
                                }
                              })}
                              className="mr-2"
                            />
                            <span className="text-sm capitalize">
                              {action === 'configure' ? 'Configure' :
                               action === 'export' ? 'Export Data' :
                               action}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting || !roleForm.name.trim()}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Create Role'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddRole(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRole && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Role: {selectedRole.name}</h2>
              <button
                onClick={() => setShowEditRole(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditRole} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={editRoleForm.name}
                  onChange={(e) => setEditRoleForm({...editRoleForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editRoleForm.description}
                  onChange={(e) => setEditRoleForm({...editRoleForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(editRoleForm.permissions).map(([resource, actions]) => (
                    <div key={resource} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 capitalize mb-3">{resource}</h4>
                      <div className="space-y-2">
                        {Object.entries(actions as any).map(([action, enabled]) => (
                          <label key={action} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => setEditRoleForm({
                                ...editRoleForm,
                                permissions: {
                                  ...editRoleForm.permissions,
                                  [resource]: {
                                    ...editRoleForm.permissions[resource as keyof typeof editRoleForm.permissions],
                                    [action]: e.target.checked
                                  }
                                }
                              })}
                              className="mr-2"
                            />
                            <span className="text-sm capitalize">{action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Update Role'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditRole(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MFA Setup Modal */}
      {showMfaSetup && mfaSetupData && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Setup MFA for {selectedAdmin.name}</h2>
              <button
                onClick={() => setShowMfaSetup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <img 
                    src={mfaSetupData.qr_url} 
                    alt="QR Code" 
                    className="mx-auto w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Scan this QR code with your authenticator app
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Key
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showMfaToken ? "text" : "password"}
                    value={mfaSetupData.secret}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMfaToken(!showMfaToken)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    {showMfaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(mfaSetupData.secret)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Backup Codes
                </label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {mfaSetupData.backup_codes.map((code, index) => (
                      <div key={index} className="font-mono text-gray-700">{code}</div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(mfaSetupData.backup_codes.join('\n'))}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy all codes
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Save these backup codes in a secure location
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verify Setup
                </label>
                <input
                  type="text"
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  placeholder="Enter 6-digit code from your app"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleMfaVerify}
                  disabled={mfaSubmitting || mfaToken.length !== 6}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {mfaSubmitting ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Verify & Complete'}
                </button>
                <button
                  onClick={() => setShowMfaSetup(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeam;