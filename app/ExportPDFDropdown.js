import { useState } from 'react';

export function ExportPDFDropdown({
  exportToPDF,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedDevice,
  setSelectedDevice,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const deviceOptions = ['All Devices', 'Device 1', 'Device 2', 'Device 3', 'Device 4', 'Device 5'];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        Export PDF
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white border border-gray-300 rounded shadow-lg p-6 w-80 space-y-4 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border px-2 py-1 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border px-2 py-1 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Device</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full border px-2 py-1 rounded"
              >
                {deviceOptions.map((device) => (
                  <option key={device} value={device}>
                    {device}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                exportToPDF();
                setIsOpen(false);
              }}
              className="bg-black text-white px-4 py-2 rounded w-full hover:bg-gary-800"
            >
              Download PDF
            </button>
          </div>
        </div>
      )}
    </>
  );
}
