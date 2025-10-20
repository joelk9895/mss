import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Video, Phone, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AppointmentsModule() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    lawyer_id: '',
    appointment_date: '',
    duration_minutes: 30,
    meeting_type: 'in_person',
    location: '',
    notes: ''
  });

  useEffect(() => {
    loadAppointments();
    loadClientsAndLawyers();
  }, []);

  async function loadClientsAndLawyers() {
    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, full_name');
      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Fetch lawyers and assistants
      const { data: lawyersData, error: lawyersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['lawyer', 'assistant']);
      if (lawyersError) throw lawyersError;
      setLawyers(lawyersData || []);
    } catch (error) {
      console.error('Error loading clients and lawyers:', error);
    }
  }

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

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('appointments')
        .insert([formData]);
      if (error) throw error;
      setShowModal(false);
      setFormData({
        client_id: '',
        lawyer_id: '',
        appointment_date: '',
        duration_minutes: 30,
        meeting_type: 'in_person',
        location: '',
        notes: ''
      });
      loadAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
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
        {profile?.role !== 'client' && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Appointment
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">New Appointment</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.full_name}</option>
                ))}
              </select>
              <select
                value={formData.lawyer_id}
                onChange={(e) => setFormData({ ...formData, lawyer_id: e.target.value })}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select Lawyer</option>
                {lawyers.map(lawyer => (
                  <option key={lawyer.id} value={lawyer.id}>{lawyer.full_name}</option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                required
                className="w-full p-2 border rounded"
              />
              <select
                value={formData.meeting_type}
                onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="in_person">In Person</option>
                <option value="video_call">Video Call</option>
                <option value="phone_call">Phone Call</option>
              </select>
              <input
                type="text"
                placeholder="Location (if applicable)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <button type="submit" className="w-full bg-slate-900 text-white p-2 rounded hover:bg-slate-800">
                Create Appointment
              </button>
            </form>
          </div>
        </div>
      )}

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
