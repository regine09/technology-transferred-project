"use client";

import React, { useEffect, useState } from "react";
import DashboardStats from "./DashboardStats";
import { db } from "./firebaseConfig";
import { ExportPDFDropdown } from "./ExportPDFDropdown";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const deviceConfigs = [
  { label: "Device 1", collection: "ESP32_Data" },
  { label: "Device 2", collection: "ESP32_Data_D2" },
  { label: "Device 3", collection: "ESP32_Data_D3" },
  { label: "Device 4", collection: "ESP32_Data_D4" },
  { label: "Device 5", collection: "ESP32_Data_D5" },
];

export default function Page() {
  const [view, setView] = useState("home");
  const [devicesData, setDevicesData] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [addresses, setAddresses] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("All Devices");

  const rowsToShow = 13;

  useEffect(() => {
    const fetchDeviceData = async () => {
      const data = [];
      const addr = {};

      for (const device of deviceConfigs) {
        if (device.collection) {
          const q = query(
            collection(db, device.collection),
            orderBy("Timestamp", "desc"),
      
          );
          const querySnapshot = await getDocs(q);
          const docs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            deviceName: device.label,
          }));

          const latestDoc = docs[0];
          if (latestDoc?.address) {
            addr[device.label] = latestDoc.address;
          }

          data.push({
            ...device,
            latest: latestDoc || null,
            history: docs,
          });
        } else {
          data.push({ ...device, latest: null, history: [] });
        }
      }

      setDevicesData(data);
      setAddresses(addr);
      setHistory(
        data
          .flatMap((d) => d.history)
          .sort((a, b) => {
            const t1 = a.Timestamp?.toDate?.() ?? new Date(a.Timestamp);
            const t2 = b.Timestamp?.toDate?.() ?? new Date(b.Timestamp);
            return t2 - t1;
          })
      );
    };

    fetchDeviceData();
  }, []);

  const handleAddressChange = async (deviceLabel, address) => {
    setAddresses((prev) => ({ ...prev, [deviceLabel]: address }));
    const device = devicesData.find((d) => d.label === deviceLabel);
    if (device?.latest?.id && device?.collection) {
      const docRef = doc(db, device.collection, device.latest.id);
      await updateDoc(docRef, { address });
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchesQuery = Object.values(item).some(
      (val) =>
        typeof val === "string" &&
        val.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const timestamp = item.Timestamp?.toDate?.() ?? new Date(item.Timestamp);
    const withinRange =
      (!startDate || timestamp >= new Date(startDate)) &&
      (!endDate || timestamp <= new Date(endDate + "T23:59:59"));

    return matchesQuery && withinRange;
  });

  const displayedHistory = showAll
    ? filteredHistory
    : filteredHistory.slice(0, rowsToShow);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Device History Report", 14, 16);

    const deviceFilteredHistory = history.filter((item) => {
      const timestamp = item.Timestamp?.toDate?.() ?? new Date(item.Timestamp);

      const matchesDate =
        (!startDate || timestamp >= new Date(startDate)) &&
        (!endDate || timestamp <= new Date(endDate + "T23:59:59"));

      const matchesDevice =
        selectedDevice === "All Devices" || item.deviceName === selectedDevice;

      return matchesDate && matchesDevice;
    });

    if (deviceFilteredHistory.length === 0) {
      doc.text("No data available for selected filters.", 14, 30);
      doc.save("device_history.pdf");
      return;
    }

    const tableData = deviceFilteredHistory.map((item) => [
      item.deviceName,
      item.Timestamp?.toDate?.().toLocaleString() ?? item.Timestamp,
      item.Status,
      `${item.Current} A`,
      `${item.Energy} kWh`,
      `${item.Power?.toFixed(2)} W`,
      `${item.Voltage?.toFixed(1)} V`,
      item.Latitude && item.Longitude
        ? `${item.Latitude}, ${item.Longitude}`
        : "0,0",
      item.address || addresses[item.deviceName] || "N/A",
    ]);

    autoTable(doc, {
      startY: 20,
      head: [
        [
          "Device",
          "Timestamp",
          "Status",
          "Current",
          "Energy",
          "Power",
          "Voltage",
          "Location",
          "Address",
        ],
      ],
      body: tableData,
    });

    doc.save("device_history.pdf");
  };

  const renderDeviceCard = (device, index) => {
    const d = device.latest;
    return (
      <div
        key={index}
        className="border rounded-lg p-6 shadow w-full sm:w-70 md:w-72 lg:w-55 bg-white text-black"
      >
        <h3 className="ml-2 text-xl font-semibold">
          {device.label.toUpperCase()}
        </h3>
        {d ? (
          <>
            <p>
              <strong>Timestamp:</strong> {d.Timestamp?.toString()}
            </p>
            <p>
              <strong>WiFi Status:</strong>{" "}
              {d.WiFiStatus === "Connected" ? (
                <span className="text-black-600">Connected</span>
              ) : (
                <span className="text-grey-600">Connecting</span>
              )}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={
                  d.Status === "ON" ? "text-green-600" : "text-red-600"
                }
              >
                {d.Status}
              </span>
            </p>
            <p>
              <strong>Current:</strong> {d.Current} A
            </p>
            <p>
              <strong>Energy:</strong> {d.Energy} kWh
            </p>
            <p>
              <strong>Power:</strong> {d.Power} W
            </p>
            <p>
              <strong>Voltage:</strong> {parseFloat(d.Voltage).toFixed(1)} V
            </p>
            <p>
              <strong>Location:</strong> {d.Latitude}, {d.Longitude}
            </p>
            <input
              type="text"
              placeholder="Enter address"
              value={addresses[device.label] || ""}
              onChange={(e) =>
                handleAddressChange(device.label, e.target.value)
              }
              className="mt-2 p-1 border rounded w-full"
            />
          </>
        ) : (
          <p>No data available</p>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (view === "dashboard") return null;

    return (
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 mb-8 justify-items-center">
          {devicesData.map(renderDeviceCard)}
        </div>

        <div className="bg-white p-6 rounded shadow max-w-full overflow-x-auto text-black">
          <h3 className="text-xl font-semibold mb-2">HISTORY</h3>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border px-2 py-1 rounded w-full max-w-xs"
              />
            </div>
            <ExportPDFDropdown
              exportToPDF={exportToPDF}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              selectedDevice={selectedDevice}
              setSelectedDevice={setSelectedDevice}
            />
          </div>

          <div
            style={{
              maxHeight: showAll ? "500px" : "auto",
              overflowY: showAll ? "auto" : "unset",
            }}
          >
            <table className="table-auto w-full text-sm text-black">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Device</th>
                  <th className="p-2 text-left">Timestamp</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Current</th>
                  <th className="p-2 text-left">Energy</th>
                  <th className="p-2 text-left">Power</th>
                  <th className="p-2 text-left">Voltage</th>
                  <th className="p-2 text-left">Location</th>
                  <th className="p-2 text-left">Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-2 text-center">
                      No data available
                    </td>
                  </tr>
                ) : (
                  displayedHistory.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{item.deviceName}</td>
                      <td className="p-2">
                        {item.Timestamp?.toString() || "N/A"}
                      </td>
                      <td className="p-2">
                        <span
                          className={
                            item.Status === "ON"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {item.Status}
                        </span>
                      </td>
                      <td className="p-2">{item.Current} A</td>
                      <td className="p-2">{item.Energy} kWh</td>
                      <td className="p-2">{item.Power?.toFixed(2)} W</td>
                      <td className="p-2">{item.Voltage?.toFixed(1)} V</td>
                      <td className="p-2">
                        {item.Latitude && item.Longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${item.Latitude},${item.Longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {item.Latitude}, {item.Longitude}
                          </a>
                        ) : (
                          "0,0"
                        )}
                      </td>
                      <td className="p-2">
                        {item.address || addresses[item.deviceName] || "N/A"}
                      </td>
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
                {showAll ? "See Less" : "See More"}
              </button>
            </div>
          )}
        </div>
      </main>
    );
  };

  return (
    <>
      <DashboardStats
        view={view}
        setView={setView}
        devices={devicesData.map((device) => ({
          name: device.label,
          data: device.latest,
          history: device.history,
        }))}
      />

      {renderContent()}
    </>
  );
}
