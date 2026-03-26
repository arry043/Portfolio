import { memo, useEffect, useState } from 'react';
import { Activity, MessageSquareText, Eye, X } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminTable from '../../components/admin/AdminTable';
import AdminChart from '../../components/admin/AdminChart';
import { useAdminAnalyticsSummaryQuery, useAdminMessagesQuery } from '../../hooks/useAdminApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import SectionSkeleton from '../../components/common/SectionSkeleton';

const MessageModal = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <Motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <Motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl z-10"
      >
        <div className="flex items-start justify-between mb-4 border-b border-zinc-800/50 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{message.name}</h3>
            <p className="text-sm font-medium text-zinc-400 mt-1">{message.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm leading-relaxed text-zinc-300 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
          {message.message}
        </div>
        <div className="text-xs text-zinc-500 mt-4 text-right">
          {new Date(message.createdAt).toLocaleString()}
        </div>
      </Motion.div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const summaryQuery = useAdminAnalyticsSummaryQuery();
  const messagesQuery = useAdminMessagesQuery();
  const toast = useToast();

  const [selectedMessage, setSelectedMessage] = useState(null);

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
  const recentMessages = (messagesQuery.data?.items || []).slice(0, 10);

  return (
    <div className="space-y-6">
      {summaryQuery.isLoading ? <SectionSkeleton cardCount={4} /> : null}

      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total Visitors" value={summary.totalVisitors || 0} />
        <AdminStatCard label="Chatbot Usage" value={summary.chatbotUsage || 0} />
        <AdminStatCard label="Project Views" value={summary.projectViews || 0} />
        <AdminStatCard label="Games Usage" value={summary.gamesUsage || 0} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        
        {/* Left Column: Chart & Activity */}
        <div className="space-y-6">
          <div className="h-[400px]">
             <AdminChart />
          </div>

          <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100 uppercase tracking-widest">
              <Activity className="h-4 w-4 text-zinc-400" />
              Activity Breakdown
            </p>
            <AdminTable
              columns={[
                { key: 'page', header: 'Routing Node' },
                { key: 'views', header: 'Hits' },
                { key: 'clicks', header: 'Interactions' },
              ]}
              rows={recentActivity.map((item) => ({
                id: `${item.page}-${item.updatedAt}`,
                page: <span className="text-zinc-300 font-mono text-xs">{item.page}</span>,
                views: item.views,
                clicks: item.clicks,
              }))}
              emptyMessage="Waiting for telemetry..."
            />
          </div>
        </div>

        {/* Right Column: Messages */}
        <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 h-fit">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-100 uppercase tracking-widest">
            <MessageSquareText className="h-4 w-4 text-zinc-400" />
            Recent Comms
          </p>
          <div className="space-y-2">
            {recentMessages.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">Inboxes are clear.</p>
            ) : (
              recentMessages.map(msg => (
                <div key={msg._id || msg.id} className="p-3 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-between group">
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-semibold text-zinc-300 truncate">{msg.name}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{msg.message}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedMessage(msg)}
                    className="p-1.5 bg-zinc-800 rounded text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all shrink-0"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
      </div>

      <AnimatePresence>
        {selectedMessage && (
          <MessageModal 
            message={selectedMessage} 
            onClose={() => setSelectedMessage(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(AdminDashboardPage);
