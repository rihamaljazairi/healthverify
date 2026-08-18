import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const data = [
  { date: "Mon", verified: 40, pending: 24, rejected: 5 },
  { date: "Tue", verified: 45, pending: 20, rejected: 4 },
  { date: "Wed", verified: 60, pending: 15, rejected: 6 },
  { date: "Thu", verified: 55, pending: 18, rejected: 3 },
  { date: "Fri", verified: 70, pending: 12, rejected: 4 },
  { date: "Sat", verified: 65, pending: 14, rejected: 2 },
  { date: "Sun", verified: 50, pending: 16, rejected: 5 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-2xl">
      <p className="text-sm font-bold text-white mb-2">{label}</p>

      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-slate-400 capitalize">{item.dataKey}:</span>
          <span className="text-white font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function VerificationTrend() {
  return (
    <div className="w-full h-[330px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="verifiedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>

            <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.55)"
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="rgba(255,255,255,0.55)"
            tickLine={false}
            axisLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            iconType="circle"
            wrapperStyle={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "13px",
            }}
          />

          <Area
            type="monotone"
            dataKey="verified"
            stroke="#3b82f6"
            fill="url(#verifiedGradient)"
            strokeWidth={3}
            dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
            activeDot={{ r: 7 }}
          />

          <Area
            type="monotone"
            dataKey="pending"
            stroke="#f59e0b"
            fill="url(#pendingGradient)"
            strokeWidth={3}
            dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
            activeDot={{ r: 7 }}
          />

          <Line
            type="monotone"
            dataKey="rejected"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}