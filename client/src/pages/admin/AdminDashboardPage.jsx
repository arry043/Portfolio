import { memo, useEffect } from 'react';
import { Activity, MessageSquareText } from 'lucide-react';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminTable from '../../components/admin/AdminTable';
import { useAdminAnalyticsSummaryQuery, useAdminMessagesQuery } from '../../hooks/useAdminApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import SectionSkeleton from '../../components/common/SectionSkeleton';

const AdminDashboardPage = () => {
  const summaryQuery = useAdminAnalyticsSummaryQuery();
  const messagesQuery = useAdminMessagesQuery();
  const toast = useToast();

  useEffect(() => {
    if (summaryQuery.isError) {
      toast.error(getErrorMessage(summaryQuery.error), 'Dashboard Load Failed');
    }
  }, [summaryQuery.error, summaryQuery.isError, toast]);

  useEffect(() => {
    if (messagesQuery.isError) {
      toast.error(getErrorMessage(messagesQuery.error), 'Messages Load Failed');
    }
  }, [messagesQuery.error, messagesQuery.isError, toast]);

  const summary = summaryQuery.data?.item || {};
  const recentActivity = summary.recentActivity || [];
  const recentMessages = (messagesQuery.data?.items || []).slice(0, 5);

  return (
    <div className="space-y-4">
      {summaryQuery.isLoading ? <SectionSkeleton cardCount={4} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total Visitors" value={summary.totalVisitors || 0} />
        <AdminStatCard label="Chatbot Usage" value={summary.chatbotUsage || 0} />
        <AdminStatCard label="Project Views" value={summary.projectViews || 0} />
        <AdminStatCard label="Games Usage" value={summary.gamesUsage || 0} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
            <Activity className="h-4 w-4 text-zinc-400" />
            Recent Activity
          </p>
          <AdminTable
            columns={[
              { key: 'page', header: 'Page' },
              { key: 'views', header: 'Views' },
              { key: 'clicks', header: 'Clicks' },
            ]}
            rows={recentActivity.map((item) => ({
              id: `${item.page}-${item.updatedAt}`,
              page: item.page,
              views: item.views,
              clicks: item.clicks,
            }))}
            emptyMessage="No activity yet."
          />
        </div>

        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
            <MessageSquareText className="h-4 w-4 text-zinc-400" />
            Recent Messages
          </p>
          <AdminTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'email', header: 'Email' },
              {
                key: 'message',
                header: 'Message',
                render: (row) => (
                  <p
                    className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
                    title={row.message}
                  >
                    {row.message}
                  </p>
                ),
              },
            ]}
            rows={recentMessages}
            emptyMessage="No messages found."
          />
        </div>
      </div>
    </div>
  );
};

export default memo(AdminDashboardPage);
