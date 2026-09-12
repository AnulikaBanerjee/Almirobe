import { History } from 'lucide-react';
import type { AuthUser } from '@/auth';
import AppPageShell from '@/components/pages/AppPageShell';
import { getActivity, getServiceRequests } from '@/menu/menuStorage';

interface AccountHistoryPageProps {
  user: AuthUser;
  onBack: () => void;
}

export default function AccountHistoryPage({ user, onBack }: AccountHistoryPageProps) {
  const requests = getServiceRequests(user.id);
  const activity = getActivity(user.id);

  return (
    <AppPageShell
      title="Account History"
      subtitle="Service requests and recent activity"
      icon={History}
      onBack={onBack}
      wide
    >
      <div className="space-y-6">
        <section>
          <h4 className="text-xs uppercase tracking-wider text-ink-500 mb-3">Service requests</h4>
          {requests.length === 0 ? (
            <p className="text-sm text-ink-500">No requests yet.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className="p-3 rounded-lg border border-ink-700 bg-ink-900/30 text-sm">
                  <p className="text-ink-100 font-medium">
                    {req.type === 'professional-help' ? 'Professional help' : 'Donation pickup'}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {new Date(req.createdAt).toLocaleString()} · {req.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <h4 className="text-xs uppercase tracking-wider text-ink-500 mb-3">Activity</h4>
          {activity.length === 0 ? (
            <p className="text-sm text-ink-500">No activity logged yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 30).map((entry) => (
                <div key={entry.id} className="flex gap-3 text-sm border-b border-ink-700/30 pb-2">
                  <span className="text-ink-600 text-xs whitespace-nowrap pt-0.5">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                  <div>
                    <p className="text-ink-200">{entry.title}</p>
                    {entry.detail && <p className="text-xs text-ink-500">{entry.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppPageShell>
  );
}
