import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { eachDayOfInterval, format, subDays, subMonths, startOfMonth } from 'date-fns';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const options = {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const timeString = time.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' });
  const dateString = time.toLocaleDateString('en-PH', options);

  return (
    <div className="text-black text-right">
      <p className="text-sm">{dateString}</p>
      <p className="text-xl font-bold">{timeString}</p>
    </div>
  );
};

const buttonClass = (btnView, view) =>
  view === btnView
    ? 'bg-black text-white font-semibold px-6 py-2 rounded-full'
    : 'text-gray-800 font-semibold px-6 py-2 rounded-full hover:bg-gray-200';

const getLast30DaysData = (history) => {
  const today = new Date();
  const daysArray = eachDayOfInterval({ start: subDays(today, 29), end: today });

  return daysArray.map((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const totalKWh = history
      .filter((doc) => format(new Date(doc.Timestamp?.toDate?.() || doc.Timestamp), 'yyyy-MM-dd') === dateKey)
      .reduce((sum, doc) => sum + parseFloat(doc.Energy || 0), 0);

    return {
      date: format(day, 'MMM d'),
      kWh: parseFloat(totalKWh.toFixed(3)),
    };
  });
};

const getLast12MonthsData = (history) => {
  const months = Array.from({ length: 12 }, (_, i) =>
    format(subMonths(startOfMonth(new Date()), i), 'yyyy-MM')
  ).reverse();

  return months.map((monthKey) => {
    const totalKWh = history
      .filter((doc) => format(new Date(doc.Timestamp?.toDate?.() || doc.Timestamp), 'yyyy-MM') === monthKey)
      .reduce((sum, doc) => sum + parseFloat(doc.Energy || 0), 0);

    return {
      month: format(new Date(monthKey + '-01'), 'MMM yyyy'),
      kWh: parseFloat(totalKWh.toFixed(3)),
    };
  });
};

const RadialMeter = ({
  value = 0,
  unit = '',
  max = 100,
  color = '#00E0D5',
  width = 120,
  height = 120,
  backgroundColor = '#f9f9f9',
  borderColor = '#e0e0e0',
}) => {
  const data = [{ name: 'value', value: value, fill: color }];

  return (
    <div
      className="relative shadow bg-black text-black p-6 rounded-lg"
      style={{
        width: `${width}px`,
        height: `${width}px`,
        backgroundColor: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '50%',
        padding: '2px',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          startAngle={180}
          endAngle={0}
          barSize={10}
          data={data}
        >
          <RadialBar background clockWise dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-lg font-bold">{value}</p>
        <p className="text-sm text-black">{unit}</p>
      </div>
    </div>
  );
};

const DashboardStats = ({ view, setView, devices }) => {
  const calculateEnergyTotals = (history) => {
    if (!history || history.length === 0) return { today: 0, month: 0 };

    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalToday = 0;
    let totalMonth = 0;

    history.forEach((entry) => {
      const ts = entry.Timestamp?.toDate ? entry.Timestamp.toDate() : new Date(entry.Timestamp);
      const entryDate = ts.toISOString().split('T')[0];
      const entryMonth = ts.getMonth();
      const entryYear = ts.getFullYear();
      const energy = parseFloat(entry.Energy || 0);

      if (entryDate === today) {
        totalToday += energy;
      }

      if (entryMonth === currentMonth && entryYear === currentYear) {
        totalMonth += energy;
      }
    });

    return {
      today: totalToday.toFixed(3),
      month: totalMonth.toFixed(3),
    };
  };

  const getUptimeDisplay = (timestamp, isOnline) => {
    if (!timestamp || !isOnline) return '0d 0h 0m 0s';

    const now = new Date();
    const startTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now - startTime;

    const seconds = Math.floor((diffMs / 1000) % 60);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <>
      <nav className="flex items-center justify-between bg-neutral-100 p-4">
  <div className="ml-4">
    <h1 className="text-2xl font-bold text-black">Technology Transferred Project</h1>
    <p className="text-base text-black">Monitoring and Control System</p>
  </div>
  <div className="flex flex-col md:flex-row items-center gap-2 md:space-x-4">
    <button className={buttonClass('home', view)} onClick={() => setView('home')}>
      Home
    </button>
    <button className={buttonClass('dashboard', view)} onClick={() => setView('dashboard')}>
      Dashboard
    </button>
    <div className="bg-neutral-100 px-4 py-2 rounded text-black">
      <Clock />
    </div>
  </div>
</nav>


      {view === 'dashboard' && (
        <div className="min-h-screen p-4 bg-neutral-100 text-black">
          {devices.map(({ name, data, history }, index) => {
            const last30DaysData = getLast30DaysData(history);
            const last12MonthsData = getLast12MonthsData(history);
            const isOnline = data?.Status === 'ON';
            const uptimeDisplay = getUptimeDisplay(data?.Timestamp, isOnline);
            const { today, month } = calculateEnergyTotals(history);

            return (
              <div key={index} className="mb-12">
                <h2 className="text-2xl font-bold mb-4">{name}</h2>

                <div className="flex flex-col md:flex-row gap-6 my-6">
                  <div className="bg-white p-6 rounded-lg shadow w-full md:w-1/2">
                    <h3 className="text-lg font-bold mb-4">Realtime Usage</h3>
                    <div className="flex flex-wrap justify-between gap-4">
                      <RadialMeter value={Math.round(data?.Voltage || 0)} unit="Voltage (V)" max={300} color="#FF6384" />
                      <RadialMeter value={data?.Current || 0} unit="Current (A)" max={10} color="#36A2EB" />
                      <RadialMeter value={data?.Power || 0} unit="Power (W)" max={10} color="#FFCE56" />
                      <RadialMeter value={data?.Energy || 0} unit="Energy (kWh)" max={10} color="#4BC0C0" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow w-full lg:w-1/2">
                    <h3 className="text-lg font-bold mb-2">Realtime Trend</h3>
                    {Array.isArray(history) && history.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart
                          data={history.slice().reverse().slice(0, 10).map((entry) => {
                            const date = entry.Timestamp?.toDate?.() || new Date(entry.Timestamp);
                            return {
                              ...entry,
                              timeLabel: date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              }),
                              fullLabel: date.toLocaleString(),
                            };
                          })}
                        >
                          <CartesianGrid stroke="#ccc" />
                          <XAxis dataKey="timeLabel" />
                          <YAxis domain={[0, 3]} />
                          <Tooltip
                            labelFormatter={(label, payload) =>
                              payload?.[0]?.payload?.fullLabel || label
                            }
                          />
                          <Line type="monotone" dataKey="Energy" stroke="#ff4c7b" />
                          <Line type="monotone" dataKey="Current" stroke="#36A2EB" />
                          <Line type="monotone" dataKey="Power" stroke="#FFCE56" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500">Loading chart...</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mb-6">
                  <div className="bg-white p-4 rounded shadow w-[200px] text-center">
                    <p className="text-sm font-semibold">Status</p>
                    <p className={`text-lg font-bold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      {data?.Status || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded shadow w-[200px] text-center">
                    <p className="text-sm font-semibold">Uptime</p>
                    <p className="text-lg font-bold">{uptimeDisplay}</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow w-[200px] text-center">
                    <p className="text-sm font-semibold">Total Today</p>
                    <p className="text-lg font-bold">{today}</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow w-[200px] text-center">
                    <p className="text-sm font-semibold">Total This Month</p>
                    <p className="text-lg font-bold">{month} kWh</p>
                  </div>
                </div>

                `  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="bg-white p-4 rounded shadow w-full md:w-1/2">
                      <h3 className="text-lg font-bold mb-2">Last 30 Days (kWh)</h3>
                      <div className="w-full overflow-x-auto">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={last30DaysData}>
                          <CartesianGrid stroke="#ccc" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => `${value.toFixed(3)} kWh`} />
                          <Bar dataKey="kWh" fill="#ff4c7b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    </div>

                    <div className="bg-white p-4 rounded shadow w-full md:w-1/2">
                      <h3 className="text-lg font-bold mb-2">Last 12 Months (kWh)</h3>
                      <div className="w-full overflow-x-auto">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={last12MonthsData}>
                          <CartesianGrid stroke="#ccc" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => `${value.toFixed(3)} kWh`} />
                          <Bar dataKey="kWh" fill="#ff4c7b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default DashboardStats;