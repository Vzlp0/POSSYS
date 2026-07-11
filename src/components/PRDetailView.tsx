import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Building2, FileText, Upload, Download, Trash2, Clock, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getStatusLabel, getStatusColor, getActionLabel, getActionIcon } from '../lib/prHelpers';

interface PRDetailViewProps {
  prId: string;
  onBack: () => void;
  onRefresh: () => void;
  onCreatePO?: () => void;
}

interface HistoryEntry {
  id: string;
  action: string;
  status: string;
  comment: string | null;
  performed_at: string;
  performer: {
    username: string;
  };
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploader: {
    username: string;
  };
}

export default function PRDetailView({ prId, onBack, onRefresh, onCreatePO }: PRDetailViewProps) {
  const { user } = useAuth();
  const [pr, setPr] = useState<any>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPRDetails();
    fetchHistory();
    fetchAttachments();
  }, [prId]);

  const fetchPRDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_requisitions')
        .select(`
          *,
          requester:requester_id(username, email),
          branch:branch_id(name, code),
          items:purchase_requisition_items(
            *,
            item:item_id(name, sku)
          )
        `)
        .eq('id', prId)
        .single();

      if (error) throw error;
      setPr(data);
    } catch (error) {
      console.error('Error fetching PR:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('pr_history')
        .select(`
          *,
          performer:performed_by(username)
        `)
        .eq('pr_id', prId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('pr_attachments')
        .select(`
          *,
          uploader:uploaded_by(username)
        `)
        .eq('pr_id', prId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${prId}/${Date.now()}_${file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pr-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('pr-attachments')
          .getPublicUrl(fileName);

        await supabase.from('pr_attachments').insert({
          pr_id: prId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user?.id
        });
      }

      alert('Files uploaded successfully!');
      fetchAttachments();
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const filePath = fileUrl.split('/pr-attachments/')[1];
      await supabase.storage.from('pr-attachments').remove([filePath]);

      await supabase.from('pr_attachments').delete().eq('id', attachmentId);

      alert('Attachment deleted successfully!');
      fetchAttachments();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Purchase Request not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to List</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pr.pr_number}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pr.status)}`}>
                {getStatusLabel(pr.status)}
              </span>
            </div>
            {pr.status === 'pending_po' && onCreatePO && (
              <button
                onClick={onCreatePO}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Create PO</span>
              </button>
            )}
            {pr.status !== 'pending_po' && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {pr.status === 'pending' && 'Waiting for Manager approval'}
                {pr.status === 'approved' && 'Approved - will be available for PO creation'}
                {pr.status === 'po_created' && 'PO already created from this PR'}
                {pr.status === 'rejected' && 'PR was rejected'}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span><strong>PR Date:</strong> {new Date(pr.pr_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span><strong>Required:</strong> {new Date(pr.required_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span><strong>Requester:</strong> {pr.requester?.username}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Building2 className="w-4 h-4" />
              <span><strong>Branch:</strong> {pr.branch?.name}</span>
            </div>
          </div>

          {pr.notes && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{pr.notes}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Items</h2>
            <div className="space-y-3">
              {pr.items?.map((item: any) => (
                <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.item?.name} ({item.item?.sku})
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Qty: {item.quantity} {item.unit} | Est. Cost: ${item.estimated_cost}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attachments</h2>
              <label className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors text-sm">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="space-y-2">
              {attachments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No attachments</p>
              ) : (
                attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{att.file_name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatFileSize(att.file_size)} • {att.uploader?.username} • {new Date(att.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {(att.uploaded_by === user?.id || user?.role === 'admin' || user?.role === 'manager') && (
                        <button
                          onClick={() => handleDeleteAttachment(att.id, att.file_url)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>History Log</span>
          </h2>
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No history available</p>
            ) : (
              history.map((entry, index) => (
                <div key={entry.id} className="flex space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-lg">
                      {getActionIcon(entry.action)}
                    </div>
                    {index < history.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getActionLabel(entry.action)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                        {getStatusLabel(entry.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {entry.performer?.username} • {new Date(entry.performed_at).toLocaleString()}
                    </p>
                    {entry.comment && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.comment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
