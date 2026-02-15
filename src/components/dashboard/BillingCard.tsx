// Production House — Billing Card Component
// Displays current plan, billing date, and amount
// =============================================================

'use client';

import { formatDate } from '@/lib/utils';
import type { Subscription } from '@/types/database';

const PRICE_PER_SITE = 49; // $49/site/month

interface BillingCardProps {
  subscription: Subscription;
  quantity: number;
}

export function BillingCard({ subscription, quantity }: BillingCardProps) {
  const monthlyAmount = PRICE_PER_SITE * quantity;

  const statusColors: Record<string, string> = {
    active: 'bg-green-50 border-green-200 text-green-800',
    past_due: 'bg-red-50 border-red-200 text-red-800',
    cancelled: 'bg-gray-50 border-gray-200 text-gray-800',
    incomplete: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    trialing: 'bg-blue-50 border-blue-200 text-blue-800',
    paused: 'bg-orange-50 border-orange-200 text-orange-800',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    past_due: 'Past Due',
    cancelled: 'Cancelled',
    incomplete: 'Incomplete',
    trialing: 'Trialing',
    paused: 'Paused',
  };

  const statusColor = statusColors[subscription.status] || statusColors.incomplete;
  const statusLabel = statusLabels[subscription.status] || 'Unknown';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Plan
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            ${PRICE_PER_SITE}/site per month
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Number of Sites
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {quantity}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Monthly Cost
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            ${monthlyAmount}
          </p>
        </div>
      </div>

      {subscription.current_period_end && (
        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Next billing date
          </p>
          <p className="mt-1 font-medium text-gray-900 dark:text-white">
            {formatDate(new Date(subscription.current_period_end))}
          </p>
        </div>
      )}

      {subscription.cancel_at_period_end && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Your subscription will cancel on{' '}
            {formatDate(new Date(subscription.current_period_end || new Date()))}
          </p>
        </div>
      )}
    </div>
  );
}
