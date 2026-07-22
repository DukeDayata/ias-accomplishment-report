import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Target, TrendingUp, FileSpreadsheet, Activity, Clock, Zap, LayoutGrid, Calendar, Award, FileText } from 'lucide-react';

// Custom Progress Ring Component for the "Target vs Actual" Card
const ProgressRing = ({ radius, stroke, progress, colorClass }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Ensure progress is bounded between 0 and 100
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 drop-shadow-sm">
        <circle
          stroke="#E2E8F0"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={colorClass}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black text-slate-800">{Math.round(safeProgress)}%</span>
        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Achieved</span>
      </div>
    </div>
  );
};

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
  
  // Standard brand color palette for charts
  const COLORS = ['#0F4C81', '#E5A726', '#D22630', '#0a3356', '#1a68b0', '#b8861e', '#15803D', '#D97706'];
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
      <div className="flex flex-col items-center justify-center h-[70vh] text-indigo-500 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
        </div>
        <p className="font-bold text-lg animate-pulse">Initializing Dashboard Workspace...</p>
      </div>
    );
  }

  const progressPercentage = (stats.totalAccomplishments / (stats.totalTarget || 1)) * 100;

  return (
    <div className="space-y-8 pb-12 overflow-x-hidden">
      
      {/* Dynamic Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gov-blue-dark via-gov-blue to-gov-blue-accent p-8 md:p-10 text-white premium-shadow animate-fade-in-up">
        {/* Decorative Floating Elements */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-20 w-40 h-40 bg-gov-gold opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-white flex items-center gap-3">
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-gov-blue-light/90 font-medium text-lg max-w-xl leading-relaxed">
              {isAdmin
                ? 'Here is your national accomplishment command center. Monitor performance across all CHED regions instantly.'
                : `Here's a quick look at how ${user?.region?.regionName || 'your region'} is tracking this year. Keep up the excellent work!`}
            </p>
          </div>

          {isAdmin && (
            <div className="glass-card p-5 rounded-2xl w-full md:w-auto bg-white/10 border-white/20 backdrop-blur-md">
              <label className="block text-[11px] font-black text-gov-blue-light uppercase tracking-widest mb-2 flex items-center gap-2">
                <LayoutGrid size={14} /> View Data For Region
              </label>
              <select
                value={adminSelectedRegion}
                onChange={(e) => setAdminSelectedRegion(e.target.value)}
                className="w-full border-0 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-gov-blue-light/30 outline-none appearance-none bg-white text-gov-blue-dark min-w-[220px] shadow-inner transition-all cursor-pointer"
              >
                <option value="All">All Regions (National Overview)</option>
                {regions.map(r => (
                  <option key={r._id} value={r._id}>{r.regionName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Total Accomplishments */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-center hover:-translate-y-1 transition-all duration-300 premium-shadow relative overflow-hidden group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute -right-6 -top-6 text-gov-blue-light/30 opacity-50 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp size={120} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gov-blue-light/60 text-gov-blue p-2.5 rounded-xl"><Zap size={20} /></div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Accomplishments</h3>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-5xl font-black text-slate-800 tracking-tight gradient-text bg-gradient-to-r from-gov-blue-dark to-gov-blue">
                {stats.totalAccomplishments.toLocaleString()}
              </p>
              {stats.previousYearTotal > 0 && (
                <div className={`flex items-center gap-1.5 mt-2 text-xs font-bold px-3 py-1 rounded-full w-fit ${stats.totalAccomplishments >= stats.previousYearTotal ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {stats.totalAccomplishments >= stats.previousYearTotal ? <TrendingUp size={14} /> : <TrendingUp size={14} className="transform rotate-180" />}
                  <span>{Math.abs(Math.round(((stats.totalAccomplishments - stats.previousYearTotal) / stats.previousYearTotal) * 100))}% YoY Growth</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Target vs Actual (Redesigned with Progress Ring) */}
        <div className="glass-card p-6 rounded-3xl hover:-translate-y-1 transition-all duration-300 premium-shadow relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-100 text-purple-700 p-2.5 rounded-xl"><Target size={20} /></div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Target vs Actual</h3>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-slate-800">{stats.totalAccomplishments.toLocaleString()}</p>
                <p className="text-sm font-bold text-slate-400 mt-1">of {stats.totalTarget.toLocaleString()} Target</p>
              </div>
            </div>
            
            <div className="flex-shrink-0 mt-2">
               <ProgressRing 
                 radius={50} 
                 stroke={10} 
                 progress={progressPercentage} 
                 colorClass="text-purple-600" 
               />
            </div>
          </div>
        </div>

        {/* KPI 3: Reporting Year */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-center hover:-translate-y-1 transition-all duration-300 premium-shadow relative overflow-hidden group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="absolute -right-6 -bottom-6 text-gov-gold/10 opacity-50 group-hover:rotate-12 transition-transform duration-500">
            <Calendar size={120} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gov-gold/20 text-gov-gold-dark p-2.5 rounded-xl"><Calendar size={20} /></div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Reporting Year</h3>
            </div>
            <p className="text-5xl font-black text-slate-800 tracking-tight mt-2">
              {currentYear}
            </p>
            <p className="text-xs font-bold text-slate-400 mt-3">Currently viewing data for the active year</p>
          </div>
        </div>
      </div>

      {/* Admin Regional Compliance Table */}
      {isAdmin && adminSelectedRegion === 'All' && (
        <div className="glass-card p-6 rounded-3xl premium-shadow animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-base font-black text-slate-800 mb-6 flex items-center gap-3">
            <div className="bg-gov-blue-light/60 p-2 rounded-lg text-gov-blue"><FileSpreadsheet size={18} /></div> 
            Regional Submission Compliance (Q1-Q4)
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Region</th>
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <th key={q} className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center border-b border-slate-100">{q}</th>)}
                </tr>
              </thead>
              <tbody>
                {regions.map(region => (
                  <tr key={region._id} className="border-b border-slate-50 last:border-0 hover:bg-gov-blue-light/20 transition-colors">
                    <td className="py-4 px-6 text-sm font-bold text-slate-700">{region.shortName || region.regionName}</td>
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                      const rep = stats.reports.find(r => r.regionId?._id === region._id && r.quarter === parseInt(q.replace('Q', '')));
                      let badge = <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">Pending</span>;
                      if (rep) {
                        if (rep.status === 'Submitted to IAS') badge = <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 shadow-sm shadow-blue-100">Submitted</span>;
                        else if (rep.status === 'IAS Approved') badge = <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-100">Approved</span>;
                        else badge = <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 shadow-sm shadow-purple-100">{rep.status}</span>;
                      }
                      return <td key={q} className="py-4 px-6 text-center">{badge}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Trend Chart */}
        <div className="glass-card p-6 rounded-3xl premium-shadow relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-3xl"></div>}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
              <div className="bg-gov-blue-light/60 p-2 rounded-lg text-gov-blue"><Activity size={18} /></div> 
              Accomplishments Trend ({currentYear})
            </h3>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} dx={-10} />
                <Tooltip
                  cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: '12px 16px' }}
                  itemStyle={{ color: '#0F4C81', fontWeight: '900', fontSize: '16px' }}
                  labelStyle={{ color: '#64748B', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="Accomplishments" stroke="#0F4C81" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" activeDot={{ r: 6, strokeWidth: 0, fill: '#0F4C81' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart (Top Indicators / By Category) */}
        {isAdmin && adminSelectedRegion === 'All' ? (
          <div className="glass-card p-6 rounded-3xl premium-shadow relative animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-3xl"></div>}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
                <div className="bg-gov-gold/20 p-2 rounded-lg text-gov-gold-dark"><FileText size={18} /></div> 
                Top 5 Performing Indicators
              </h3>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topIndicators} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} />
                  <YAxis dataKey="name" type="category" width={160} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: '12px 16px' }}
                    itemStyle={{ color: '#0F172A', fontWeight: '900', fontSize: '14px' }}
                  />
                  <Bar dataKey="value" name="Accomplishments" radius={[0, 6, 6, 0]}>
                    {stats.topIndicators.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-3xl premium-shadow relative animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-3xl"></div>}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
                <div className="bg-gov-gold/20 p-2 rounded-lg text-gov-gold-dark"><LayoutGrid size={18} /></div> 
                Accomplishments by Category
              </h3>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} />
                  <YAxis dataKey="name" type="category" width={160} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: '12px 16px' }}
                    itemStyle={{ color: '#0F172A', fontWeight: '900', fontSize: '14px' }}
                  />
                  <Bar dataKey="value" name="Accomplishments" radius={[0, 6, 6, 0]}>
                    {stats.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Feed / Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        
        {/* Category 7 Activities Feed */}
        <div className="glass-card p-6 rounded-3xl relative flex flex-col premium-shadow animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-3xl"></div>}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
              <div className="bg-gov-gold/20 p-2 rounded-lg text-gov-gold-dark"><FileText size={18} /></div> 
              Category 7 Highlights
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[350px]">
            {stats.category7Activities.length > 0 ? (
              stats.category7Activities.map((act, idx) => (
                <div key={idx} className="group p-4 bg-white rounded-2xl border border-slate-100 hover:border-gov-gold/50 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase text-gov-gold-dark bg-gov-gold/20 px-2.5 py-1 rounded-md tracking-wider">
                      {isAdmin ? act.regionName : `Week ${act.weekNumber || '-'}`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                      <Calendar size={12} /> {act.startDate ? new Date(act.startDate).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-800 line-clamp-1 leading-snug mt-2 group-hover:text-gov-blue transition-colors">
                    {act.activityTitle}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed font-medium">
                    {act.activityDescription}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 gap-3">
                <FileText size={32} className="opacity-20" />
                <p className="text-sm font-bold opacity-70">No recent Category 7 activities.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Submissions Feed */}
        <div className="glass-card p-6 rounded-3xl relative flex flex-col premium-shadow animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-3xl"></div>}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Clock size={18} /></div> 
              Live Submissions Feed
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[350px]">
            {stats.recentSubmissions.length > 0 ? (
              stats.recentSubmissions.map((sub, idx) => (
                <div key={idx} className="group p-4 bg-white rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md tracking-wider">
                      {isAdmin ? sub.regionName : `Week ${sub.weekNumber || '-'}`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                       {sub.date}
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-800 line-clamp-2 leading-snug mt-2 group-hover:text-purple-700 transition-colors">
                    {sub.displayName || '-'}
                  </p>
                  <div className="mt-3 flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                    <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Added <strong className="text-purple-600 text-sm">+{sub.actual}</strong>
                    </span>
                    <span className={`text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-widest ${sub.status === 'Submitted to IAS' ? 'bg-blue-100 text-blue-700' : sub.status === 'IAS Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {sub.status === 'Submitted to IAS' ? 'Submitted' : sub.status === 'IAS Approved' ? 'Approved' : sub.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 gap-3">
                <Clock size={32} className="opacity-20" />
                <p className="text-sm font-bold opacity-70">No recent activity found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
