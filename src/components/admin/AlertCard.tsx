// Alert Card — Display individual alert with type and severity

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { AdminAlert } from '@/types/database';

interface AlertCardProps {
  alert: AdminAlert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/20 border-red-700 text-red-300';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-700 text-yellow-300';
      case 'info':
        return 'bg-blue-900/20 border-blue-700 text-blue-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').split(' ')
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
    <div className={`flex-1 border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-start gap-4">
        <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase">{getTypeLabel(alert.type)}</span>
            <span className="h-2 w-2 rounded-full bg-current opacity-50"></span>
            <span className="text-xs opacity-75">{formatDate(alert.created_at)}</span>
          </div>
          <p className="mt-1 text-sm font-medium">{alert.message}</p>
          {(alert.organization_id || alert.site_id) && (
            <div className="mt-2 flex gap-3 text-xs opacity-75">
              {alert.organization_id && (
                <span>Org: {alert.organization_id.slice(0, 8)}...</span>
              )}
              {alert.site_id && (
                <span>Site: {alert.site_id.slice(0, 8)}...</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
