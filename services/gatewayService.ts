


export type GatewayStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
export type MutexState = 'OPEN' | 'LOCKED';

export interface GatewayMessage {
    type: 'log' | 'error' | 'status' | 'mutex';
    message?: string;
    state?: MutexState;
    owner?: string;
}

/**
 * Service to handle communication with the local C++ MeetingBridge (Gateway).
 * 
 * Protocol: WebSocket on ws://localhost:8081
 * Command Structure: { "command": "connect", "target": "NDI_SOURCE_NAME" }
 * Audio Data: Binary Blob/ArrayBuffer (Float32 PCM, 48kHz)
 */
class GatewayService {
    private ws: WebSocket | null = null;
    private status: GatewayStatus = 'DISCONNECTED';
    private mutexState: MutexState = 'OPEN';
    private mutexOwner: string = '';
    
    // Simple event listeners
    private statusListeners: Set<(status: GatewayStatus) => void> = new Set();
    private messageListeners: Set<(msg: GatewayMessage) => void> = new Set();
    private audioListeners: Set<(data: ArrayBuffer) => void> = new Set();
    private mutexListeners: Set<(state: MutexState, owner: string) => void> = new Set();

    constructor() {
        this.status = 'DISCONNECTED';
    }

    public connect(url: string = 'ws://localhost:8081'): void {
        if (this.ws) {
            console.warn("Gateway already connected or connecting.");
            return;
        }

        this.updateStatus('CONNECTING');

        try {
            this.ws = new WebSocket(url);
            this.ws.binaryType = 'arraybuffer'; // Critical for receiving audio
            
            this.ws.onopen = () => {
                console.log("Gateway Connected");
                this.updateStatus('CONNECTED');
            };

            this.ws.onclose = () => {
                console.log("Gateway Disconnected");
                this.updateStatus('DISCONNECTED');
                this.ws = null;
            };

            this.ws.onerror = (e) => {
                console.error("Gateway Error", e);
                this.updateStatus('ERROR');
            };

            this.ws.onmessage = (event) => {
                if (event.data instanceof ArrayBuffer) {
                    // Binary Audio Data (PCM)
                    this.notifyAudio(event.data);
                } else if (typeof event.data === 'string') {
                    // Text / Control Message
                    try {
                        const data = JSON.parse(event.data);
                        
                        if (data.type === 'mutex') {
                            this.updateMutex(data.state, data.owner);
                        }
                        
                        this.notifyMessage({ 
                            type: data.type || 'log', 
                            message: data.message || JSON.stringify(data),
                            state: data.state,
                            owner: data.owner
                        });
                    } catch(e) {
                        this.notifyMessage({ type: 'log', message: event.data });
                    }
                }
            };

        } catch (e) {
            console.error("Failed to create WebSocket", e);
            this.updateStatus('ERROR');
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.updateStatus('DISCONNECTED');
    }

    /**
     * Send a command to the C++ Backend to switch NDI source.
     */
    public sendConnectCommand(target: string): void {
        if (!this.ws || this.status !== 'CONNECTED') {
            console.warn("Gateway not connected. Cannot send command.");
            return;
        }

        const payload = JSON.stringify({
            command: 'connect',
            target: target
        });
        
        this.ws.send(payload);
        this.notifyMessage({ type: 'log', message: `CMD SENT: ${payload}` });
    }

    public getStatus(): GatewayStatus {
        return this.status;
    }

    public getMutexState(): { state: MutexState, owner: string } {
        return { state: this.mutexState, owner: this.mutexOwner };
    }

    public onStatusChange(callback: (status: GatewayStatus) => void): () => void {
        this.statusListeners.add(callback);
        callback(this.status);
        return () => this.statusListeners.delete(callback);
    }

    public onMessage(callback: (msg: GatewayMessage) => void): () => void {
        this.messageListeners.add(callback);
        return () => this.messageListeners.delete(callback);
    }

    public onAudio(callback: (data: ArrayBuffer) => void): () => void {
        this.audioListeners.add(callback);
        return () => this.audioListeners.delete(callback);
    }

    public onMutexChange(callback: (state: MutexState, owner: string) => void): () => void {
        this.mutexListeners.add(callback);
        callback(this.mutexState, this.mutexOwner);
        return () => this.mutexListeners.delete(callback);
    }

    private updateStatus(newStatus: GatewayStatus) {
        this.status = newStatus;
        this.statusListeners.forEach(cb => cb(newStatus));
    }

    private updateMutex(state: MutexState, owner: string = '') {
        this.mutexState = state;
        this.mutexOwner = owner;
        this.mutexListeners.forEach(cb => cb(state, owner));
    }

    private notifyMessage(msg: GatewayMessage) {
        this.messageListeners.forEach(cb => cb(msg));
    }

    private notifyAudio(data: ArrayBuffer) {
        this.audioListeners.forEach(cb => cb(data));
    }
}

export const gatewayService = new GatewayService();