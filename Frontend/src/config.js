// Application Configuration
// Admin Portal - connects to Employee Portal

export const APP_CONFIG = {
  name: 'Employee Travel Portal',
  version: '1.0.0',
  type: 'admin', // 'admin' or 'employee'
  
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || '',
    timeout: 30000,
    retries: 3,
  },
  
  // Feature Flags
  features: {
    realTimeUpdates: true,
    documentUpload: true,
    riskAlerts: true,
    analytics: true,
    multiCurrency: false, // Future feature
    approvalWorkflow: true,
  },
  
  // UI Configuration
  ui: {
    theme: 'light',
    dateFormat: 'MMM dd, yyyy',
    currency: 'USD',
    currencySymbol: '$',
    itemsPerPage: 20,
  },
  
  // Status configurations
  tripStatuses: [
    { id: 'pending', label: 'Pending', color: '#f59e0b', bgColor: '#fef3c7' },
    { id: 'approved', label: 'Approved', color: '#10b981', bgColor: '#d1fae5' },
    { id: 'rejected', label: 'Rejected', color: '#ef4444', bgColor: '#fee2e2' },
    { id: 'active', label: 'Active', color: '#6366f1', bgColor: '#e0e7ff' },
    { id: 'completed', label: 'Completed', color: '#64748b', bgColor: '#f1f5f9' },
  ],
  
  expenseCategories: [
    { id: 'airfare', label: 'Airfare', icon: '✈️', color: '#6366f1' },
    { id: 'hotel', label: 'Hotel', icon: '🏨', color: '#f59e0b' },
    { id: 'car', label: 'Car Rental', icon: '🚗', color: '#10b981' },
    { id: 'meals', label: 'Meals', icon: '🍽️', color: '#ec4899' },
    { id: 'transport', label: 'Transport', icon: '🚕', color: '#06b6d4' },
    { id: 'other', label: 'Other', icon: '📋', color: '#64748b' },
  ],
  
  documentTypes: [
    { id: 'passport', label: 'Passport', icon: '🛂', color: '#6366f1' },
    { id: 'visa', label: 'Visa', icon: '📋', color: '#8b5cf6' },
    { id: 'vaccine', label: 'Vaccine Certificate', icon: '💉', color: '#10b981' },
    { id: 'insurance', label: 'Travel Insurance', icon: '🛡️', color: '#f59e0b' },
    { id: 'id_card', label: 'ID Card', icon: '🪪', color: '#06b6d4' },
    { id: 'other', label: 'Other', icon: '📄', color: '#64748b' },
  ],
  
  riskLevels: [
    { id: 'low', label: 'Low', color: '#10b981', bgColor: '#d1fae5' },
    { id: 'medium', label: 'Medium', color: '#f59e0b', bgColor: '#fef3c7' },
    { id: 'high', label: 'High', color: '#ef4444', bgColor: '#fee2e2' },
    { id: 'critical', label: 'Critical', color: '#7c2d12', bgColor: '#fecaca' },
  ],
  
  userRoles: [
    { id: 'employee', label: 'Employee', permissions: ['view_own', 'create_trip', 'submit_expense'] },
    { id: 'manager', label: 'Manager', permissions: ['view_team', 'approve_trip', 'view_reports'] },
    { id: 'finance', label: 'Finance', permissions: ['view_all', 'manage_expenses', 'generate_reports'] },
    { id: 'admin', label: 'Admin', permissions: ['full_access'] },
  ],
};

// Helper functions
export function getStatusConfig(status) {
  return APP_CONFIG.tripStatuses.find(s => s.id === status) || APP_CONFIG.tripStatuses[0];
}

export function getCategoryConfig(category) {
  return APP_CONFIG.expenseCategories.find(c => c.id === category?.toLowerCase()) || APP_CONFIG.expenseCategories[5];
}

export function getDocTypeConfig(type) {
  return APP_CONFIG.documentTypes.find(t => t.id === type) || APP_CONFIG.documentTypes[5];
}

export function getRiskConfig(level) {
  return APP_CONFIG.riskLevels.find(r => r.id === level?.toLowerCase()) || APP_CONFIG.riskLevels[0];
}

export function formatCurrency(amount) {
  return `${APP_CONFIG.ui.currencySymbol}${Number(amount || 0).toLocaleString()}`;
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default APP_CONFIG;
