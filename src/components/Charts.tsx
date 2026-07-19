"use client";

import dynamic from "next/dynamic";

export const DynamicBarChart = dynamic(
  () => import("recharts").then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    return function BarChartComponent({ data }: { data: any[] }) {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`${value} chamados`, "Quantidade"]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center text-gray-400">Carregando gráfico...</div> }
);

export const DynamicPieChart = dynamic(
  () => import("recharts").then((mod) => {
    const { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } = mod;
    return function PieChartComponent({ data }: { data: { name: string; value: number; color: string }[] }) {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value}`, "Quantidade"]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center text-gray-400">Carregando gráfico...</div> }
);

export const DynamicHorizontalBarChart = dynamic(
  () => import("recharts").then((mod) => {
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    return function HorizontalBarChartComponent({ data }: { data: { name: string; value: number }[] }) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
            <Tooltip
              formatter={(value) => [`${value} ocorrências`, "Total"]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center text-gray-400">Carregando gráfico...</div> }
);
