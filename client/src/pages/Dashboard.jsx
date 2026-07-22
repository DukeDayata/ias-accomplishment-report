import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Target, TrendingUp, FileSpreadsheet, Activity, Clock } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();

  const [stats, setStats] = useState({
    totalAccomplishments: 0,
    byCategory: [],
    trend: [],
    byRegion: [],
    recentSubmissions: [],
    previousYearTotal: 0,
    reports: [],
    indicators: [],
    category7Activities: [],
    topIndicators: [],
    totalTarget: 0
  });

  const [regions, setRegions] = useState([]);
  const [adminSelectedRegion, setAdminSelectedRegion] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const COLORS = ['#0038A8', '#FFC72C', '#D22630', '#002B80', '#0E59F2', '#D99B00', '#1F2937', '#10B981', '#8B5CF6', '#F43F5E'];
  const isAdmin = user?.role?.startsWith('IAS');

  useEffect(() => {
    fetchDashboardData();
  }, [user, adminSelectedRegion]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      let fetchRegionId = null;
      if (!isAdmin) {
        fetchRegionId = user?.regionId?._id || user?.regionId || user?.region?._id || user?.region;
      } else if (adminSelectedRegion !== 'All') {
        fetchRegionId = adminSelectedRegion;
      }

      const url = fetchRegionId
        ? `/accomplishments?regionId=${fetchRegionId}&reportingYear=${currentYear}`
        : `/accomplishments?reportingYear=${currentYear}`;

      const summaryUrl = fetchRegionId
        ? `/accomplishments/summary?regionId=${fetchRegionId}&reportingYear=${currentYear - 1}`
        : `/accomplishments/summary?reportingYear=${currentYear - 1}`;

      const reportsUrl = `/reports?reportingYear=${currentYear}`;

      const [accRes, catsRes, regionsRes, summaryRes, reportsRes, indsRes] = await Promise.all([
        api.get(url),
        api.get('/categories'),
        api.get('/regions'),
        api.get(summaryUrl),
        api.get(reportsUrl),
        api.get('/indicators')
      ]);

      let data = accRes.data;
      const categories = catsRes.data;
      const allRegions = regionsRes.data;
      const previousYearTotal = summaryRes.data.totalAccomplishments || 0;
      const reports = reportsRes.data;
      const indicators = indsRes.data;

      if (isAdmin && regions.length === 0) {
        setRegions(allRegions);
      }

      const totalAccomplishments = data.reduce((sum, item) => sum + (item.actual || 0), 0);

      const catMap = {};
      categories.forEach(c => catMap[String(c._id)] = { name: c.categoryName, value: 0 });
      data.forEach(item => {
        let catId = item.categoryId?._id || item.categoryId || item.indicatorId?.categoryId?._id || item.indicatorId?.categoryId;
        if (catId) {
          catId = String(catId);
          if (catMap[catId]) catMap[catId].value += (item.actual || 0);
        }
      });
      const byCategory = Object.values(catMap).filter(c => c.value > 0);

      const monthMap = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthNames.forEach((m, idx) => monthMap[idx] = { name: m, Accomplishments: 0 });
      data.forEach(item => {
        let mIdx = null;
        if (item.reportType === 'activity' && item.startDate) {
          mIdx = new Date(item.startDate).getMonth();
        } else if (item.monthIndex !== undefined && item.monthIndex !== null) {
          mIdx = item.monthIndex;
        }

        if (mIdx !== null && monthMap[mIdx]) {
          monthMap[mIdx].Accomplishments += (item.actual || 0);
        }
      });
      const trend = Object.values(monthMap);

      const regionMap = {};
      allRegions.forEach(r => regionMap[r._id] = { name: r.shortName || r.regionName, value: 0 });
      data.forEach(item => {
        const rId = item.regionId?._id || item.regionId;
        if (rId && regionMap[rId]) regionMap[rId].value += (item.actual || 0);
      });
      const byRegion = Object.values(regionMap)
        .filter(r => r.value > 0)
        .sort((a, b) => b.value - a.value);

      const recentSubmissions = data.slice(0, 10).map(item => {
        const rId = item.regionId?._id || item.regionId;
        const reg = allRegions.find(r => r._id === rId);
        const displayName = item.reportType === 'activity' ? item.activityTitle : item.indicatorId?.indicatorName;
        return {
          ...item,
          displayName,
          regionName: reg ? (reg.shortName || reg.regionName) : 'Unknown',
          date: new Date(item.createdAt || Date.now()).toLocaleDateString()
        };
      });

      const category7Activities = data
        .filter(item => item.reportType === 'activity')
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        .slice(0, 5)
        .map(item => {
          const rId = item.regionId?._id || item.regionId;
          return {
            ...item,
            regionName: allRegions.find(r => r._id === rId)?.shortName || 'Unknown'
          };
        });

      const indMap = {};
      indicators.forEach(i => indMap[i._id] = { name: i.indicatorName, value: 0 });
      data.forEach(item => {
        const iId = item.indicatorId?._id || item.indicatorId;
        if (iId && indMap[iId]) indMap[iId].value += (item.actual || 0);
      });
      const topIndicators = Object.values(indMap)
        .filter(i => i.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const totalTarget = indicators.reduce((sum, ind) => sum + (ind.annualTarget || 100), 0);

      setStats({
        totalAccomplishments,
        byCategory,
        trend,
        byRegion,
        recentSubmissions,
        previousYearTotal,
        reports,
        indicators,
        category7Activities,
        topIndicators,
        totalTarget
      });

    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && stats.trend.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="glass-card p-6 rounded-2xl bg-gov-blue-light/30 border-gov-blue/20 flex-1 w-full">
          <h2 className="text-2xl font-black text-gov-blue">Welcome back, {user?.firstName}! 👋</h2>
          <p className="text-slate-600 mt-1 font-medium">
            {isAdmin
              ? 'Here is an overview of the national accomplishment reports.'
              : `Here is the performance overview for ${user?.region?.regionName || 'your region'}.`}
          </p>
        </div>

        {isAdmin && (
          <div className="glass-card p-4 rounded-2xl w-full md:w-auto shadow-sm">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">View Data For:</label>
            <select
              value={adminSelectedRegion}
              onChange={(e) => setAdminSelectedRegion(e.target.value)}
              className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-gov-blue outline-none appearance-none bg-slate-50 text-slate-800 min-w-[200px]"
            >
              <option value="All">All Regions (National)</option>
              {regions.map(r => (
                <option key={r._id} value={r._id}>{r.regionName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center hover:-translate-y-0.5 transition-all duration-300 hover:shadow-md relative overflow-hidden">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-gov-blue-light/50 p-3 rounded-lg text-gov-blue"><TrendingUp size={24} /></div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Accomplishments</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-slate-800">{stats.totalAccomplishments.toLocaleString()}</p>
                {stats.previousYearTotal > 0 && (
                  <span className={`text-xs font-bold ${stats.totalAccomplishments >= stats.previousYearTotal ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.totalAccomplishments >= stats.previousYearTotal ? '▲' : '▼'}
                    {Math.abs(Math.round(((stats.totalAccomplishments - stats.previousYearTotal) / stats.previousYearTotal) * 100))}% YoY
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center hover:-translate-y-0.5 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-purple-100/50 p-3 rounded-lg text-purple-700"><Target size={24} /></div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target vs Actual</h3>
              <p className="text-xl font-black text-slate-800">
                {stats.totalAccomplishments.toLocaleString()} <span className="text-sm font-medium text-slate-500">/ {stats.totalTarget.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-purple-600 h-2.5 rounded-full"
              style={{ width: `${Math.min((stats.totalAccomplishments / (stats.totalTarget || 1)) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-right font-bold">
            {Math.round((stats.totalAccomplishments / (stats.totalTarget || 1)) * 100)}% Achieved
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-md">
          <div className="bg-gov-gold/20 p-3 rounded-lg text-gov-gold-dark"><Clock size={24} /></div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reporting Year</h3>
            <p className="text-3xl font-black text-slate-800">{currentYear}</p>
          </div>
        </div>
      </div>

      {isAdmin && adminSelectedRegion === 'All' && (
        <div className="glass-card p-6 rounded-2xl hover:-translate-y-0.5 transition-all duration-300 hover:shadow-md">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><FileSpreadsheet size={16} className="text-gov-blue" /> Regional Submission Compliance (Q1-Q4)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 px-4 text-xs font-bold text-slate-500 uppercase">Region</th>
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <th key={q} className="py-2 px-4 text-xs font-bold text-slate-500 uppercase text-center">{q}</th>)}
                </tr>
              </thead>
              <tbody>
                {regions.map(region => (
                  <tr key={region._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-semibold text-slate-700">{region.shortName || region.regionName}</td>
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                      const rep = stats.reports.find(r => r.regionId?._id === region._id && r.quarter === parseInt(q.replace('Q', '')));
                      let badge = <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded font-semibold">Pending</span>;
                      if (rep) {
                        if (rep.status === 'Submitted to IAS') badge = <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">Submitted</span>;
                        else if (rep.status === 'IAS Approved') badge = <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">Approved</span>;
                        else badge = <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-semibold">{rep.status}</span>;
                      }
                      return <td key={q} className="py-3 px-4 text-center">{badge}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl hover:-translate-y-0.5 transition-all duration-300 hover:shadow-md relative">
          {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl"></div>}
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity size={16} className="text-gov-blue" /> Accomplishments Trend ({currentYear})</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0038A8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0038A8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  itemStyle={{ color: '#0038A8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="Accomplishments" stroke="#0038A8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAcc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {isAdmin && adminSelectedRegion === 'All' ? (
          <div className="glass-card p-6 rounded-2xl hover:-translate-y-0.5 transition-all duration-300 hover:shadow-md relative">
            {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl"></div>}
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2"><Target size={16} className="text-gov-gold-dark" /> Top 5 Performing Indicators</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topIndicators} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={180} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  />
                  <Bar dataKey="value" name="Accomplishments" radius={[0, 4, 4, 0]}>
                    {stats.topIndicators.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-2xl hover:-translate-y-0.5 transition-all duration-300 hover:shadow-md relative">
            {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl"></div>}
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2"><Target size={16} className="text-gov-gold-dark" /> Accomplishments by Category</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={150} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  />
                  <Bar dataKey="value" name="Accomplishments" radius={[0, 4, 4, 0]}>
                    {stats.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="glass-card p-6 rounded-2xl relative flex flex-col">
          {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl"></div>}
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={16} className="text-gov-gold-dark" /> Category 7: Other Activities Highlights</h3>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[300px]">
            {stats.category7Activities.length > 0 ? (
              stats.category7Activities.map((act, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">
                      {isAdmin ? act.regionName : `Week ${act.weekNumber || '-'}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{act.startDate ? new Date(act.startDate).toLocaleDateString() : '-'}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 line-clamp-1 leading-snug mt-1.5">
                    {act.activityTitle}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {act.activityDescription}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                No recent Category 7 activities.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl relative flex flex-col">
          {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl"></div>}
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={16} className="text-purple-600" /> Recent Submissions</h3>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[300px]">
            {stats.recentSubmissions.length > 0 ? (
              stats.recentSubmissions.map((sub, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">
                      {isAdmin ? sub.regionName : `Week ${sub.weekNumber || '-'}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{sub.date}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-snug mt-1.5">
                    {sub.displayName || '-'}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">Added <strong className="text-gov-blue">{sub.actual}</strong> to actual</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${sub.status === 'Submitted to IAS' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                No recent activity.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
