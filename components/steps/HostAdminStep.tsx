
import React, { useEffect, useState, useRef } from 'react';
import { gatewayService, GatewayStatus, GatewayMessage } from '../../services/gatewayService';
import { UIText } from '../../types';

interface HostAdminStepProps {
  uiText: UIText['hostStep'];
  onBack: () => void;
}

const HostAdminStep: React.FC<HostAdminStepProps> = ({ uiText, onBack }) => {
  const [gatewayUrl, setGatewayUrl] = useState('ws://localhost:8081');
  const [targetName, setTargetName] = useState('CHROMEBOOK');
  const [status, setStatus] = useState<GatewayStatus>('DISCONNECTED');
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to status updates
    const unsubStatus = gatewayService.onStatusChange(setStatus);
    
    // Subscribe to messages
    const unsubMsg = gatewayService.onMessage((msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${time}] [${msg.type.toUpperCase()}] ${msg.message}`].slice(-50)); // Keep last 50 logs
    });

    return () => {
        unsubStatus();
        unsubMsg();
    };
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleConnect = () => {
      if (status === 'CONNECTED') {
          gatewayService.disconnect();
      } else {
          gatewayService.connect(gatewayUrl);
      }
  };

  const handleSwitchSource = () => {
      if (!targetName.trim()) return;
      gatewayService.sendConnectCommand(targetName);
      setLogs(prev => [...prev, `[USER] Requesting switch to: ${targetName}`].slice(-50));
  };

  return (
    <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-md animate-fade-in flex flex-col h-[80vh]">
        <div className="space-y-2 flex justify-between items-start shrink-0">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-red-500">🛡️</span> {uiText.title}
                </h2>
                <p className="text-slate-400 text-xs">Configure Gateway Service (Bridge)</p>
            </div>
            <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
                ✕
            </button>
        </div>

        {/* CONNECTION CONFIG */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4 shrink-0">
             <div className="flex flex-col space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">{uiText.connectLabel}</label>
                 <div className="flex gap-2">
                     <input 
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono"
                        value={gatewayUrl}
                        onChange={(e) => setGatewayUrl(e.target.value)}
                        disabled={status === 'CONNECTED' || status === 'CONNECTING'}
                     />
                     <button 
                        onClick={handleConnect}
                        disabled={status === 'CONNECTING'}
                        className={`px-4 py-2 rounded font-bold text-sm transition-colors min-w-[100px] ${
                            status === 'CONNECTED' 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                     >
                        {status === 'CONNECTED' ? 'Disconnect' : (status === 'CONNECTING' ? '...' : 'Connect')}
                     </button>
                 </div>
             </div>
             
             <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded border border-slate-700/50">
                 <span className="text-xs text-slate-400 font-bold">{uiText.statusLabel}</span>
                 <div className="flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${
                         status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 
                         status === 'CONNECTING' ? 'bg-yellow-500 animate-bounce' : 
                         status === 'ERROR' ? 'bg-red-500' : 'bg-slate-600'
                     }`}></span>
                     <span className={`text-xs font-mono ${
                         status === 'CONNECTED' ? 'text-green-400' : 
                         status === 'ERROR' ? 'text-red-400' : 'text-slate-400'
                     }`}>{status}</span>
                 </div>
             </div>
        </div>

        {/* TARGET CONTROL */}
        <div className={`bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4 shrink-0 transition-opacity ${status !== 'CONNECTED' ? 'opacity-50 pointer-events-none' : ''}`}>
             <div className="flex flex-col space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">{uiText.targetLabel}</label>
                 <div className="flex gap-2">
                     <input 
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono placeholder:text-slate-700"
                        placeholder="e.g. PC-1 (ObsOutput)"
                        value={targetName}
                        onChange={(e) => setTargetName(e.target.value)}
                     />
                     <button 
                        onClick={handleSwitchSource}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-bold text-sm transition-colors shadow-lg shadow-cyan-900/20"
                     >
                        {uiText.switchButton}
                     </button>
                 </div>
             </div>
        </div>

        {/* CONSOLE */}
        <div className="flex-1 bg-black rounded-xl border border-slate-700 p-2 overflow-hidden flex flex-col font-mono text-[10px] shadow-inner">
            <div className="text-slate-500 border-b border-slate-800 pb-1 mb-1 px-1 flex justify-between">
                <span>GATEWAY LOGS</span>
                <button onClick={() => setLogs([])} className="hover:text-white">CLEAR</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 p-1 scrollbar-hide">
                {logs.length === 0 && <span className="text-slate-700 italic">No logs yet...</span>}
                {logs.map((log, i) => (
                    <div key={i} className="break-all">
                        <span className="text-slate-500 mr-2">{log.split('] ')[0]}]</span>
                        <span className="text-slate-300">{log.split('] ').slice(1).join('] ')}</span>
                    </div>
                ))}
                <div ref={logsEndRef}></div>
            </div>
        </div>

        <button
            onClick={onBack}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors shrink-0"
        >
            {uiText.backButton}
        </button>
    </div>
  );
};

export default HostAdminStep;
