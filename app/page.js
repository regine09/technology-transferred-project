'use client';

import React, { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import {
  collection,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';

const deviceConfigs = [
  { label: 'Device 1', collection: 'ESP32_Data' },
  { label: 'Device 2', collection: 'ESP32_Data_D2' },
  { label: 'Device 3', collection: 'ESP32_Data_D3' },
  { label: 'Device 4', collection: null }, // Placeholder
  { label: 'Device 5', collection: null }  // Placeholder
];

export default function Home() {
  const [devicesData, setDevicesData] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const rowsToShow = 13;

  useEffect(() => {
    const fetchDeviceData = async () => {
      const data = [];

      for (const device of deviceConfigs) {
        if (device.collection) {
          const q = query(collection(db, device.collection), orderBy('Timestamp', 'desc'));
          const querySnapshot = await getDocs(q);
          const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), deviceName: device.label }));
          data.push({ ...device, latest: docs[0] || null, history: docs });
        } else {
          data.push({ ...device, latest: null, history: [] });
        }
      }

      setDevicesData(data);
      setHistory(
        data.flatMap(d => d.history).sort((a, b) => {
          const t1 = a.Timestamp?.toDate?.() ?? new Date(a.Timestamp);
          const t2 = b.Timestamp?.toDate?.() ?? new Date(b.Timestamp);
          return t2 - t1; // descending
        })
      );
    };

    fetchDeviceData();
  }, []);

  const filteredHistory = history.filter(item => {
    return Object.values(item).some(val =>
      typeof val === 'string' && val.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const displayedHistory = showAll ? filteredHistory : filteredHistory.slice(0, rowsToShow);

  const renderDeviceCard = (device, index) => {
    const d = device.latest;
    return (
      <div key={index} className="border rounded-lg p-6 shadow w-80 sm:w-70 bg-white text-black">
        <h3 className="ml-2 w-40 text-black">{device.label.toUpperCase()}</h3>
        {d ? (
          <>
            <p><strong>Timestamp:</strong> {d.Timestamp?.toString()}</p>
            <p><strong>Status:</strong> <span className={d.Status === 'ON' ? 'text-green-600' : 'text-red-600'}>{d.Status}</span></p>
            <p><strong>Current:</strong> {d.Current} A</p>
            <p><strong>Energy:</strong> {d.Energy} kWh</p>
            <p><strong>Power:</strong> {d.Power} W</p>
            <p><strong>Voltage:</strong> {d.Voltage} V</p>
            <p><strong>Location:</strong> {d.Latitude}, {d.Longitude}</p>
          </>
        ) : (
          <p className="ml-2 w-40 text-black">No data available</p>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="text-center mb-6 text-black">
        <h1 className="text-3xl font-bold">Technology Transferred project</h1>
        <h2 className="text-xl font-medium">Monitoring System</h2>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-8 justify-items-center">
        {devicesData.map(renderDeviceCard)}
      </div>

      {/* History Table */}
      <div className="bg-white p-6 rounded shadow max-w-full overflow-x-auto text-black">
        <h3 className="text-xl font-semibold mb-2">HISTORY</h3>
        <div className="flex justify-between mb-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border px-2 py-1 rounded w-full max-w-xs"
          />
        </div>

        {/* Scrollable History Table when 'See More' is triggered */}
        <div style={{ maxHeight: showAll ? '500px' : 'auto', overflowY: showAll ? 'auto' : 'unset' }}>
          <table className="table-auto w-full text-sm text-black">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Device Name</th>
                <th className="p-2 text-left">Timestamp</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Current</th>
                <th className="p-2 text-left">Energy</th>
                <th className="p-2 text-left">Power</th>
                <th className="p-2 text-left">Voltage</th>
                <th className="p-2 text-left">Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-2 text-center text-black">No data available</td>
                </tr>
              ) : (
                displayedHistory.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{item.deviceName}</td>
                    <td className="p-2">{item.Timestamp?.toString() || 'N/A'}</td>
                    <td className="p-2">
                      <span className={item.Status === 'ON' ? 'text-green-600' : 'text-red-600'}>{item.Status}</span>
                    </td>
                    <td className="p-2">{item.Current} A</td>
                    <td className="p-2">{item.Energy} kWh</td>
                    <td className="p-2">{item.Power} W</td>
                    <td className="p-2">{item.Voltage} V</td>
                    <td className="p-2">{item.Latitude}, {item.Longitude}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* See More Button */}
        {filteredHistory.length > rowsToShow && (
          <div className="relative mt-4">
            <button
              onClick={() => setShowAll(!showAll)}
              className="absolute bottom-0 right-0 text-black hover:text-gray-600"
            >
              {showAll ? 'See Less' : 'See More'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
