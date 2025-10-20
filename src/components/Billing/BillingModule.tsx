import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, FileText, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function BillingModule() {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      let query = supabase
        .from('billing')
        .select(`
          *,
          clients:client_id(full_name, email),
          cases:case_id(case_number, title)
        `)
        .order('issue_date', { ascending: false });

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

      const invoicesWithPayments = await Promise.all(
        (data || []).map(async (invoice) => {
          const { data: payments } = await supabase
            .from('payments')
            .select('amount, status')
            .eq('billing_id', invoice.id)
            .eq('status', 'completed');

          const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
          return { ...invoice, totalPaid };
        })
      );

      setInvoices(invoicesWithPayments);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'cancelled': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'sent': return <Clock className="w-4 h-4" />;
      case 'overdue': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold text-slate-900">
            {profile?.role === 'client' ? 'My Invoices' : 'Billing & Invoices'}
          </h1>
          <p className="text-slate-600 mt-2">
            {profile?.role === 'client' ? 'View and pay your invoices' : 'Manage invoices and payments'}
          </p>
        </div>
        {profile?.role !== 'client' && (
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
            <Plus className="w-5 h-5" />
            Create Invoice
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {invoices.filter(i => i.status === 'paid').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-blue-600">
            {invoices.filter(i => i.status === 'sent').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-red-600">
            {invoices.filter(i => i.status === 'overdue').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No invoices found</p>
            <p className="text-slate-500 text-sm mt-2">
              {profile?.role === 'client'
                ? 'You have no invoices yet'
                : 'Create your first invoice to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const outstanding = parseFloat(invoice.total_amount) - invoice.totalPaid;
              return (
                <div
                  key={invoice.id}
                  className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-slate-900 text-lg font-mono">
                          {invoice.invoice_number}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)} flex items-center gap-1`}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </span>
                      </div>
                      {invoice.cases && (
                        <p className="text-sm text-slate-600">
                          Case: {invoice.cases.case_number} - {invoice.cases.title}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">
                        ${parseFloat(invoice.total_amount).toFixed(2)}
                      </p>
                      {invoice.totalPaid > 0 && (
                        <p className="text-sm text-green-600">
                          Paid: ${invoice.totalPaid.toFixed(2)}
                        </p>
                      )}
                      {outstanding > 0 && (
                        <p className="text-sm text-red-600">
                          Due: ${outstanding.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 font-medium mb-1">Client</p>
                      <p className="text-slate-900">{invoice.clients?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium mb-1">Issue Date</p>
                      <p className="text-slate-900">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium mb-1">Due Date</p>
                      <p className="text-slate-900">
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium mb-1">Subtotal</p>
                      <p className="text-slate-900">${parseFloat(invoice.subtotal).toFixed(2)}</p>
                    </div>
                  </div>

                  {invoice.notes && (
                    <p className="mt-3 text-sm text-slate-600 italic">{invoice.notes}</p>
                  )}

                  {profile?.role === 'client' && invoice.status !== 'paid' && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                        Make Payment
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
