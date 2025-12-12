// @ts-ignore
declare var Peer: any;

export class BroadcastService {
  private peer: any = null;
  private connections: any[] = [];
  private myId: string = '';

  constructor() {}

  // Initialize as Host (Translator)
  initHost(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a random ID (or let PeerJS create one)
      this.peer = new Peer(this.generateShortId(), { debug: 1 });

      this.peer.on('open', (id: string) => {
        this.myId = id;
        console.log("Broadcast Host ID:", id);
        resolve(id);
      });

      this.peer.on('connection', (conn: any) => {
        console.log("New listener connected:", conn.peer);
        this.connections.push(conn);
        
        conn.on('close', () => {
          this.connections = this.connections.filter(c => c !== conn);
        });
      });

      this.peer.on('error', (err: any) => reject(err));
    });
  }

  // Initialize as Guest (Listener)
  initGuest(hostId: string, onAudioData: (data: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer({ debug: 1 });

      this.peer.on('open', () => {
        const conn = this.peer.connect(hostId);

        conn.on('open', () => {
          console.log("Connected to Host:", hostId);
          resolve();
        });

        conn.on('data', (data: any) => {
            // Assume data is { type: 'audio', payload: base64 }
            if (data && data.type === 'audio') {
                onAudioData(data.payload);
            }
        });

        conn.on('error', (err: any) => reject(err));
        
        // Keep reference to connection if needed
        this.connections.push(conn);
      });
      
      this.peer.on('error', (err: any) => reject(err));
    });
  }

  // Broadcast Audio Chunk to all listeners
  broadcastAudio(base64Data: string) {
    if (this.connections.length === 0) return;

    const packet = { type: 'audio', payload: base64Data };
    
    this.connections.forEach(conn => {
        if (conn.open) {
            conn.send(packet);
        }
    });
  }

  disconnect() {
    this.connections.forEach(c => c.close());
    this.connections = [];
    if (this.peer) {
        this.peer.destroy();
        this.peer = null;
    }
  }

  private generateShortId(): string {
    // Generate a 4-letter readable code for easier typing
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const broadcastService = new BroadcastService();