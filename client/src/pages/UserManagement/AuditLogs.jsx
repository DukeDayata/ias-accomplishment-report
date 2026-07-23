import React, { useState, useEffect } from 'react';
import { Search, History } from 'lucide-react';
import api from '../../lib/axios';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [selectedEntity, setSelectedEntity] = useState('All');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auditlogs?limit=500');
      setLogs(res.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const sQuery = searchQuery.toLowerCase();
    const userName = log.userId ? `${log.userId.firstName} ${log.userId.lastName}`.toLowerCase() : '';
    const userEmail = log.userId ? log.userId.email.toLowerCase() : '';
    const matchesSearch = userName.includes(sQuery) || userEmail.includes(sQuery) || log.action.toLowerCase().includes(sQuery);
    
    const matchesAction = selectedAction === 'All' || log.action === selectedAction;
    const matchesEntity = selectedEntity === 'All' || log.entityType === selectedEntity;

    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Filter Bar */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="text-gov-blue" size={20} />
            System Audit Logs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search User</label>
            <input 
              type="text" 
              placeholder="Search by name, email, or action..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action Filter</label>
            <select 
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none appearance-none bg-white"
            >
              <option value="All">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="UPSERT">UPSERT</option>
              <option value="UPDATE_STATUS">UPDATE_STATUS</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Entity Filter</label>
            <select 
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none appearance-none bg-white"
            >
              <option value="All">All Entities</option>
              <option value="User">User</option>
              <option value="AccomplishmentEntry">AccomplishmentEntry</option>
              <option value="Report">Report</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card rounded-2xl flex-1 flex flex-col min-h-[400px]">
        <div className="p-5 border-b border-slate-200/60 bg-white/50 rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Showing {filteredLogs.length} logs</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity Type</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue mx-auto mb-3"></div>
                    Loading audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    No logs found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800">
                      <div className="font-semibold">{log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'System / Unknown'}</div>
                      <div className="text-xs text-slate-500">{log.userId?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-extrabold uppercase rounded shadow-sm ${
                        log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                        log.action === 'UPDATE' || log.action === 'UPSERT' || log.action === 'UPDATE_STATUS' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {log.entityType}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-sm truncate" title={JSON.stringify(log.newValue || log.previousValue)}>
                      {log.newValue ? 
                        (log.action === 'UPDATE_STATUS' ? `Status changed to ${log.newValue.status}` : 'Updated document') : 
                        (log.action === 'LOGIN' ? `IP: ${log.ipAddress}` : 'Document modified/deleted')
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
