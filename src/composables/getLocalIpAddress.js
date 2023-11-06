// THIS DOES NOT WORK
export default function useGetLocalIpAddress() {
  async function getLocalIPAddress() {
    console.log('STARTING')
    window.RTCPeerConnection = window.RTCPeerConnection ||
      window.mozRTCPeerConnection ||
      window.webkitRTCPeerConnection;

    if (window.RTCPeerConnection) {
      const pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302"
          },
          {
            urls: "stun:stun.services.mozilla.com"
          }
        ]
      });

      const parseCandidate = (line) => {
        const ipPattern = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const ipMatch = ipPattern.exec(line);
        return ipMatch && ipMatch[1];
      };

      console.log('RIGHT BEFORE PROMISE CREATE')
      const promise = new Promise((resolve) => {
        console.log('inside promise')
        pc.onicecandidate = (iceEvent) => {
          if (iceEvent.candidate) {
            const ip = parseCandidate(iceEvent.candidate.candidate);
            if (ip) {
              resolve(ip);
              pc.close();
            }
          }
        };
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            console.log('resolving with no ip :(')
            resolve('');
            pc.close();
          }
        };
      });

      console.log('RIGHT BEFORE CREATE OFFER')
      const offer = await pc.createOffer();
      console.log('RIGHT BEFORE SET LOCAL DESCRIPTION')
      await pc.setLocalDescription(offer);

      return promise;
    } else {
      console.log('RTCPeerConnection is not supported')
      return ''; // Return an empty string if RTCPeerConnection is not supported
    }
  }

  return getLocalIPAddress
}
