import { useEffect, useState } from 'react';
import { supabase, Document } from '../../lib/supabase';
import { FileText, Upload, Download, Trash2, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function DocumentsModule() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          cases:case_id(case_number, title),
          profiles:uploaded_by(full_name)
        `)
        .order('upload_date', { ascending: false });

      if (profile?.role === 'client') {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (clientData) {
          const { data: clientCases } = await supabase
            .from('cases')
            .select('id')
            .eq('client_id', clientData.id);

          const caseIds = clientCases?.map(c => c.id) || [];
          query = query.in('case_id', caseIds).eq('is_confidential', false);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }

  const getDocumentIcon = (type: string) => {
    return <FileText className="w-8 h-8 text-slate-600" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
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
          <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600 mt-2">Manage case documents and files</p>
        </div>
        {profile?.role !== 'client' && (
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No documents found</p>
            <p className="text-slate-500 text-sm mt-2">Upload documents to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getDocumentIcon(doc.document_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {doc.document_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 capitalize">
                      {doc.document_type?.replace('_', ' ')}
                    </p>
                  </div>
                  {doc.is_confidential && (
                    <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  <p>Case: {doc.cases?.case_number}</p>
                  <p>Size: {formatFileSize(doc.file_size)}</p>
                  <p>Uploaded: {new Date(doc.upload_date).toLocaleDateString()}</p>
                  {doc.profiles && <p>By: {doc.profiles.full_name}</p>}
                </div>

                {doc.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{doc.description}</p>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  {profile?.role !== 'client' && (
                    <button className="px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
