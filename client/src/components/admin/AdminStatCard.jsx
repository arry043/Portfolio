import { memo } from 'react';

const AdminStatCard = ({ label, value, hint }) => {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-100">{value}</p>
      {hint ? <p className="mt-1 text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
};

export default memo(AdminStatCard);
