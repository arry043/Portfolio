import { memo, useMemo, useState, useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler, Legend
} from 'chart.js';
import { 
  useAdminAnalyticsDailyQuery, 
  useAdminAnalyticsMonthlyQuery 
} from '../../hooks/useAdminApi';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend
);

// Custom Crosshair Hover Plugin
const crosshairPlugin = {
  id: 'crosshair',
  afterDraw: (chart) => {
    if (chart.tooltip?._active?.length) {
      const activePoint = chart.tooltip._active[0];
      const ctx = chart.ctx;
      const x = activePoint.element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;
      
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#3b82f6';
      ctx.stroke();
      ctx.restore();
    }
  }
};

// Custom Glow Effect Plugin
const glowPlugin = {
  id: 'glow',
  beforeDatasetsDraw: (chart) => {
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor = 'rgba(59,130,246,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  },
  afterDatasetsDraw: (chart) => {
    chart.ctx.restore();
  }
};

const AdminChart = () => {
  const [timeRange, setTimeRange] = useState('30D'); // 7D, 30D, 90D, 1Y
  const chartRef = useRef(null);
  
  // Is Mobile check for responsive points/tooltips
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    setIsMobile(media.matches);
    const handler = (e) => setIsMobile(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const query7D = useAdminAnalyticsDailyQuery(7);
  const query30D = useAdminAnalyticsDailyQuery(30);
  const query90D = useAdminAnalyticsDailyQuery(90);
  const query1Y = useAdminAnalyticsMonthlyQuery();

  const currentQuery = 
    timeRange === '7D' ? query7D : 
    timeRange === '30D' ? query30D : 
    timeRange === '90D' ? query90D : 
    query1Y;

  const data = useMemo(() => currentQuery.data?.items || [], [currentQuery.data]);

  const chartData = useMemo(() => {
    return {
      labels: data.map(item => item._id),
      datasets: [
        {
          label: 'Total Visitors',
          data: data.map(item => item.totalViews),
          fill: true,
          tension: data.length <= 1 ? 0 : 0.4,
          pointRadius: isMobile ? 0 : 3,
          pointHoverRadius: isMobile ? 4 : 6,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: 'transparent',
          borderWidth: 2,
          // Horizontal Blue -> Purple line gradient
          borderColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return '#3b82f6'; 
            const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
            gradient.addColorStop(0, '#3b82f6'); 
            gradient.addColorStop(1, '#a855f7'); 
            return gradient;
          },
          // Vertical Blue Alpha fill gradient
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(59,130,246,0.1)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
            return gradient;
          },
        },
      ],
    };
  }, [data, isMobile]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
    },
    layout: { padding: { top: 10, bottom: 0, left: -5, right: 10 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: '#09090b',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: '#27272a',
        borderWidth: 1,
        padding: isMobile ? 6 : 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { 
          color: '#71717a', 
          maxRotation: 0, 
          autoSkip: true, 
          maxTicksLimit: isMobile ? 4 : 8,
          font: { size: isMobile ? 10 : 12 }
        },
      },
      y: {
        grid: { color: isMobile ? 'transparent' : '#27272a', drawBorder: false },
        ticks: { color: '#71717a', stepSize: 1, precision: 0, font: { size: isMobile ? 10 : 12 } },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5 w-full h-full flex flex-col shadow-xl shadow-black/20">
      
      {/* Header and Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-base font-bold text-zinc-100 uppercase tracking-wide">
            Traffic Analytics
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Unique routing nodes hit</p>
        </div>
        
        <div className="flex items-center p-1 border border-zinc-800 rounded-lg bg-zinc-900 shadow-inner">
          {['7D', '30D', '90D', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md uppercase transition-all duration-300 ${
                timeRange === range
                  ? 'bg-zinc-800 text-white shadow-md'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 w-full min-h-[300px] relative">
        {currentQuery.isFetching ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-950/50 backdrop-blur-sm rounded-lg transition-opacity duration-300">
             <div className="h-4 w-44 animate-pulse rounded bg-zinc-800" />
          </div>
        ) : null}

        {data.length === 0 && !currentQuery.isLoading ? (
          <div className="h-full w-full flex items-center justify-center text-sm font-medium text-zinc-500">
            Awaiting sufficient tracking telemetry.
          </div>
        ) : (
          <Line 
            ref={chartRef}
            options={chartOptions} 
            data={chartData} 
            plugins={[crosshairPlugin, glowPlugin]} 
          />
        )}
      </div>
    </div>
  );
};

export default memo(AdminChart);
