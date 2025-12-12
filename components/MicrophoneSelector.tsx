
import React, { useEffect, useState } from 'react';

interface MicrophoneSelectorProps {
  selectedDeviceId: string;
  onSelect: (deviceId: string) => void;
  disabled: boolean;
  optional?: boolean; // New prop to allow "None" selection
  label: string; // Dynamic label from translation
}

const MicrophoneSelector: React.FC<MicrophoneSelectorProps> = ({ selectedDeviceId, onSelect, disabled, optional = false, label }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Check if we already have permission (labels will be visible)
        // If not, we list devices anyway, but labels might be empty strings until permission is granted elsewhere
        const deviceInfos = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = deviceInfos.filter(d => d.kind === 'audioinput');
        setDevices(audioInputs);
        
        // Check if we have labels (proxy for permission)
        const haveLabels = audioInputs.some(d => d.label.length > 0);
        setHasPermission(haveLabels);

        // If current selection is empty...
        if (!selectedDeviceId && audioInputs.length > 0) {
            // Only auto-select default if NOT optional
            if (!optional) {
                onSelect('default');
            }
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };

    getDevices();

    // Listen for device changes (plugging/unplugging)
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, [selectedDeviceId, onSelect, optional]);

  // If no devices found yet or permission blocked/pending
  if (devices.length === 0) return null;

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-slate-400">
          {label}
      </label>
      <div className="relative">
        <select
          value={selectedDeviceId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled}
          className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 disabled:opacity-50 appearance-none truncate pr-8"
        >
          {optional && (
              <option value="">No Trigger (Disabled)</option>
          )}
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${index + 1} (Label unavailable)`}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
      {!hasPermission && (
        <p className="text-[10px] text-amber-500 mt-1">
          Note: Device names may be hidden until microphone permission is granted.
        </p>
      )}
    </div>
  );
};

export default MicrophoneSelector;