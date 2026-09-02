class WebRTCService {
  constructor() {
    this.peerConnections = new Map();
    this.dataChannels = new Map();

    this.onMessage = null;
    this.onPeerStatus = null;

    this.configuration = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302"
        }
      ]
    };
  }

  setMessageHandler(handler) {
    this.onMessage = handler;
  }

  setPeerStatusHandler(handler) {
    this.onPeerStatus = handler;
  }

  createConnection(peerId, socket) {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId);
    }

    const peerConnection =
      new RTCPeerConnection(
        this.configuration
      );

    this.peerConnections.set(
      peerId,
      peerConnection
    );

    peerConnection.onicecandidate = (
      event
    ) => {
      if (!event.candidate) {
        return;
      }

      socket.emit(
        "webrtc:ice-candidate",
        {
          target: peerId,
          candidate: event.candidate
        }
      );
    };

    peerConnection.onconnectionstatechange =
      () => {
        const state =
          peerConnection.connectionState;

        console.log(
          `WebRTC ${peerId}: ${state}`
        );

        if (this.onPeerStatus) {
          this.onPeerStatus(
            peerId,
            state
          );
        }

        if (
          state === "failed" ||
          state === "closed"
        ) {
          this.removePeer(peerId);
        }
      };

    peerConnection.ondatachannel = (
      event
    ) => {
      const channel =
        event.channel;

      this.setupDataChannel(
        peerId,
        channel
      );
    };

    return peerConnection;
  }

  async createOffer(
    peerId,
    socket
  ) {
    const peerConnection =
      this.createConnection(
        peerId,
        socket
      );

    const dataChannel =
      peerConnection.createDataChannel(
        "synccode"
      );

    this.setupDataChannel(
      peerId,
      dataChannel
    );

    const offer =
      await peerConnection.createOffer();

    await peerConnection.setLocalDescription(
      offer
    );

    socket.emit(
      "webrtc:offer",
      {
        target: peerId,
        offer
      }
    );
  }

  async handleOffer(
    peerId,
    offer,
    socket
  ) {
    const peerConnection =
      this.createConnection(
        peerId,
        socket
      );

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(
        offer
      )
    );

    const answer =
      await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(
      answer
    );

    socket.emit(
      "webrtc:answer",
      {
        target: peerId,
        answer
      }
    );
  }

  async handleAnswer(
    peerId,
    answer
  ) {
    const peerConnection =
      this.peerConnections.get(
        peerId
      );

    if (!peerConnection) {
      return;
    }

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(
        answer
      )
    );
  }

  async handleIceCandidate(
    peerId,
    candidate
  ) {
    const peerConnection =
      this.peerConnections.get(
        peerId
      );

    if (!peerConnection) {
      return;
    }

    try {
      await peerConnection.addIceCandidate(
        new RTCIceCandidate(
          candidate
        )
      );
    } catch (error) {
      console.error(
        "ICE candidate error:",
        error
      );
    }
  }

  setupDataChannel(
    peerId,
    channel
  ) {
    this.dataChannels.set(
      peerId,
      channel
    );

    channel.onopen = () => {
      console.log(
        `WebRTC data channel open: ${peerId}`
      );

      if (this.onPeerStatus) {
        this.onPeerStatus(
          peerId,
          "connected"
        );
      }
    };

    channel.onclose = () => {
      console.log(
        `WebRTC data channel closed: ${peerId}`
      );
    };

    channel.onerror = (
      error
    ) => {
      console.error(
        "Data channel error:",
        error
      );
    };

    channel.onmessage = (
      event
    ) => {
      try {
        const message =
          JSON.parse(
            event.data
          );

        if (this.onMessage) {
          this.onMessage(
            peerId,
            message
          );
        }
      } catch (error) {
        console.error(
          "WebRTC message parse error:",
          error
        );
      }
    };
  }

  sendToPeer(
    peerId,
    message
  ) {
    const channel =
      this.dataChannels.get(
        peerId
      );

    if (
      !channel ||
      channel.readyState !==
        "open"
    ) {
      return false;
    }

    channel.send(
      JSON.stringify(
        message
      )
    );

    return true;
  }

  broadcast(
    message
  ) {
    let sent = 0;

    for (
      const [peerId, channel]
      of this.dataChannels
    ) {
      if (
        channel.readyState ===
        "open"
      ) {
        channel.send(
          JSON.stringify(
            message
          )
        );

        sent++;
      }
    }

    return sent;
  }

  removePeer(peerId) {
    const peerConnection =
      this.peerConnections.get(
        peerId
      );

    if (peerConnection) {
      peerConnection.close();
    }

    this.peerConnections.delete(
      peerId
    );

    this.dataChannels.delete(
      peerId
    );
  }

  disconnectAll() {
    for (
      const peerConnection
      of this.peerConnections.values()
    ) {
      peerConnection.close();
    }

    this.peerConnections.clear();
    this.dataChannels.clear();
  }
}

const webrtcService =
  new WebRTCService();

export default webrtcService;