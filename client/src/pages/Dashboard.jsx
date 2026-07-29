import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Target, TrendingUp, FileSpreadsheet, Activity, Clock, Zap, LayoutGrid, Calendar, Award, FileText, Layers, Table, BarChart3, Trophy, Search, Filter } from 'lucide-react';

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
    totalTarget: 0,
    sortedCategories: [],
    regional7CatMatrix: [],
    categorySummaries: []
  });

  const [regions, setRegions] = useState([]);
  const [adminSelectedRegion, setAdminSelectedRegion] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [comparisonViewMode, setComparisonViewMode] = useState('chart');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  const CATEGORY_COLORS = {
    'CAT-1': { main: '#0038A8', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'CAT-2': { main: '#0EA5E9', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    'CAT-3': { main: '#8B5CF6', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'CAT-4': { main: '#D97706', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'CAT-5': { main: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'CAT-6': { main: '#E11D48', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    'CAT-7': { main: '#4F46E5', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' }
  };

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
        .sort((a, b) => b.value - a.value)
        .slice(0, 7);

      const totalTarget = indicators.reduce((sum, ind) => sum + (ind.annualTarget || 100), 0);

      // 7-Category Regional Matrix Processing
      const sortedCategories = [...categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      const getCategoryForItem = (item) => {
        let cObj = item.categoryId;
        if (cObj && typeof cObj === 'object' && cObj.categoryCode) return cObj;
        let catId = item.categoryId?._id || item.categoryId;
        if (!catId && item.indicatorId) {
          catId = item.indicatorId.categoryId?._id || item.indicatorId.categoryId;
        }
        if (!catId) return null;
        const strId = String(catId);
        return categories.find(c => String(c._id) === strId || c.categoryCode === strId);
      };

      const regMatrixMap = {};
      const regional7CatMatrix = allRegions.map(r => {
        const row = {
          regionId: String(r._id),
          regionCode: r.regionCode,
          regionName: r.regionName,
          shortName: r.shortName || r.regionName,
          total: 0
        };
        sortedCategories.forEach(c => {
          row[c.categoryCode] = 0;
        });
        regMatrixMap[String(r._id)] = row;
        return row;
      });

      data.forEach(item => {
        const rId = String(item.regionId?._id || item.regionId);
        const cat = getCategoryForItem(item);
        const val = item.actual || 0;
        if (rId && regMatrixMap[rId] && cat && cat.categoryCode) {
          regMatrixMap[rId][cat.categoryCode] = (regMatrixMap[rId][cat.categoryCode] || 0) + val;
          regMatrixMap[rId].total += val;
        }
      });

      regional7CatMatrix.sort((a, b) => b.total - a.total);

      const categorySummaries = sortedCategories.map(c => {
        let catTotal = 0;
        let topRegionName = 'None';
        let topValue = 0;

        regional7CatMatrix.forEach(row => {
          const count = row[c.categoryCode] || 0;
          catTotal += count;
          if (count > topValue) {
            topValue = count;
            topRegionName = row.shortName;
          }
        });

        return {
          code: c.categoryCode,
          name: c.categoryName,
          description: c.description,
          total: catTotal,
          topRegionName,
          topValue
        };
      });

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
        totalTarget,
        sortedCategories,
        regional7CatMatrix,
        categorySummaries
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
          <div className="h-[450px] w-full">
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
                Performing Indicators
              </h3>
            </div>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topIndicators} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} />
                  <YAxis dataKey="name" type="category" width={240} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
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
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} />
                  <YAxis dataKey="name" type="category" width={240} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
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

      {/* Additional Admin Charts */}
      {isAdmin && adminSelectedRegion === 'All' && (
        <div className="space-y-8 mt-8">
          
          {/* Row 1: Regional Performance Comparison (Overall Total) & National Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Regional Performance Comparison (Overall Total) */}
            <div className="glass-card p-6 rounded-3xl premium-shadow relative animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-3xl"></div>}
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
                  <div className="bg-gov-blue-light/60 p-2 rounded-lg text-gov-blue"><Target size={18} /></div> 
                  Regional Performance Comparison (Overall Total)
                </h3>
              </div>
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byRegion} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} />
                    <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
                    <Tooltip
                      cursor={{ fill: '#F8FAFC' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: '12px 16px' }}
                      itemStyle={{ color: '#0F172A', fontWeight: '900', fontSize: '14px' }}
                    />
                    <Bar dataKey="value" name="Accomplishments" radius={[0, 6, 6, 0]}>
                      {stats.byRegion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution Donut */}
            <div className="glass-card p-4 sm:p-6 rounded-3xl premium-shadow relative animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-3xl"></div>}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><LayoutGrid size={18} /></div> 
                  National Category Distribution
                </h3>
              </div>
              <div className="min-h-[360px] sm:min-h-[420px] h-auto flex flex-col items-center justify-center pb-2">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={stats.byCategory}
                      cx="50%"
                      cy="48%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.byCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: '12px 16px' }}
                      itemStyle={{ color: '#0F172A', fontWeight: '900', fontSize: '14px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      content={({ payload }) => (
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-3 px-1 text-xs font-bold text-slate-600">
                          {payload?.map((entry, index) => {
                            const name = entry.value === 'Other Internationalization Activities and Accomplishments'
                              ? 'Other Internationalization Activities'
                              : entry.value;
                            return (
                              <div key={`donut-item-${index}`} className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></span>
                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 leading-tight truncate max-w-[160px] sm:max-w-none">{name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Row 2: Regional Performance Comparison (7 Categories Breakdown) */}
          <div className="glass-card p-6 md:p-8 rounded-3xl premium-shadow relative animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-3xl"></div>}

            {/* Header & Controls Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="bg-gov-blue p-2.5 rounded-xl text-white shadow-md shadow-gov-blue/20">
                    <Layers size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                      Regional Performance Breakdown (7 Categories)
                    </h3>
                    <p className="text-xs font-bold text-slate-500">
                      Multi-category comparative analysis across all 17 CHED Regional Offices
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Category Filter Dropdown */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border-0 outline-none cursor-pointer transition-all pr-8 appearance-none"
                  >
                    <option value="ALL">All 7 Categories (Stacked)</option>
                    <option value="TOTAL">Overall Total Accomplishments</option>
                    {stats.sortedCategories.map(c => (
                      <option key={c._id} value={c.categoryCode}>
                        {c.categoryCode}: {c.categoryName}
                      </option>
                    ))}
                  </select>
                  <Filter size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>

                {/* View Mode Switcher */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setComparisonViewMode('chart')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      comparisonViewMode === 'chart'
                        ? 'bg-white text-gov-blue shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BarChart3 size={14} /> Chart View
                  </button>
                  <button
                    onClick={() => setComparisonViewMode('matrix')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      comparisonViewMode === 'matrix'
                        ? 'bg-white text-gov-blue shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Table size={14} /> Matrix Table
                  </button>
                </div>
              </div>
            </div>

            {/* Category Performance Summary Cards Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 my-6">
              {stats.categorySummaries.map((catSummary) => {
                const colorInfo = CATEGORY_COLORS[catSummary.code] || { main: '#0F4C81', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
                const isSelected = selectedCategoryFilter === catSummary.code;

                return (
                  <button
                    key={catSummary.code}
                    onClick={() => setSelectedCategoryFilter(isSelected ? 'ALL' : catSummary.code)}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                      isSelected
                        ? 'ring-2 ring-gov-blue shadow-md scale-[1.02] bg-white'
                        : 'bg-white/60 hover:bg-white hover:shadow-sm border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${colorInfo.bg} ${colorInfo.text}`}>
                        {catSummary.code}
                      </span>
                      {catSummary.topValue > 0 && (
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full" title={`Top Performer: ${catSummary.topRegionName}`}>
                          <Trophy size={10} />
                          <span className="truncate max-w-[35px] sm:max-w-[45px]">{catSummary.topRegionName}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-600 truncate mb-1" title={catSummary.name}>
                      {catSummary.name}
                    </p>
                    <p className="text-base sm:text-lg font-black text-slate-800">
                      {catSummary.total.toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* View Mode 1: Chart View */}
            {comparisonViewMode === 'chart' && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {selectedCategoryFilter === 'ALL'
                      ? 'All 7 Categories Stacked Regional Breakdown'
                      : selectedCategoryFilter === 'TOTAL'
                      ? 'Overall Total Accomplishments by Region'
                      : `Regional Performance in ${stats.sortedCategories.find(c => c.categoryCode === selectedCategoryFilter)?.categoryName || selectedCategoryFilter}`}
                  </h4>
                  {selectedCategoryFilter !== 'ALL' && (
                    <button
                      onClick={() => setSelectedCategoryFilter('ALL')}
                      className="text-xs font-bold text-gov-blue hover:underline"
                    >
                      Reset to All Categories
                    </button>
                  )}
                </div>

                <div className="h-[600px] sm:h-[550px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedCategoryFilter === 'ALL' ? (
                      /* Stacked Multi-Category Bar Chart */
                      <BarChart
                        data={stats.regional7CatMatrix}
                        layout="vertical"
                        margin={{ top: 10, right: 15, left: -10, bottom: 10 }}
                        barSize={18}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }} />
                        <YAxis dataKey="shortName" type="category" width={75} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
                        <Tooltip
                          cursor={{ fill: '#F8FAFC' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const regionData = payload[0]?.payload;
                              const total = regionData?.total || 0;
                              return (
                                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 max-w-xs text-xs">
                                  <p className="font-black text-slate-800 text-sm mb-1">{regionData?.shortName} ({regionData?.regionCode})</p>
                                  <p className="text-slate-500 font-bold mb-3 pb-2 border-b border-slate-100 flex justify-between">
                                    <span>Total Accomplishments:</span>
                                    <span className="text-gov-blue font-black text-sm">{total.toLocaleString()}</span>
                                  </p>
                                  <div className="space-y-1.5">
                                    {stats.sortedCategories.map(cat => {
                                      const count = regionData?.[cat.categoryCode] || 0;
                                      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                      const color = CATEGORY_COLORS[cat.categoryCode]?.main || '#0F4C81';
                                      return (
                                        <div key={cat.categoryCode} className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                                            <span className="font-bold text-slate-700 truncate">{cat.categoryCode}: {cat.categoryName}</span>
                                          </div>
                                          <span className="font-black text-slate-800 flex-shrink-0">{count} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span></span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          content={({ payload }) => (
                            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mt-4 px-2 text-xs font-bold text-slate-600">
                              {payload?.map((entry, index) => {
                                const catCode = entry.value;
                                const cat = stats.sortedCategories.find(c => c.categoryCode === catCode);
                                const shortName = cat ? `${cat.categoryCode}: ${cat.categoryName}` : catCode;
                                const color = entry.color || CATEGORY_COLORS[catCode]?.main || '#0F4C81';
                                return (
                                  <div key={`cat-item-${index}`} className="flex items-center gap-1.5 min-w-0">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                                    <span className="text-[11px] font-bold text-slate-700 leading-tight truncate max-w-[200px] sm:max-w-none">
                                      {shortName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        />
                        {stats.sortedCategories.map((c) => (
                          <Bar
                            key={c.categoryCode}
                            dataKey={c.categoryCode}
                            name={c.categoryCode}
                            stackId="7cat"
                            fill={CATEGORY_COLORS[c.categoryCode]?.main || '#0F4C81'}
                          />
                        ))}
                      </BarChart>
                    ) : selectedCategoryFilter === 'TOTAL' ? (
                      /* Total Bar Chart */
                      <BarChart
                        data={[...stats.regional7CatMatrix].sort((a, b) => b.total - a.total)}
                        layout="vertical"
                        margin={{ top: 10, right: 15, left: -10, bottom: 10 }}
                        barSize={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }} />
                        <YAxis dataKey="shortName" type="category" width={75} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
                        <Tooltip
                          cursor={{ fill: '#F8FAFC' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: '12px 16px' }}
                          itemStyle={{ color: '#0F172A', fontWeight: '900', fontSize: '14px' }}
                        />
                        <Bar dataKey="total" name="Total Accomplishments" fill="#0F4C81" radius={[0, 6, 6, 0]}>
                          {stats.regional7CatMatrix.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      /* Single Category Filtered Bar Chart */
                      <BarChart
                        data={[...stats.regional7CatMatrix].sort((a, b) => (b[selectedCategoryFilter] || 0) - (a[selectedCategoryFilter] || 0))}
                        layout="vertical"
                        margin={{ top: 10, right: 15, left: -10, bottom: 10 }}
                        barSize={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }} />
                        <YAxis dataKey="shortName" type="category" width={75} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }} />
                        <Tooltip
                          cursor={{ fill: '#F8FAFC' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.98)', padding: '12px 16px' }}
                          itemStyle={{ color: '#0F172A', fontWeight: '900', fontSize: '14px' }}
                        />
                        <Bar
                          dataKey={selectedCategoryFilter}
                          name={stats.sortedCategories.find(c => c.categoryCode === selectedCategoryFilter)?.categoryName || selectedCategoryFilter}
                          fill={CATEGORY_COLORS[selectedCategoryFilter]?.main || '#0F4C81'}
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* View Mode 2: Matrix Table View */}
            {comparisonViewMode === 'matrix' && (
              <div className="mt-6 space-y-4">
                {/* Search Input */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative w-full max-w-sm">
                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search region by name or code..."
                      value={matrixSearchQuery}
                      onChange={(e) => setMatrixSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-gov-blue/20"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    Showing 17 Regions x 7 Categories
                  </span>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="py-3.5 px-4 font-black text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 shadow-sm">
                          Region
                        </th>
                        {stats.sortedCategories.map(c => (
                          <th key={c.categoryCode} className="py-3.5 px-3 font-black text-slate-600 text-center uppercase tracking-wider min-w-[110px]" title={c.categoryName}>
                            <div className="flex flex-col items-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] ${CATEGORY_COLORS[c.categoryCode]?.bg} ${CATEGORY_COLORS[c.categoryCode]?.text}`}>
                                {c.categoryCode}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 line-clamp-1 mt-0.5 max-w-[100px] text-center">
                                {c.categoryName}
                              </span>
                            </div>
                          </th>
                        ))}
                        <th className="py-3.5 px-4 font-black text-gov-blue text-center uppercase tracking-wider bg-gov-blue-light/30">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.regional7CatMatrix
                        .filter(r => 
                          r.shortName.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
                          r.regionName.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
                          r.regionCode.toLowerCase().includes(matrixSearchQuery.toLowerCase())
                        )
                        .map((row) => (
                          <tr key={row.regionId} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800 sticky left-0 bg-white shadow-sm flex items-center gap-2">
                              <span className="text-slate-400 text-[10px] font-mono">{row.regionCode}</span>
                              <span className="font-extrabold">{row.shortName}</span>
                            </td>
                            {stats.sortedCategories.map(c => {
                              const val = row[c.categoryCode] || 0;
                              const summary = stats.categorySummaries.find(cs => cs.code === c.categoryCode);
                              const isTop = val > 0 && summary && summary.topValue === val;

                              return (
                                <td key={c.categoryCode} className="py-3 px-3 text-center font-bold">
                                  {val > 0 ? (
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-extrabold ${
                                      isTop ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {val}
                                      {isTop && <Trophy size={11} className="text-amber-600" />}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-normal">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-3 px-4 text-center font-black text-gov-blue bg-gov-blue-light/10 text-sm">
                              {row.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100/80 font-black text-slate-800 border-t border-slate-200">
                        <td className="py-3.5 px-4 uppercase tracking-wider sticky left-0 bg-slate-100">
                          National Total
                        </td>
                        {stats.sortedCategories.map(c => {
                          const summary = stats.categorySummaries.find(cs => cs.code === c.categoryCode);
                          return (
                            <td key={c.categoryCode} className="py-3.5 px-3 text-center text-sm font-black text-slate-800">
                              {(summary?.total || 0).toLocaleString()}
                            </td>
                          );
                        })}
                        <td className="py-3.5 px-4 text-center text-base font-black text-gov-blue bg-gov-blue-light/40">
                          {stats.totalAccomplishments.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

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
