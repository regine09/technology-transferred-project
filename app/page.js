'use client';

import React, { useEffect, useState } from 'react';
import DashboardStats from './DashboardStats';
import { db } from './firebaseConfig';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';

const deviceConfigs = [
  { label: 'Device 1', collection: 'ESP32_Data' },
  { label: 'Device 2', collection: 'ESP32_Data_D2' },
  { label: 'Device 3', collection: 'ESP32_Data_D3' },
  { label: 'Device 4', collection: 'ESP32_Data_D4' },
  { label: 'Device 5', collection: 'ESP32_Data_D5' }
];

export default function Page() {
  const [view, setView] = useState('home');
  const [devicesData, setDevicesData] = useState([]);
  const [history, setHistory] = useState([]);
  const [device1History, setDevice1History] = useState([]);
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
          const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            deviceName: device.label
          }));
          data.push({
            ...device,
            latest: docs[0] || null,
            history: docs
          });
        } else {
          data.push({ ...device, latest: null, history: [] });
        }
      }

      setDevicesData(data);
      setHistory(
        data.flatMap(d => d.history).sort((a, b) => {
          const t1 = a.Timestamp?.toDate?.() ?? new Date(a.Timestamp);
          const t2 = b.Timestamp?.toDate?.() ?? new Date(b.Timestamp);
          return t2 - t1;
        })
      );
    };

    fetchDeviceData();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'ESP32_Data'), orderBy('Timestamp', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDevice1History(docs.reverse()); 
    });

    return () => unsubscribe(); 
  }, []);

  const filteredHistory = history.filter(item =>
    Object.values(item).some(val =>
      typeof val === 'string' && val.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );


  const displayedHistory = showAll ? filteredHistory : filteredHistory.slice(0, rowsToShow);

  const renderDeviceCard = (device, index) => {
    const d = device.latest;
    return (
      <div key={index} className="border rounded-lg p-6 shadow w-full sm:w-70 md:w-72 lg:w-55 bg-white text-black">
        <h3 className="ml-2 text-black text-xl font-semibold">{device.label.toUpperCase()}</h3>
        {d ? (
          <>
            <p><strong>Timestamp:</strong> {d.Timestamp?.toString()}</p>
            <p><strong>WiFi Status:</strong> {d.WiFiStatus === 'Connected' ? (
                <span className="text-black-600">Connected</span>
              ) : (
                <span className="text-grey-600">Connecting</span>
              )}</p>
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

  const renderContent = () => {
    if (view === 'dashboard') 
      return null;

    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 mb-8 justify-items-center">
          {devicesData.map(renderDeviceCard)}
        </div>

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
                      <td className="p-2">{item.Power?.toFixed(2)} W</td>
                      <td className="p-2">{item.Voltage?.toFixed(1)} V</td>
                      <td className="p-2">{item.Latitude}, {item.Longitude}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
  };

  const device1Data = devicesData.find(device => device.label === 'Device 1')?.latest;

  return (
    <>
      <DashboardStats
  view={view}
  setView={setView}
  devices={devicesData.map(device => ({
    name: device.label,
    data: device.latest,
    history: device.history
  }))}
/>

      {renderContent()}
    </>
  );
}