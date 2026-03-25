import { memo } from 'react';
import EmptyState from '../common/EmptyState';

const AdminTable = ({ columns = [], rows = [], emptyMessage = 'No data found.' }) => {
  if (!rows.length) {
    return <EmptyState message={emptyMessage} description="Try adding a new record." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/70">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/70">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || row._id || index} className="border-b border-zinc-900 last:border-b-0">
                {columns.map((column) => (
                  <td key={`${row.id || row._id || index}-${column.key}`} className="px-3 py-2 align-top text-sm text-zinc-300">
                    {typeof column.render === 'function' ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(AdminTable);
