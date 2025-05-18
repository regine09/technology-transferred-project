import React, { useState, useEffect } from "react";
import { HomeIcon, ChartBarIcon } from "@heroicons/react/24/outline";
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
  ComposedChart,
  Legend,
} from "recharts";
import {
  eachDayOfInterval,
  format,
  subDays,
  subMonths,
  startOfMonth,
} from "date-fns";

const DEVICE_COLORS = {
  "Device 1": "#4F46E5",
  "Device 2": "#10B981",
  "Device 3": "#F59E0B",
  "Device 4": "#EF4444",
  "Device 5": "#3B82F6",
};

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const options = {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const timeString = time.toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
  });
  const dateString = time.toLocaleDateString("en-PH", options);

  return (
    <div className="text-black text-right">
      <p className="text-sm">{dateString}</p>
      <p className="text-xl font-bold">{timeString}</p>
    </div>
  );
};

const buttonClass = (btnView, view) =>
  view === btnView
    ? "bg-black text-white font-semibold px-6 py-2 rounded-full"
    : "text-gray-800 font-semibold px-6 py-2 rounded-full hover:bg-gray-200";

const getLast30DaysData = (history) => {
  const today = new Date();
  const daysArray = eachDayOfInterval({
    start: subDays(today, 29),
    end: today,
  });

  return daysArray.map((day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const totalKWh = history
      .filter(
        (doc) =>
          format(
            new Date(doc.Timestamp?.toDate?.() || doc.Timestamp),
            "yyyy-MM-dd"
          ) === dateKey
      )
      .reduce((sum, doc) => sum + parseFloat(doc.Energy || 0), 0);

    return {
      date: format(day, "MMM d"),
      kWh: parseFloat(totalKWh.toFixed(3)),
    };
  });
};

const getLast12MonthsData = (history) => {
  const months = Array.from({ length: 12 }, (_, i) =>
    format(subMonths(startOfMonth(new Date()), i), "yyyy-MM")
  ).reverse();

  return months.map((monthKey) => {
    const totalKWh = history
      .filter(
        (doc) =>
          format(
            new Date(doc.Timestamp?.toDate?.() || doc.Timestamp),
            "yyyy-MM"
          ) === monthKey
      )
      .reduce((sum, doc) => sum + parseFloat(doc.Energy || 0), 0);

    return {
      month: format(new Date(monthKey + "-01"), "MMM yyyy"),
      kWh: parseFloat(totalKWh.toFixed(3)),
    };
  });
};

const RadialMeter = ({
  value = 0,
  unit = "",
  max = 100,
  color = "#00E0D5",
  width = 120,
  height = 120,
  backgroundColor = "#f9f9f9",
  borderColor = "#e0e0e0",
}) => {
  const data = [{ name: "value", value: value, fill: color }];

  return (
    <div
      className="relative shadow bg-black text-black p-6 rounded-lg"
      style={{
        width: `${width}px`,
        height: `${width}px`,
        backgroundColor: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "50%",
        padding: "2px",
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

const combineHistory = (devices) => {
  return devices
    .flatMap((device) => {
      return device.history
        .filter((entry) => entry?.Timestamp?.toDate || entry?.Timestamp)
        .sort((a, b) => {
          const t1 = a.Timestamp?.toDate?.() || new Date(a.Timestamp);
          const t2 = b.Timestamp?.toDate?.() || new Date(b.Timestamp);
          return t2 - t1;
        })
        .slice(0, 5)
        .map((entry) => {
          const timestamp =
            entry.Timestamp?.toDate?.() || new Date(entry.Timestamp);
          return {
            ...entry,
            deviceName: device.name,
            Timestamp: timestamp,
            timeLabel: timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            fullLabel: timestamp.toLocaleString(),
            Power: parseFloat(entry.Power || 0).toFixed(2),
            Current: parseFloat(entry.Current || 0).toFixed(2),
            Energy: parseFloat(entry.Energy || 0).toFixed(3),
          };
        });
    })
    .sort((a, b) => b.Timestamp - a.Timestamp);
};

const combineLast30DaysEnergy = (devices) => {
  const dateMap = {};
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - 29);

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const label = date.toLocaleDateString("default", {
      month: "short",
      day: "numeric",
    });

    dateMap[label] = {
      date: label,
      total: 0,
    };

    for (const device of devices) {
      dateMap[label][device.name] = 0;
    }
  }

  for (const device of devices) {
    for (const entry of device.history || []) {
      const timestamp =
        entry.Timestamp?.toDate?.() || new Date(entry.Timestamp);
      if (timestamp < startDate || timestamp > now) continue;

      const label = timestamp.toLocaleDateString("default", {
        month: "short",
        day: "numeric",
      });

      const energy = parseFloat(entry.Energy || 0);
      if (dateMap[label]) {
        dateMap[label][device.name] += energy;
        dateMap[label].total += energy;
      }
    }
  }

  return Object.entries(dateMap)
    .sort(([a], [b]) => {
      const aDate = new Date(`${a} ${now.getFullYear()}`);
      const bDate = new Date(`${b} ${now.getFullYear()}`);
      return aDate - bDate;
    })
    .map(([, value]) => value);
};

const combineLast12MonthsEnergy = (devices) => {
  const now = new Date();
  const monthMap = {};

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month + 1}`;

    monthMap[key] = {
      month: date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      total: 0,
    };

    for (const device of devices) {
      monthMap[key][device.name] = 0;
    }
  }

  for (const device of devices) {
    for (const entry of device.history || []) {
      const timestamp =
        entry.Timestamp?.toDate?.() || new Date(entry.Timestamp);
      const year = timestamp.getFullYear();
      const month = timestamp.getMonth();
      const key = `${year}-${month + 1}`;

      if (!monthMap[key]) continue;

      const energy = parseFloat(entry.Energy || 0);
      monthMap[key][device.name] += energy;
      monthMap[key].total += energy;
    }
  }

  return Object.entries(monthMap)
    .sort(([aKey], [bKey]) => {
      const [aYear, aMonth] = aKey.split("-").map(Number);
      const [bYear, bMonth] = bKey.split("-").map(Number);
      return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1);
    })
    .map(([, value]) => value);
};

const DashboardStats = ({ view, setView, devices }) => {
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);

  const calculateEnergyTotals = (history) => {
    if (!history || history.length === 0) return { today: 0, month: 0 };

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalToday = 0;
    let totalMonth = 0;

    history.forEach((entry) => {
      const ts = entry.Timestamp?.toDate
        ? entry.Timestamp.toDate()
        : new Date(entry.Timestamp);
      const entryDate = ts.toISOString().split("T")[0];
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

  let lastTimestamp = null;

  const getUptimeDisplay = (timestamp, isOnline) => {
    if (!isOnline) {
      lastTimestamp = null;
      return "0d 0h 0m 0s";
    }

    if (!lastTimestamp) {
      lastTimestamp = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);
    }

    const now = new Date();
    const startTime = lastTimestamp;

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
          <h1 className="text-2xl font-bold text-black">
            Technology Transferred Project
          </h1>
          <p className="text-base text-black">Monitoring and Control System</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={buttonClass("home", view) + " flex items-center gap-1"}
            onClick={() => setView("home")}
          >
            <HomeIcon className="h-4 w-5" />
            <span className="hidden md:inline">Home</span>
          </button>

          <button
            className={
              buttonClass("dashboard", view) + " flex items-center gap-1"
            }
            onClick={() => setView("dashboard")}
          >
            <ChartBarIcon className="h-4 w-5" />
            <span className="hidden md:inline">Dashboard</span>
          </button>

          <div className="bg-neutral-100 px-4 py-2 rounded text-black">
            <Clock />
          </div>
        </div>
      </nav>

      {view === "dashboard" && (
        <div className="min-h-screen p-4 bg-neutral-100 text-black">
          <div className="flex items-center justify-start mb-6">
            <select
              className="p-2 rounded-lg border border-gray-300 shadow text-black"
              value={selectedDeviceIndex}
              onChange={(e) => setSelectedDeviceIndex(Number(e.target.value))}
            >
              <option value={-1}>All Devices</option>
              {devices.map((device, index) => (
                <option key={index} value={index}>
                  {device.name || `Device ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* All Devices */}
          {selectedDeviceIndex === -1 ? (
            <>
              <h2 className="text-xl font-bold mb-4">
                Combined Realtime Power
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={combineHistory(devices)}>
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="timeLabel" />
                  <YAxis
                    label={{
                      value: "POWER (W)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      style: { textAnchor: "middle", fill: "#000" },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border p-2 rounded shadow-md text-sm">
                            <div>{data.fullLabel}</div>
                            <div className="font-semibold">
                              {data.deviceName}
                            </div>
                            <div className="text-red-500">
                              Energy : {data.Energy}
                            </div>
                            <div className="text-blue-500">
                              Current : {data.Current}
                            </div>
                            <div className="text-yellow-500">
                              Power : {data.Power}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {devices.map((device) => (
                    <Line
                      key={device.name}
                      type="monotone"
                      dataKey={(entry) =>
                        entry.deviceName === device.name ? entry.Power : null
                      }
                      name={device.name}
                      stroke={DEVICE_COLORS[device.name] || "#8884d8"}
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              <h2 className="text-xl font-bold mt-8 mb-4">
                Last 30 Days Energy Summary
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart
                  data={combineLast30DaysEnergy(devices)}
                  barCategoryGap={0}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    label={{
                      value: "ENERGY (kWh)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 2,
                      style: {
                        textAnchor: "middle",
                        fill: "#000",
                      },
                    }}
                  />
                  <Tooltip
                    formatter={(value) => parseFloat(value).toFixed(3)}
                  />
                  <Legend />

                  {devices.map((device) => (
                    <Bar
                      key={device.name}
                      dataKey={device.name}
                      fill={DEVICE_COLORS[device.name]}
                      name={device.name}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>

              <h2 className="text-xl font-bold mt-8 mb-4">
                Last 12 Months Energy Summary
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart
                  data={combineLast12MonthsEnergy(devices)}
                  barCategoryGap={0}
                  barGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    label={{
                      value: "ENERGY (kWh)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 2,
                      style: {
                        textAnchor: "middle",
                        fill: "#000",
                      },
                    }}
                  />
                  <Tooltip
                    formatter={(value) => parseFloat(value).toFixed(3)}
                  />
                  <Legend />

                  {devices.map((device) => (
                    <Bar
                      key={device.name}
                      dataKey={device.name}
                      fill={DEVICE_COLORS[device.name]}
                      name={device.name}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </>
          ) : (
            (() => {
              const { name, data, history } =
                devices[selectedDeviceIndex] || {};
              const last30DaysData = getLast30DaysData(history);
              const last12MonthsData = getLast12MonthsData(history);
              const isOnline = data?.Status === "ON";
              const uptimeDisplay = getUptimeDisplay(data?.Timestamp, isOnline);
              const { today, month } = calculateEnergyTotals(history);

              return (
                <div key={selectedDeviceIndex} className="mb-12">
                  <h2 className="text-2xl font-bold mb-4">{name}</h2>

                  {/* Radial Meters and Realtime Trend */}
                  <div className="flex flex-col md:flex-row gap-6 my-6">
                    <div className="bg-white p-6 rounded-lg shadow w-full md:w-1/2">
                      <h3 className="text-lg font-bold mb-4">Realtime Usage</h3>
                      <div className="flex flex-wrap justify-between gap-4">
                        <RadialMeter
                          value={Math.round(data?.Voltage || 0)}
                          unit="Voltage (V)"
                          max={300}
                          color="#FF6384"
                        />
                        <RadialMeter
                          value={data?.Current || 0}
                          unit="Current (A)"
                          max={10}
                          color="#36A2EB"
                        />
                        <RadialMeter
                          value={data?.Power || 0}
                          unit="Power (W)"
                          max={10}
                          color="#FFCE56"
                        />
                        <RadialMeter
                          value={data?.Energy || 0}
                          unit="Energy (kWh)"
                          max={10}
                          color="#4BC0C0"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow w-full lg:w-1/2">
                      <h3 className="text-lg font-bold mb-2">Realtime Trend</h3>
                      {Array.isArray(history) && history.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <LineChart
                            data={history
                              .slice()
                              .sort((a, b) => {
                                const dateA =
                                  a.Timestamp?.toDate?.() ||
                                  new Date(a.Timestamp);
                                const dateB =
                                  b.Timestamp?.toDate?.() ||
                                  new Date(b.Timestamp);
                                return dateB - dateA;
                              })
                              .slice(0, 10)
                              .map((entry) => {
                                const date =
                                  entry.Timestamp?.toDate?.() ||
                                  new Date(entry.Timestamp);
                                return {
                                  ...entry,
                                  Power: parseFloat(entry.Power || 0).toFixed(
                                    2
                                  ),
                                  timeLabel: date.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  }),
                                  fullLabel: date.toLocaleString(),
                                };
                              })}
                          >
                            <CartesianGrid stroke="#ccc" />
                            <XAxis dataKey="timeLabel" />
                            <YAxis
                              domain={[0, 10]}
                              label={{
                                value: "POWER (W)",
                                angle: -90,
                                position: "insideLeft",
                                offset: 10,
                                style: { textAnchor: "middle", fill: "#000" },
                              }}
                            />

                            <Tooltip
                              labelFormatter={(label, payload) =>
                                payload?.[0]?.payload?.fullLabel || label
                              }
                            />
                            <Line
                              type="monotone"
                              dataKey="Energy"
                              stroke="#ff4c7b"
                            />
                            <Line
                              type="monotone"
                              dataKey="Current"
                              stroke="#36A2EB"
                            />
                            <Line
                              type="monotone"
                              dataKey="Power"
                              stroke="#FFCE56"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-gray-500">Loading chart...</p>
                      )}
                    </div>
                  </div>

                  {/* Status and Energy Cards */}
                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <div className="bg-white p-4 rounded shadow w-[200px] text-center">
                      <p className="text-sm font-semibold">Status</p>
                      <p
                        className={`text-lg font-bold ${
                          isOnline ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {data?.Status || "N/A"}
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

                  {/* Bar charts for Last 30 days and Last 12 months */}
                  <div className="flex flex-col lg:flex-row gap-6 w-full">
                    <div className="bg-white p-4 rounded shadow w-full lg:w-1/2">
                      <h3 className="text-lg font-bold mb-2">
                        Last 30 Days (kWh)
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={last30DaysData}>
                          <CartesianGrid stroke="#ccc" />
                          <XAxis dataKey="date" />
                          <YAxis
                            label={{
                              value: "Energy (kWh)",
                              angle: -90,
                              position: "insideLeft",
                              offset: 2,
                              style: {
                                textAnchor: "middle",
                                fill: "#000",
                                fontSize: 12,
                              },
                            }}
                          />

                          <Tooltip formatter={(value) => `${value} kWh`} />
                          <Bar dataKey="kWh" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white p-4 rounded shadow w-full lg:w-1/2">
                      <h3 className="text-lg font-bold mb-2">
                        Last 12 Months (kWh)
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={last12MonthsData}>
                          <CartesianGrid stroke="#ccc" />
                          <XAxis dataKey="month" />
                          <YAxis
                            label={{
                              value: "Energy (kWh)",
                              angle: -90,
                              position: "insideLeft",
                              offset: 2,
                              style: {
                                textAnchor: "middle",
                                fill: "#000",
                                fontSize: 12,
                              },
                            }}
                          />
                          <Tooltip formatter={(value) => `${value} kWh`} />
                          <Bar dataKey="kWh" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}
    </>
  );
};

export default DashboardStats;
