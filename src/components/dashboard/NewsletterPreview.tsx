'use client';

// Production House — Newsletter Preview Component
// Dashboard card showing newsletter stats and preview functionality
// =============================================================

import { useState, useEffect } from 'react';
import { AlertCircle, Mail, Eye, Send } from 'lucide-react';

interface NewsletterPreviewProps {
  siteId: string;
}

interface NewsletterLog {
  id: string;
  subject: string;
  sent_at: string | null;
  recipient_count: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
}

interface PreviewData {
  subject: string;
  html: string;
  articleCount: number;
}

export function NewsletterPreview({ siteId }: NewsletterPreviewProps) {
  const [lastNewsletter, setLastNewsletter] = useState<NewsletterLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch latest newsletter
  useEffect(() => {
    async function fetchLatest() {
      try {
        const response = await fetch(`/api/newsletter/history?siteId=${siteId}&limit=1`);

        if (!response.ok) {
          throw new Error('Failed to fetch newsletter history');
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setLastNewsletter(data.data[0]);
        }
      } catch (err) {
        console.error('Error fetching newsletter history:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLatest();
  }, [siteId]);

  // Handle preview
  const handlePreview = async () => {
    setError(null);

    try {
      const response = await fetch('/api/newsletter/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate preview');
      }

      const data = await response.json();
      setPreviewData(data);
      setIsPreviewOpen(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
    }
  };

  // Handle send
  const handleSend = async () => {
    if (!window.confirm('Are you sure you want to send the newsletter now?')) {
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send newsletter');
      }

      const data = await response.json();
      setSuccess(
        `Newsletter sent to ${data.recipientCount} subscribers with ${data.articleCount} articles`
      );

      // Refresh the last newsletter
      const historyResponse = await fetch(`/api/newsletter/history?siteId=${siteId}&limit=1`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.data && historyData.data.length > 0) {
          setLastNewsletter(historyData.data[0]);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sending: 'bg-blue-100 text-blue-800',
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const statusBgColor = lastNewsletter ? statusColors[lastNewsletter.status] : 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Newsletter
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {lastNewsletter ? (
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Last Sent</label>
            <p className="text-sm text-gray-600">
              {lastNewsletter.sent_at
                ? new Date(lastNewsletter.sent_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Never'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Recipients</label>
            <p className="text-sm text-gray-600">{lastNewsletter.recipient_count} subscribers</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusBgColor}`}>
              {lastNewsletter.status}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600 mb-6">No newsletters sent yet</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handlePreview}
          disabled={isSending}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>

        <button
          onClick={handleSend}
          disabled={isSending}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {isSending ? 'Sending...' : 'Send Now'}
        </button>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Newsletter Preview</h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">Subject</label>
                <p className="text-sm text-gray-900">{previewData.subject}</p>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Articles ({previewData.articleCount})
                </label>
              </div>

              <iframe
                className="w-full border border-gray-200 rounded-lg"
                style={{ height: '400px' }}
                title="Newsletter Preview"
                srcDoc={previewData.html}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
