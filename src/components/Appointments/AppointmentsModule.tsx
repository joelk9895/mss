import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Video, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AppointmentsModule() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          clients:client_id(full_name, email, phone),
          profiles:lawyer_id(full_name)
        `)
        .order('appointment_date', { ascending: true });

      if (profile?.role === 'client') {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (clientData) {
          query = query.eq('client_id', clientData.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  const upcomingAppointments = appointments.filter(
    a => new Date(a.appointment_date) >= new Date() && a.status !== 'cancelled'
  );
  const pastAppointments = appointments.filter(
    a => new Date(a.appointment_date) < new Date() || a.status === 'cancelled'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-slate-100 text-slate-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getMeetingIcon = (type: string) => {
    switch (type) {
      case 'video_call': return <Video className="w-4 h-4" />;
      case 'phone_call': return <Phone className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-600 mt-2">Schedule and manage your meetings</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Upcoming Appointments ({upcomingAppointments.length})
          </h2>
          {upcomingAppointments.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No upcoming appointments</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Past Appointments ({pastAppointments.length})
          </h2>
          {pastAppointments.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No past appointments</p>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {pastAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function AppointmentCard({ appointment }: { appointment: any }) {
    const date = new Date(appointment.appointment_date);
    return (
      <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">
              {appointment.clients?.full_name}
            </h3>
            <p className="text-sm text-slate-600">
              with {appointment.profiles?.full_name}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
            {appointment.status}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <CalendarIcon className="w-4 h-4" />
            <span>{date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4" />
            <span>{appointment.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            {getMeetingIcon(appointment.meeting_type)}
            <span className="capitalize">{appointment.meeting_type.replace('_', ' ')}</span>
          </div>
          {appointment.location && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" />
              <span>{appointment.location}</span>
            </div>
          )}
        </div>
        {appointment.notes && (
          <p className="mt-3 text-sm text-slate-500 line-clamp-2">{appointment.notes}</p>
        )}
      </div>
    );
  }
}
