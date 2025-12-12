

import React, { useEffect, useState } from 'react';
import MicrophoneSelector from '../MicrophoneSelector';
import SpeakerSelector from '../SpeakerSelector';
import { TranslationMode, UIText } from '../../types';
import { gatewayService, GatewayStatus } from '../../services/gatewayService';

interface AudioSetupStepProps {
  selectedMode: TranslationMode;
  selectedMicId: string;
  onSelectMicId: (id: string) => void;
  selectedTriggerMicId: string;
  onSelectTriggerMicId: (id: string) => void;
  selectedSpeakerId: string;
  onSelectSpeakerId: (id: string) => void;
  uiText: UIText['audioStep'];
  onBack: () => void;
  onStartSession: () => void;
}

const AudioSetupStep: React.FC<AudioSetupStepProps> = ({
  selectedMode,
  selectedMicId,
  onSelectMicId,
  selectedTriggerMicId,
  onSelectTriggerMicId,
  selectedSpeakerId,
  onSelectSpeakerId,
  uiText,
  onBack,
  onStartSession
}) => {
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>('DISCONNECTED');

  useEffect(() => {
      // Check initial status
      setGatewayStatus(gatewayService.getStatus());
      // Subscribe to changes
      const unsub = gatewayService.onStatusChange(setGatewayStatus);
      return unsub;
  }, []);

  return (
    <div className="w-full max-w-lg bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-sm animate-fade-in">
        <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-white">{uiText.title}</h2>
            <p className="text-slate-400 text-sm">{uiText.subtitle}</p>
        </div>

        <div className="space-y-4">
            <div className="flex flex-col space-y-2">
                <MicrophoneSelector 
                    selectedDeviceId={selectedMicId} 
                    onSelect={onSelectMicId} 
                    disabled={false} 
                    label={uiText.micLabel}
                />
                
                {/* PRO CLIENT: GATEWAY OPTION */}
                {gatewayStatus === 'CONNECTED' && (
                    <div className="bg-slate-900/50 p-2 rounded border border-cyan-500/30 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <span className="text-cyan-400">🔌</span>
                             <span className="text-xs text-cyan-400 font-bold">Gateway Connected</span>
                         </div>
                         <button 
                             onClick={() => onSelectMicId('gateway')}
                             className={`text-xs px-2 py-1 rounded font-bold transition-colors ${
                                 selectedMicId === 'gateway' 
                                 ? 'bg-cyan-600 text-white' 
                                 : 'bg-slate-700 text-slate-300 hover:text-white'
                             }`}
                         >
                             Use NDI Source
                         </button>
                    </div>
                )}
            </div>
            
            {(selectedMode === TranslationMode.PRESENTATION || selectedMode === TranslationMode.SIMULTANEOUS || selectedMode === TranslationMode.FLUID) && (
                <div className="pl-4 border-l-2 border-green-500/30">
                     <div className="flex flex-col space-y-2">
                        <MicrophoneSelector 
                            selectedDeviceId={selectedTriggerMicId} 
                            onSelect={onSelectTriggerMicId} 
                            disabled={false} 
                            optional={true}
                            label={uiText.triggerLabel}
                        />
                     </div>
                     <p className="text-[10px] text-slate-500 mt-1">{uiText.triggerDesc}</p>
                </div>
            )}
            
            <div className="flex flex-col space-y-2">
                <SpeakerSelector 
                    selectedDeviceId={selectedSpeakerId}
                    onSelect={onSelectSpeakerId}
                    disabled={false}
                    label={uiText.speakerLabel}
                />
            </div>
        </div>

        <div className="flex space-x-3 pt-6">
            <button
                onClick={onBack}
                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
                {uiText.backButton}
            </button>
            <button
                onClick={onStartSession}
                className="flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors flex justify-center items-center shadow-lg shadow-cyan-900/50"
            >
                {uiText.startButton}
            </button>
        </div>
    </div>
  );
};

export default AudioSetupStep;