/**
 * Detect local network IP address using WebRTC.
 * Falls back to localStorage override or hostname.
 */
export async function getLocalIP(): Promise<string> {
  // Check for manual override in localStorage
  const override = localStorage.getItem('docwise-ip-override');
  if (override) return override;

  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return new Promise<string>((resolve) => {
      const timeout = setTimeout(() => {
        pc.close();
        resolve(window.location.hostname || 'localhost');
      }, 3000);

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const match = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match && match[1] !== '0.0.0.0' && !match[1].startsWith('127.')) {
          clearTimeout(timeout);
          pc.close();
          resolve(match[1]);
        }
      };
    });
  } catch {
    return window.location.hostname || 'localhost';
  }
}

export function setIPOverride(ip: string): void {
  if (ip.trim()) {
    localStorage.setItem('docwise-ip-override', ip.trim());
  } else {
    localStorage.removeItem('docwise-ip-override');
  }
}

export function getIPOverride(): string {
  return localStorage.getItem('docwise-ip-override') || '';
}
