"use client";
import { useState, useRef } from "react";
import clsx from "clsx"; // optional for class joining

export default function AvailabilityGrid() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const times = ["8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30"];

  const [selected, setSelected] = useState<{ [key: string]: boolean }>({});
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef<string | null>(null);

  const handleMouseDown = (day: string, time: string) => {
    setIsDragging(true);
    startRef.current = `${day}-${time}`;
    setSelected(prev => ({ ...prev, [`${day}-${time}`]: !prev[`${day}-${time}`] }));
  };

  const handleMouseEnter = (day: string, time: string) => {
    if (!isDragging || !startRef.current) return;
    // For simplicity, select as we drag
    setSelected(prev => ({ ...prev, [`${day}-${time}`]: true }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    startRef.current = null;
  };

  return (
    <div
      onMouseUp={handleMouseUp}
      className="select-none border rounded-md p-4 bg-white"
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-16"></th>
            {days.map(day => (
              <th key={day} className="p-2 text-sm font-medium text-gray-600">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map(time => (
            <tr key={time}>
              <td className="text-sm text-gray-500 pr-2">{time}</td>
              {days.map(day => {
                const key = `${day}-${time}`;
                return (
                  <td
                    key={key}
                    onMouseDown={() => handleMouseDown(day, time)}
                    onMouseEnter={() => handleMouseEnter(day, time)}
                    className={clsx(
                      "border w-16 h-8 cursor-pointer transition-colors",
                      selected[key] ? "bg-green-500" : "bg-gray-100 hover:bg-gray-200"
                    )}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
