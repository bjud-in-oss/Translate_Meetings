
import React, { useEffect, useState } from 'react';

interface SpeakerSelectorProps {
  selectedDeviceId: string;
  onSelect: (deviceId: string) => void;
  disabled: boolean;
  label: string;
}

const SpeakerSelector: React.FC<SpeakerSelectorProps> = ({ selectedDeviceId, onSelect, disabled, label }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    // Check if setSinkId is likely supported (HTMLMediaElement.prototype.setSinkId)
    if (!('setSinkId' in HTMLMediaElement.prototype)) {
      setIsSupported(false);
      return;
    }

    const getDevices = async () => {
      try {
        const deviceInfos = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = deviceInfos.filter(d => d.kind === 'audiooutput');
        setDevices(audioOutputs);
        
        // If current selection is empty and we have devices, default to the first one or 'default'
        if (!selectedDeviceId && audioOutputs.length > 0) {
            onSelect('default');
        }
      } catch (error) {
        console.error("Error fetching output devices:", error);
      }
    };

    getDevices();

    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, [selectedDeviceId, onSelect]);

  if (!isSupported) return null; // Hide if browser doesn't support output selection
  if (devices.length === 0) return null;

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-slate-400">{label}</label>
      <div className="relative">
        <select
          value={selectedDeviceId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled}
          className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 disabled:opacity-50 appearance-none truncate pr-8"
        >
          {devices.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Speaker ${index + 1} (Label unavailable)`}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SpeakerSelector;