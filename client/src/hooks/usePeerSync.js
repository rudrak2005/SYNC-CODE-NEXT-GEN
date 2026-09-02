import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";


/*
 * ========================================
 * WEBRTC PEER SYNC HOOK
 * ========================================
 *
 * Responsibilities:
 *
 * 1. Create RTCPeerConnection
 * 2. Handle WebRTC offer/answer
 * 3. Handle ICE candidates
 * 4. Handle DataChannel
 * 5. Prevent offer collision ("glare")
 * 6. Send/receive peer messages
 * 7. Cleanup peer connections
 */


/*
 * ========================================
 * ICE / STUN CONFIG
 * ========================================
 */

const RTC_CONFIG = {
  iceServers: [
    {
      urls:
        "stun:stun.l.google.com:19302"
    }
  ]
};


function usePeerSync(
  socket,
  roomId,
  user
) {

  /*
   * ========================================
   * STATE
   * ========================================
   */

  const [
    peerStatuses,
    setPeerStatuses
  ] = useState({});


  const [
    peerMessages,
    setPeerMessages
  ] = useState([]);


  /*
   * ========================================
   * REFS
   * ========================================
   */

  const peerConnectionsRef =
    useRef(
      new Map()
    );


  const dataChannelsRef =
    useRef(
      new Map()
    );


  /*
   * Perfect Negotiation:
   *
   * makingOffer
   * ignoreOffer
   * polite
   */

  const makingOfferRef =
    useRef(
      new Map()
    );


  const ignoreOfferRef =
    useRef(
      new Map()
    );


  const politeRef =
    useRef(
      new Map()
    );


  /*
   * Used to prevent duplicate
   * connections.
   */

  const connectingPeersRef =
    useRef(
      new Set()
    );


  /*
   * ========================================
   * UPDATE PEER STATUS
   * ========================================
   */

  const updatePeerStatus =
    useCallback(
      (
        peerId,
        status
      ) => {

        setPeerStatuses(
          (previous) => ({
            ...previous,

            [peerId]:
              status
          })
        );
      },
      []
    );


  /*
   * ========================================
   * SETUP DATA CHANNEL
   * ========================================
   */

  const setupDataChannel =
    useCallback(
      (
        peerId,
        channel
      ) => {

        if (!channel) {
          return;
        }


        /*
         * Save channel
         */

        dataChannelsRef.current.set(
          peerId,
          channel
        );


        channel.onopen = () => {

          console.log(
            `✅ WebRTC DataChannel open: ${peerId}`
          );


          updatePeerStatus(
            peerId,
            "connected"
          );
        };


        channel.onclose = () => {

          console.log(
            `WebRTC DataChannel closed: ${peerId}`
          );


          const current =
            dataChannelsRef.current.get(
              peerId
            );


          if (
            current === channel
          ) {

            dataChannelsRef.current.delete(
              peerId
            );
          }


          updatePeerStatus(
            peerId,
            "disconnected"
          );
        };


        channel.onerror = (
          error
        ) => {

          console.error(
            `WebRTC DataChannel error: ${peerId}`,
            error
          );


          updatePeerStatus(
            peerId,
            "failed"
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


            /*
             * Ignore malformed messages
             */

            if (
              !message
            ) {

              return;
            }


            /*
             * Room isolation
             */

            if (
              message.roomId &&
              message.roomId !== roomId
            ) {

              return;
            }


            setPeerMessages(
              (previous) => [
                ...previous,

                {
                  peerId,

                  message,

                  receivedAt:
                    Date.now()
                }
              ]
            );

          } catch (error) {

            console.error(
              "WebRTC message parse error:",
              error
            );
          }
        };
      },
      [
        roomId,
        updatePeerStatus
      ]
    );


  /*
   * ========================================
   * CREATE PEER CONNECTION
   * ========================================
   */

  const createPeerConnection =
    useCallback(
      (
        peerId,
        shouldCreateChannel = false
      ) => {

        /*
         * Already exists
         */

        const existing =
          peerConnectionsRef.current.get(
            peerId
          );


        if (existing) {

          return existing;
        }


        console.log(
          `Creating RTCPeerConnection for ${peerId}`
        );


        const peerConnection =
          new RTCPeerConnection(
            RTC_CONFIG
          );


        /*
         * Store connection
         */

        peerConnectionsRef.current.set(
          peerId,
          peerConnection
        );


        /*
         * Initial state
         */

        makingOfferRef.current.set(
          peerId,
          false
        );


        ignoreOfferRef.current.set(
          peerId,
          false
        );


        /*
         * Deterministic polite role.
         *
         * Smaller socket ID = polite false
         * Larger socket ID = polite true
         *
         * This guarantees exactly one side
         * becomes polite.
         */

        const polite =
          socket.id > peerId;


        politeRef.current.set(
          peerId,
          polite
        );


        console.log(
          `WebRTC role for ${peerId}: ${
            polite
              ? "polite"
              : "impolite"
          }`
        );


        /*
         * ==================================
         * ICE CANDIDATE
         * ==================================
         */

        peerConnection.onicecandidate =
          (event) => {

            if (
              !event.candidate
            ) {

              return;
            }


            socket.emit(
              "webrtc:ice-candidate",
              {
                target:
                  peerId,

                candidate:
                  event.candidate
              }
            );
          };


        /*
         * ==================================
         * CONNECTION STATE
         * ==================================
         */

        peerConnection.onconnectionstatechange =
          () => {

            const state =
              peerConnection.connectionState;


            console.log(
              `WebRTC ${peerId}: ${state}`
            );


            updatePeerStatus(
              peerId,
              state
            );


            if (
              state ===
              "connected"
            ) {

              connectingPeersRef.current.delete(
                peerId
              );
            }


            if (
              state ===
                "failed" ||
              state ===
                "closed"
            ) {

              connectingPeersRef.current.delete(
                peerId
              );
            }


            /*
             * Don't immediately delete
             * on "disconnected".
             *
             * Browser may recover.
             */

          };


        /*
         * ==================================
         * ICE CONNECTION STATE
         * ==================================
         */

        peerConnection.oniceconnectionstatechange =
          () => {

            const state =
              peerConnection
                .iceConnectionState;


            console.log(
              `ICE ${peerId}: ${state}`
            );


            if (
              state ===
              "failed"
            ) {

              updatePeerStatus(
                peerId,
                "failed"
              );
            }
          };


        /*
         * ==================================
         * REMOTE DATA CHANNEL
         * ==================================
         */

        peerConnection.ondatachannel =
          (
            event
          ) => {

            console.log(
              `📥 Remote DataChannel from ${peerId}`
            );


            setupDataChannel(
              peerId,
              event.channel
            );
          };


        /*
         * ==================================
         * NEGOTIATION NEEDED
         * ==================================
         */

        peerConnection.onnegotiationneeded =
          async () => {

            try {

              /*
               * Prevent duplicate
               * simultaneous offers.
               */

              if (
                makingOfferRef.current.get(
                  peerId
                )
              ) {

                return;
              }


              /*
               * Don't create offers when
               * connection is not stable.
               */

              if (
                peerConnection.signalingState !==
                "stable"
              ) {

                return;
              }


              makingOfferRef.current.set(
                peerId,
                true
              );


              console.log(
                `📤 Creating WebRTC offer for ${peerId}`
              );


              const offer =
                await peerConnection.createOffer();


              /*
               * State may have changed
               * while awaiting.
               */

              if (
                peerConnection.signalingState !==
                "stable"
              ) {

                return;
              }


              await peerConnection.setLocalDescription(
                offer
              );


              /*
               * Send through signaling server.
               */

              socket.emit(
                "webrtc:offer",
                {
                  target:
                    peerId,

                  offer:
                    peerConnection.localDescription
                }
              );


              console.log(
                `📤 Offer sent to ${peerId}`
              );

            } catch (error) {

              console.error(
                `Offer creation failed for ${peerId}:`,
                error
              );

            } finally {

              makingOfferRef.current.set(
                peerId,
                false
              );
            }
          };


        /*
         * ==================================
         * OPTIONAL DATA CHANNEL CREATION
         * ==================================
         *
         * Only the offerer creates the
         * DataChannel.
         */

        if (
          shouldCreateChannel
        ) {

          const dataChannel =
            peerConnection.createDataChannel(
              "synccode"
            );


          setupDataChannel(
            peerId,
            dataChannel
          );
        }


        return peerConnection;
      },
      [
        socket,
        setupDataChannel,
        updatePeerStatus
      ]
    );


  /*
   * ========================================
   * CREATE OFFER FOR NEW PEER
   * ========================================
   */

  const createOffer =
    useCallback(
      async (
        peerId
      ) => {

        if (
          !peerId ||
          peerId === socket.id
        ) {

          return;
        }


        /*
         * Prevent duplicate setup.
         */

        if (
          connectingPeersRef.current.has(
            peerId
          )
        ) {

          return;
        }


        const existing =
          peerConnectionsRef.current.get(
            peerId
          );


        if (
          existing &&
          existing.connectionState ===
            "connected"
        ) {

          return;
        }


        connectingPeersRef.current.add(
          peerId
        );


        try {

          const peerConnection =
            createPeerConnection(
              peerId,
              true
            );


          /*
           * Wait until negotiationneeded
           * creates the offer.
           */

          updatePeerStatus(
            peerId,
            "connecting"
          );


          /*
           * If negotiationneeded doesn't
           * fire because of browser timing,
           * explicitly trigger a negotiation.
           */

          if (
            peerConnection.signalingState ===
            "stable"
          ) {

            const offer =
              await peerConnection.createOffer();


            if (
              peerConnection.signalingState !==
              "stable"
            ) {

              return;
            }


            makingOfferRef.current.set(
              peerId,
              true
            );


            await peerConnection.setLocalDescription(
              offer
            );


            socket.emit(
              "webrtc:offer",
              {
                target:
                  peerId,

                offer:
                  peerConnection.localDescription
              }
            );


            console.log(
              `📤 Initial offer sent to ${peerId}`
            );


            makingOfferRef.current.set(
              peerId,
              false
            );
          }

        } catch (error) {

          console.error(
            `Initial offer failed for ${peerId}:`,
            error
          );


          connectingPeersRef.current.delete(
            peerId
          );

          updatePeerStatus(
            peerId,
            "failed"
          );
        }

      },
      [
        socket,
        createPeerConnection,
        updatePeerStatus
      ]
    );


  /*
   * ========================================
   * HANDLE OFFER
   * ========================================
   */

  const handleOffer =
    useCallback(
      async (
        {
          from,
          offer
        }
      ) => {

        if (
          !from ||
          !offer ||
          from === socket.id
        ) {

          return;
        }


        try {

          const peerConnection =
            createPeerConnection(
              from,
              false
            );


          const polite =
            politeRef.current.get(
              from
            );


          /*
           * Perfect Negotiation
           *
           * Detect offer collision.
           */

          const offerCollision =
            makingOfferRef.current.get(
              from
            ) ||
            peerConnection.signalingState !==
              "stable";


          /*
           * Impolite peer ignores
           * colliding offer.
           */

          ignoreOfferRef.current.set(
            from,
            !polite &&
              offerCollision
          );


          if (
            !polite &&
            offerCollision
          ) {

            console.log(
              `🚫 Ignoring offer collision from ${from}`
            );

            return;
          }


          /*
           * Accept remote offer.
           */

          updatePeerStatus(
            from,
            "connecting"
          );


          /*
           * Only valid states should
           * accept a new offer.
           */

          if (
            peerConnection.signalingState !==
              "stable" &&
            peerConnection.signalingState !==
              "have-local-offer"
          ) {

            return;
          }


          /*
           * If we have local offer and
           * we are polite, rollback first.
           */

          if (
            peerConnection.signalingState ===
            "have-local-offer"
          ) {

            await peerConnection.setLocalDescription(
              {
                type:
                  "rollback"
              }
            );
          }


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
              target:
                from,

              answer:
                peerConnection.localDescription
            }
          );


          console.log(
            `📥 Offer accepted; answer sent to ${from}`
          );

        } catch (error) {

          console.error(
            `Offer handling failed for ${from}:`,
            error
          );

          updatePeerStatus(
            from,
            "failed"
          );
        }
      },
      [
        socket,
        createPeerConnection,
        updatePeerStatus
      ]
    );


  /*
   * ========================================
   * HANDLE ANSWER
   * ========================================
   */

  const handleAnswer =
    useCallback(
      async (
        {
          from,
          answer
        }
      ) => {

        if (
          !from ||
          !answer
        ) {

          return;
        }


        const peerConnection =
          peerConnectionsRef.current.get(
            from
          );


        if (
          !peerConnection
        ) {

          return;
        }


        try {

          /*
           * Answer is only valid when
           * we currently have a local offer.
           */

          if (
            peerConnection.signalingState !==
            "have-local-offer"
          ) {

            console.log(
              `Ignoring stale answer from ${from}. State: ${peerConnection.signalingState}`
            );

            return;
          }


          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(
              answer
            )
          );


          console.log(
            `✅ Answer applied from ${from}`
          );


          updatePeerStatus(
            from,
            "connecting"
          );

        } catch (error) {

          console.error(
            `Answer handling failed for ${from}:`,
            error
          );


          updatePeerStatus(
            from,
            "failed"
          );
        }
      },
      [
        updatePeerStatus
      ]
    );


  /*
   * ========================================
   * HANDLE ICE
   * ========================================
   */

  const handleIceCandidate =
    useCallback(
      async (
        {
          from,
          candidate
        }
      ) => {

        if (
          !from ||
          !candidate
        ) {

          return;
        }


        const peerConnection =
          peerConnectionsRef.current.get(
            from
          );


        if (
          !peerConnection
        ) {

          /*
           * ICE may arrive before
           * the peer connection exists.
           *
           * Create it first.
           */

          createPeerConnection(
            from,
            false
          );

          const newConnection =
            peerConnectionsRef.current.get(
              from
            );


          if (
            !newConnection
          ) {

            return;
          }


          try {

            /*
             * Browser can queue ICE after
             * remote description is set.
             */

            await newConnection.addIceCandidate(
              new RTCIceCandidate(
                candidate
              )
            );

          } catch (error) {

            if (
              !ignoreOfferRef.current.get(
                from
              )
            ) {

              console.error(
                `ICE candidate failed for ${from}:`,
                error
              );
            }
          }

          return;
        }


        try {

          /*
           * If remote offer isn't set yet,
           * don't add candidate immediately.
           *
           * The browser may reject it.
           */

          if (
            !peerConnection.remoteDescription
          ) {

            console.log(
              `⏳ Remote description not ready for ${from}; skipping ICE candidate`
            );

            return;
          }


          await peerConnection.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );

        } catch (error) {

          if (
            !ignoreOfferRef.current.get(
              from
            )
          ) {

            console.error(
              `ICE candidate failed for ${from}:`,
              error
            );
          }
        }
      },
      [
        createPeerConnection
      ]
    );


  /*
   * ========================================
   * HANDLE PEER JOINED
   * ========================================
   */

  const handlePeerJoined =
    useCallback(
      async (
        {
          socketId
        }
      ) => {

        if (
          !socketId ||
          socketId === socket.id
        ) {

          return;
        }


        console.log(
          `👤 New peer joined: ${socketId}`
        );


        /*
         * Existing user becomes
         * initial offerer.
         */

        await createOffer(
          socketId
        );
      },
      [
        socket,
        createOffer
      ]
    );


  /*
   * ========================================
   * SOCKET LISTENERS
   * ========================================
   */

  useEffect(() => {

    if (
      !socket ||
      !roomId ||
      !user
    ) {

      return;
    }


    /*
     * Register listeners.
     */

    socket.on(
      "webrtc:offer",
      handleOffer
    );


    socket.on(
      "webrtc:answer",
      handleAnswer
    );


    socket.on(
      "webrtc:ice-candidate",
      handleIceCandidate
    );


    socket.on(
      "webrtc:peer-joined",
      handlePeerJoined
    );


    /*
     * Existing users may already exist
     * in the room.
     *
     * We intentionally do not create
     * offers for all of them here because
     * peer-joined notification controls
     * negotiation ownership.
     */

    return () => {

      socket.off(
        "webrtc:offer",
        handleOffer
      );


      socket.off(
        "webrtc:answer",
        handleAnswer
      );


      socket.off(
        "webrtc:ice-candidate",
        handleIceCandidate
      );


      socket.off(
        "webrtc:peer-joined",
        handlePeerJoined
      );

    };

  }, [
    socket,
    roomId,
    user,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handlePeerJoined
  ]);


  /*
   * ========================================
   * SEND TO ONE PEER
   * ========================================
   */

  const sendToPeer =
    useCallback(
      (
        peerId,
        message
      ) => {

        const channel =
          dataChannelsRef.current.get(
            peerId
          );


        if (
          !channel ||
          channel.readyState !==
            "open"
        ) {

          return false;
        }


        try {

          channel.send(
            JSON.stringify(
              message
            )
          );


          return true;

        } catch (error) {

          console.error(
            `Failed to send WebRTC message to ${peerId}:`,
            error
          );


          return false;
        }
      },
      []
    );


  /*
   * ========================================
   * BROADCAST
   * ========================================
   */

  const broadcast =
    useCallback(
      (
        message
      ) => {

        let sent =
          0;


        for (
          const [
            peerId,
            channel
          ]
          of dataChannelsRef.current
        ) {

          if (
            channel.readyState !==
            "open"
          ) {

            continue;
          }


          try {

            channel.send(
              JSON.stringify(
                message
              )
            );


            sent++;

          } catch (error) {

            console.error(
              `Broadcast failed for ${peerId}:`,
              error
            );
          }
        }


        return sent;
      },
      []
    );


  /*
   * ========================================
   * SEND PEER CODE
   * ========================================
   */

  const sendPeerCode =
    useCallback(
      (
        fileName,
        code
      ) => {

        if (
          !roomId ||
          !user
        ) {

          return 0;
        }


        return broadcast({

          type:
            "code",

          roomId,

          fileName,

          code,

          senderId:
            user.id,

          timestamp:
            Date.now()
        });
      },
      [
        roomId,
        user,
        broadcast
      ]
    );


  /*
   * ========================================
   * REMOVE PEER
   * ========================================
   */

  const removePeer =
    useCallback(
      (
        peerId
      ) => {

        const peerConnection =
          peerConnectionsRef.current.get(
            peerId
          );


        if (
          peerConnection
        ) {

          try {
            peerConnection.close();
          } catch {
            // Ignore cleanup errors.
          }
        }


        const channel =
          dataChannelsRef.current.get(
            peerId
          );


        if (
          channel
        ) {

          try {
            channel.close();
          } catch {
            // Ignore cleanup errors.
          }
        }


        peerConnectionsRef.current.delete(
          peerId
        );


        dataChannelsRef.current.delete(
          peerId
        );


        makingOfferRef.current.delete(
          peerId
        );


        ignoreOfferRef.current.delete(
          peerId
        );


        politeRef.current.delete(
          peerId
        );


        connectingPeersRef.current.delete(
          peerId
        );


        setPeerStatuses(
          (previous) => {

            const next = {
              ...previous
            };


            delete next[
              peerId
            ];


            return next;
          }
        );

      },
      []
    );


  /*
   * ========================================
   * COMPLETE CLEANUP
   * ========================================
   */

  useEffect(() => {

    return () => {

      for (
        const peerConnection
        of peerConnectionsRef.current.values()
      ) {

        try {
          peerConnection.close();
        } catch {
          // Ignore cleanup error.
        }
      }


      for (
        const channel
        of dataChannelsRef.current.values()
      ) {

        try {
          channel.close();
        } catch {
          // Ignore cleanup error.
        }
      }


      peerConnectionsRef.current.clear();

      dataChannelsRef.current.clear();

      makingOfferRef.current.clear();

      ignoreOfferRef.current.clear();

      politeRef.current.clear();

      connectingPeersRef.current.clear();

    };

  }, []);


  /*
   * ========================================
   * RETURN API
   * ========================================
   */

  return {

    peerStatuses,

    peerMessages,

    sendPeerCode,

    sendToPeer,

    broadcast,

    removePeer
  };
}


export default usePeerSync;