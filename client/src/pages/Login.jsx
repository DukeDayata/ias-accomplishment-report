import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, ArrowRight, Activity, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/axios';
import iasLogo from '../assets/ias-logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.post('/auth/login', data);
      login(res.data, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Branding Panel - Hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-gov-blue-dark via-gov-blue to-gov-blue-accent overflow-hidden items-center justify-center p-12">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-gov-gold/20 blur-3xl animate-float"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-xl">
              <img src={iasLogo} alt="IAS Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">IZN-RADAR</h2>
              <p className="text-gov-blue-light font-medium">Regional Accomplishment Data & Analytics Repository</p>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
            Streamline your<br />reporting workflow.
          </h1>
          <p className="text-lg text-gov-blue-light/80 mb-12 max-w-md leading-relaxed">
            Bringing our regional accomplishments together in one secure, easy-to-use space. Track your progress, discover insights, and collaborate effortlessly.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 transition-transform hover:-translate-y-1 duration-300">
              <Activity className="w-6 h-6 text-gov-gold mb-3" />
              <h3 className="text-white font-semibold mb-1">Real-time Analytics</h3>
              <p className="text-gov-blue-light/80 text-sm">Monitor metrics instantly</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 transition-transform hover:-translate-y-1 duration-300">
              <Lock className="w-6 h-6 text-gov-gold mb-3" />
              <h3 className="text-white font-semibold mb-1">Secure Access</h3>
              <p className="text-gov-blue-light/80 text-sm">Enterprise-grade security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white relative">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
          <img src={iasLogo} alt="IAS Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold text-slate-800">IAS</span>
        </div>

        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-10 text-center lg:text-left mt-12 lg:mt-0">
            <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Welcome back</h2>
            <p className="text-slate-500">Please enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-gov-blue transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  {...register('email', { required: true })}
                  type="email"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-sm"
                  placeholder="admin@ched.gov.ph"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-gov-blue transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  {...register('password', { required: true })}
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-gov-blue transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full bg-gov-blue hover:bg-gov-blue-dark text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg shadow-gov-blue-dark/20 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden premium-shadow"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full -translate-x-full transition-transform duration-500 ease-out"></div>
                <span className="relative flex items-center gap-2">
                  {isLoading ? 'Signing In...' : 'Sign In'}
                  {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-gov-blue hover:text-gov-blue-dark font-semibold transition-colors">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
