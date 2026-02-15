// Job Row — Display individual job log entry with status

import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { JobLog } from '@/types/database';

interface JobRowProps {
  job: JobLog;
}

export default function JobRow({ job }: JobRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/20 border-green-700';
      case 'failed':
        return 'bg-red-900/20 border-red-700';
      case 'running':
        return 'bg-blue-900/20 border-blue-700';
      default:
        return 'bg-slate-800 border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-slate-500" />;
    }
  };

  const getJobTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`rounded-lg border ${getStatusColor(job.status)} bg-slate-900 p-4 transition-colors hover:bg-slate-800`}>
      <div className="flex items-start gap-4">
        <div className="mt-1">{getStatusIcon(job.status)}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white">{getJobTypeLabel(job.job_type)}</span>
            <span className="text-xs font-semibold text-slate-400 uppercase">
              {job.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{formatDate(job.started_at)}</p>
          <div className="mt-2 grid grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-slate-400">Fetched</p>
              <p className="font-semibold text-white">{job.articles_fetched}</p>
            </div>
            <div>
              <p className="text-slate-400">Rewritten</p>
              <p className="font-semibold text-white">{job.articles_rewritten}</p>
            </div>
            <div>
              <p className="text-slate-400">Published</p>
              <p className="font-semibold text-white">{job.articles_published}</p>
            </div>
            <div>
              <p className="text-slate-400">Duration</p>
              <p className="font-semibold text-white">
                {job.duration_ms ? `${Math.round(job.duration_ms / 1000)}s` : '-'}
              </p>
            </div>
          </div>
          {job.error_message && (
            <p className="mt-2 text-xs text-red-400">{job.error_message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
