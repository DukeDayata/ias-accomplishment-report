import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, ArrowRight, ShieldCheck, Activity, User, Briefcase, MapPin, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/axios';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [regions, setRegions] = useState([]);
  
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      role: 'Regional Encoder or Project Technical Staff'
    }
  });

  const selectedRole = watch('role');
  const isRegionalRole = selectedRole.startsWith('Regional');

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await api.get('/regions');
        setRegions(res.data);
      } catch (err) {
        console.error('Failed to fetch regions', err);
      }
    };
    fetchRegions();
  }, []);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Clear region if it's an IAS role
      if (!data.role.startsWith('Regional')) {
        delete data.regionId;
      }
      
      const res = await api.post('/auth/register', data);
      
      // Auto-login after successful registration
      login(res.data, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Branding Panel - Hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-[#0F4C81] to-blue-900 overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-xl">
              <ShieldCheck className="w-10 h-10 text-blue-200" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">IAS Portal</h2>
              <p className="text-blue-200 font-medium">Accomplishment Report System</p>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
            Join the IAS<br />Reporting Network.
          </h1>
          <p className="text-lg text-blue-100/80 mb-12 max-w-md leading-relaxed">
            Collaborate, report, and monitor accomplishments with unparalleled ease and security.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 transition-transform hover:-translate-y-1 duration-300">
              <Activity className="w-6 h-6 text-cyan-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">Unified Platform</h3>
              <p className="text-blue-200/70 text-sm">All tools in one place</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 transition-transform hover:-translate-y-1 duration-300">
              <Lock className="w-6 h-6 text-cyan-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">Role-based Access</h3>
              <p className="text-blue-200/70 text-sm">Tailored permissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Signup Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white relative overflow-y-auto max-h-screen">
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
           <ShieldCheck className="w-8 h-8 text-[#0F4C81]" />
           <span className="text-xl font-bold text-slate-800">IAS</span>
        </div>

        <div className="w-full max-w-md my-auto pt-16 lg:pt-0">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Create Account</h2>
            <p className="text-slate-500">Sign up to start reporting accomplishments.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                <p>{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 ml-1">First Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0F4C81] transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    {...register('firstName', { required: true })}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81] outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-sm"
                    placeholder="Juan"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 ml-1">Last Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0F4C81] transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    {...register('lastName', { required: true })}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81] outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-sm"
                    placeholder="Dela Cruz"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0F4C81] transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  {...register('email', { required: true })}
                  type="email"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81] outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-sm"
                  placeholder="juan@ched.gov.ph"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0F4C81] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  {...register('password', { required: true, minLength: 6 })}
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81] outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0F4C81] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 ml-1">Role</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0F4C81] transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <select
                  {...register('role', { required: true })}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81] outline-none transition-all text-slate-700 shadow-sm appearance-none"
                >
                  <option value="Regional Encoder or Project Technical Staff">Regional Encoder or Project Tech Staff</option>
                  <option value="Regional Administrator or IZN Focal Person">Regional Administrator or IZN Focal Person</option>
                  <option value="Regional Director">Regional Director</option>
                  <option value="IAS Monitoring Officer">IAS Monitoring Officer</option>
                  <option value="IAS Management or Director">IAS Management or Director</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                </div>
              </div>
            </div>

            {isRegionalRole && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-slate-700 ml-1">Assigned Region</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0F4C81] transition-colors">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <select
                    {...register('regionId', { required: isRegionalRole })}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81] outline-none transition-all text-slate-700 shadow-sm appearance-none"
                  >
                    <option value="">-- Select Region --</option>
                    {regions.map(r => (
                      <option key={r._id} value={r._id}>{r.regionCode} - {r.regionName}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full bg-[#E5A726] hover:bg-[#d49922] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-[#E5A726]/20 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full -translate-x-full transition-transform duration-500 ease-out"></div>
                <span className="relative flex items-center gap-2">
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                  {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center pb-8">
            <p className="text-slate-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0F4C81] hover:text-blue-900 font-semibold transition-colors">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
