// Job Monitor — Table of recent job runs with status and controls

'use client';

import { useState, useEffect } from 'react';
import { Play, ChevronDown } from 'lucide-react';
import JobRow from '@/components/admin/JobRow';
import type { JobLog } from '@/types/database';

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobLog[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
    // Refresh jobs every 10 seconds
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch('/api/admin/jobs');
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleTriggerJob = async (jobType: string) => {
    setTriggering(jobType);
    try {
      const res = await fetch('/api/admin/jobs/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType }),
      });

      if (res.ok) {
        // Refresh jobs immediately
        fetchJobs();
      }
    } catch (error) {
      console.error('Failed to trigger job:', error);
    } finally {
      setTriggering(null);
    }
  };

  let filtered = jobs;

  if (jobTypeFilter) {
    filtered = filtered.filter((job) => job.job_type === jobTypeFilter);
  }

  if (statusFilter) {
    filtered = filtered.filter((job) => job.status === statusFilter);
  }

  const jobTypes = ['fetch_sources', 'rewrite_articles', 'publish_articles', 'post_social', 'send_newsletter', 'check_domains'];
  const statuses = ['running', 'completed', 'failed'];

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Job Monitor</h1>
        <p className="mt-2 text-slate-400">Monitor and manage background job execution</p>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Trigger Jobs</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {jobTypes.map((jobType) => (
            <button
              key={jobType}
              onClick={() => handleTriggerJob(jobType)}
              disabled={triggering === jobType}
              className="flex items-center justify-center gap-2 rounded bg-amber-900 px-4 py-2 text-amber-300 hover:bg-amber-800 disabled:opacity-50 transition-colors"
            >
              <Play className="h-4 w-4" />
              {jobType.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <select
          value={jobTypeFilter}
          onChange={(e) => setJobTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white"
        >
          <option value="">All Job Types</option>
          {jobTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No jobs found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => (
            <div key={job.id}>
              <button
                onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                className="w-full text-left"
              >
                <JobRow job={job} />
              </button>
              {expandedId === job.id && (
                <div className="mt-2 ml-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
                  <div className="grid gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Job ID</p>
                      <p className="font-mono text-xs text-slate-300">{job.id}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Duration</p>
                      <p className="text-white">
                        {job.duration_ms ? `${job.duration_ms}ms` : 'N/A'}
                      </p>
                    </div>
                    {job.error_message && (
                      <div>
                        <p className="text-red-400">Error</p>
                        <p className="text-red-300">{job.error_message}</p>
                      </div>
                    )}
                    <div className="grid gap-2 md:grid-cols-3">
                      <div>
                        <p className="text-slate-400">Fetched</p>
                        <p className="text-white">{job.articles_fetched}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Rewritten</p>
                        <p className="text-white">{job.articles_rewritten}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Published</p>
                        <p className="text-white">{job.articles_published}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-sm text-slate-400">
        Showing {filtered.length} of {jobs.length} jobs
      </div>
    </div>
  );
}
