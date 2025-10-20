import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Briefcase, Calendar, Users, AlertCircle, TrendingUp } from 'lucide-react';

interface Stats {
  totalCases: number;
  activeCases: number;
  pendingCases: number;
  upcomingAppointments: number;
  totalClients: number;
}

export default function LawyerDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCases: 0,
    activeCases: 0,
    pendingCases: 0,
    upcomingAppointments: 0,
    totalClients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [casesResult, appointmentsResult, clientsResult] = await Promise.all([
        supabase.from('cases').select('status'),
        supabase.from('appointments').select('*').gte('appointment_date', new Date().toISOString()).eq('status', 'scheduled'),
        supabase.from('clients').select('id'),
      ]);

      const cases = casesResult.data || [];
      const activeCases = cases.filter(c => c.status === 'active').length;
      const pendingCases = cases.filter(c => c.status === 'pending').length;

      setStats({
        totalCases: cases.length,
        activeCases,
        pendingCases,
        upcomingAppointments: appointmentsResult.data?.length || 0,
        totalClients: clientsResult.data?.length || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Total Cases', value: stats.totalCases, icon: Briefcase, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { label: 'Active Cases', value: stats.activeCases, icon: TrendingUp, color: 'bg-green-500', bgColor: 'bg-green-50' },
    { label: 'Pending Cases', value: stats.pendingCases, icon: AlertCircle, color: 'bg-amber-500', bgColor: 'bg-amber-50' },
    { label: 'Upcoming Appointments', value: stats.upcomingAppointments, icon: Calendar, color: 'bg-violet-500', bgColor: 'bg-violet-50' },
    { label: 'Total Clients', value: stats.totalClients, icon: Users, color: 'bg-slate-500', bgColor: 'bg-slate-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome back! Here's an overview of your practice.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <p className="font-medium text-slate-900">Add New Client</p>
              <p className="text-sm text-slate-600">Register a new client profile</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <p className="font-medium text-slate-900">Create New Case</p>
              <p className="text-sm text-slate-600">Start tracking a new legal case</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <p className="font-medium text-slate-900">Schedule Appointment</p>
              <p className="text-sm text-slate-600">Book a meeting with a client</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-slate-900">System initialized successfully</p>
                <p className="text-xs text-slate-500">Just now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
