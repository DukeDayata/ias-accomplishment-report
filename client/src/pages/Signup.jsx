import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/axios';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#0F4C81] p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-blue-200 text-sm">Join the IAS Accomplishment Report Portal</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input
                  {...register('firstName', { required: true })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Juan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  {...register('lastName', { required: true })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Dela Cruz"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                {...register('email', { required: true })}
                type="email"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="juan@ched.gov.ph"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                {...register('password', { required: true, minLength: 6 })}
                type="password"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                {...register('role', { required: true })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="Regional Encoder or Project Technical Staff">Regional Encoder or Project Technical Staff</option>
                <option value="Regional Administrator or IZN Focal Person">Regional Administrator or IZN Focal Person</option>
                <option value="Regional Director">Regional Director</option>
                <option value="IAS Monitoring Officer">IAS Monitoring Officer</option>
                <option value="IAS Management or Director">IAS Management or Director</option>
              </select>
            </div>

            {isRegionalRole && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Region</label>
                <select
                  {...register('regionId', { required: isRegionalRole })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  <option value="">-- Select Region --</option>
                  {regions.map(r => (
                    <option key={r._id} value={r._id}>{r.regionCode} - {r.regionName}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E5A726] hover:bg-[#d49922] text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-[#E5A726]/20 disabled:opacity-50 mt-4"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
