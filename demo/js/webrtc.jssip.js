(function(window) {
  var App = window.App || {};
  var COMMON = window.App.common;

  var _ua = null;
  var _session = {
    a: null,
    b: null,
    c: null,
    d: null
  };
  var notify = false;
  var _tmpTarget = null;
  var _incomingSession = null;
  var _tmpSession = null;
  var _PeerConnection = null;
  var _localStream = {
    one: null,
    two: null
    // three: null,
    // four: null
  };
  var _remoteStream = {
    one: null,
    two: null
    // three: null,
    // four: null
  };
  var _getStatsResult = null;
  var _sipCode = {
    busy: {
      status_code: 486
    },
    reject: {
      status_code: 403
    }
  };
  var mediaConstraints = null;

  function haveSession(session) {
    for (var k in session) {
      if (!session[k]) {
        return k;
      }
    }
    return null;
  }

  // remove stream
  function _stopStream(target) {
    var targetEle = '#' + target;
    var localSrcObject = document
      .querySelector(targetEle)
      .querySelector('.localVideo').srcObject;
    var remoteSrcObject = document
      .querySelector(targetEle)
      .querySelector('.remoteVideo').srcObject;
    if (_remoteStream[target]) {
      _remoteStream[target].getTracks().forEach(track => track.stop());
    }
    if (_localStream[target]) {
      _localStream[target].getTracks().forEach(track => track.stop());
    }
    if (localSrcObject) {
      localSrcObject.getTracks().forEach(track => track.stop());
      localSrcObject = null;
    }
    if (remoteSrcObject) {
      remoteSrcObject.getTracks().forEach(track => track.stop());
      remoteSrcObject = null;
    }
  }

  // pause the ring
  function _ringPause(session) {
    if (session.direction === 'outgoing') {
      document.querySelector('#ringback').pause();
      document.querySelector('#ringback').currentTime = 0;
    } else {
      document.querySelector('#ringing').pause();
      document.querySelector('#ringing').currentTime = 0;
    }
  }

  // after accepted
  function _afterAccept(session, target) {
    var remoteKinds = null;
    var targetEle = '#' + target;
    $(targetEle)
      .find('.close-phone')
      .removeClass('close-phone');
    var _displayName = session.remote_identity.display_name
      ? 'in: ' + session.remote_identity.display_name
      : 'out: ' + session.local_identity.uri.user;
    _PeerConnection = session.connection;
    _localStream[target] = new MediaStream();
    console.log(_PeerConnection);
    _PeerConnection.getSenders().forEach(function(receiver) {
      receiver.track && _localStream[target].addTrack(receiver.track);
    });
    _remoteStream[target] = new MediaStream();
    _PeerConnection.getReceivers().forEach(function(receiver) {
      remoteKinds += receiver.track.kind;
      receiver.track && _remoteStream[target].addTrack(receiver.track);
    });

    if (
      (mediaConstraints && !mediaConstraints.video) ||
      remoteKinds.indexOf('video') == -1
    ) {
      _displayName += '【语音模式】';
      document.querySelector(targetEle).querySelector('.toggle-camera').style =
        'display:none;';
    }

    if (_localStream[target]) {
      document.querySelector(targetEle).querySelector('.localVideo').srcObject =
        _localStream[target];
    }
    if (_remoteStream[target]) {
      document
        .querySelector(targetEle)
        .querySelector('.remoteVideo').srcObject = _remoteStream[target];
      if (
        sessionStorage.getItem('audiooutput') &&
        sessionStorage.getItem('audiooutput') != 'no'
      ) {
        COMMON.attachSinkId(
          document.querySelector(targetEle).querySelector('.remoteVideo'),
          sessionStorage.getItem('audiooutput')
        );
      }
    }
    if (_displayName) {
      document
        .querySelector(targetEle)
        .querySelector('.displayName').innerHTML = _displayName;
    }
    // addstream changeCam
    _PeerConnection.addEventListener('addstream', function(e) {
      for (var i in _session) {
        if (_session[i] == session) {
          var tmpEle = '#' + i;
          $(tmpEle).find('.screenVideo')[0].srcObject = e.stream;
        }
      }
    });

    var inboundStream = null;
    _PeerConnection.addEventListener('track', function(ev) {
      for (var i in _session) {
        if (_session[i] == session) {
          var tmpEle = '#' + i;
        }
      }
      var videoElem = $(tmpEle).find('.screenVideo')[0];
      if (ev.streams && ev.streams[0]) {
        videoElem.srcObject = ev.streams[0];
      } else {
        // if (!inboundStream) {
        inboundStream = new MediaStream();
        videoElem.srcObject = inboundStream;
        inboundStream.addTrack(ev.track);
        // } else {
        // inboundStream.replaceTrack(ev.track);
        // }
      }
    });

    COMMON.changePage('session', _tmpTarget);
    // _getPeerStats(_PeerConnection, 1000);
  }

  // UA debug information
  function _UAMessageSubject(that) {
    [
      'connecting',
      'connected',
      'disconnected',
      'registered',
      'unregistered',
      'registrationFailed',
      'newRTCSession',
      'newMessage'
    ].map(event => {
      that.ua.on(event, function(e) {
        console.log(`UAEvent: ${event}`, e);
      });
    });
  }

  // RTCSession debug information
  function _RTCSessionMessageSubject(session) {
    [
      'peerconnection',
      'connecting',
      'sending',
      'progress',
      'accepted',
      'confirmed',
      'ended',
      'failed',
      'newDTMF',
      'newInfo',
      'hold',
      'unhold',
      'muted',
      'unmuted',
      'reinvite',
      'update',
      'refer',
      'replaces',
      'sdp',
      'icecandidate',
      'getusermediafailed',
      'peerconnection:createofferfailed',
      'peerconnection:createanswerfailed',
      'peerconnection:setlocaldescriptionfailed',
      'peerconnection:setremotedescriptionfailed'
    ].map(event => {
      session.on(event, function(e) {
        console.info(`RTCSessionEvent: ${event}`, e);
      });
    });
  }

  /* UAEvent */
  var _uaEvent = {
    registered: function(e) {
      COMMON.changePage('main');
    },
    registrationFailed: function(e) {
      COMMON.changePage('login');
      M.toast({
        html: e.cause
      });
    },
    newRTCSession: function(e) {
      _tmpSession = e.session;
      _tmpTarget = haveSession(_session);
      if (e.originator === 'remote') {
        if (!_tmpTarget || _incomingSession) {
          console.warn('incoming call replied with 486 "Busy Here"');
          e.session.terminate(_sipCode.busy);
          return;
        }
        _incomingSession = e.session;
      }
      _RTCSessionMessageSubject(e.session);
      _RTCSessionStatusSubject(e.session, e);
    },
    newMessage: function(e) {}
  };

  function _UAStatusSubject(that) {
    Object.keys(_uaEvent).map(event => {
      that.ua.on(event, function(e) {
        _uaEvent[event](e);
      });
    });
  }

  /* RTCSession */
  var _rtcSessionEvent = {
    progress: function(e, session, UAe) {
      var targetEle = '#' + _tmpTarget;
      if (session.direction === 'outgoing') {
        COMMON.changePage('calling', _tmpTarget);
        document.querySelector('#ringback').play();
      } else {
        console.log(UAe);
        document
          .querySelector(targetEle)
          .querySelector('.display-name').innerHTML =
          UAe.request.from.display_name;
        COMMON.changePage('incoming', _tmpTarget);
        document.querySelector('#ringing').play();
      }
      _session[_tmpTarget] = session;
    },
    sdp: function(e) {
      if (!enable_ice_ipv6) {
        e.sdp = e.sdp.replace(
          /a=candidate.*([a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){0,7}::[a-f0-9]{0,4}(:[a-f0-9]{1,4}){0,7}).*\r\n/g,
          ''
        );
      }
      if (!enable_group_bundle) {
        e.sdp = e.sdp.replace(/a=group:BUNDLE.*\r\n/, '');
      }
    },
    failed: function(e, session, UAe) {
      // if (e.cause == "Rejected" || e.cause == "Canceled") {
      //   for (var i in _session) {
      //     if (!_session[i]) {
      //       COMMON.changePage("normal", i);
      //     }
      //   }
      // } else {
      for (var i in _session) {
        if (_session[i] == session) {
          _session[i] = null;
          COMMON.changePage('normal', i);
          _stopStream(i);
        }
      }
      // }

      _ingSession = null;
      _ringPause(session);
      M.toast({
        html: e.cause
      });
      if (_getStatsResult) {
        _getStatsResult.nomore();
      }
      _tmpTarget = null;
      _incomingSession = null;
    },
    accepted: function(e, session, UAe) {
      // var target = haveSession(_session);
      // _session[_tmpTarget] = session;
      _ringPause(session);
      _afterAccept(session, _tmpTarget);
      // _tmpTarget=null
      _incomingSession = null;
    },
    ended: function(e, session, UAe) {
      var endTarget = null;
      for (var i in _session) {
        if (_session[i] == session) {
          _session[i] = null;
          endTarget = i;
        }
      }
      // _incomingSession = null;
      _stopStream(endTarget);
      M.toast({
        html: e.cause
      });
      COMMON.changePage('normal', endTarget);
      // _tmpTarget = null;
    },
    newDTMF: function(e, session, UAe) {
      if (e.originator === 'remote') {
        M.toast({
          html: `newDTMF: ${e.request.body}`
        });
      }
    },
    newInfo: function(e, session, UAe) {
      if (e.originator === 'remote') {
        var info = JSON.parse(e.request.body);
        if (info.type !== 'debug') {
          M.toast({
            html: `newInfo: ${e.request.body}`
          });
        }
      }
    },
    reinvite: function(e, session, UAe) {
      // console.log("inviteee: ", e);
      // console.log("invitess: ", session);
      var tmpEle = null;
      for (var i in _session) {
        if (_session[i] == session) {
          tmpEle = '#' + i;
          // $(tmpEle).find(".screenVideo")[0].srcObject = e.stream;
        }
      }
      if (e.request.headers['X-Action']) {
        if (e.request.headers['X-Action'][0].raw == 'shareScreen') {
          tmpEle &&
            $(tmpEle)
              .find('.screen-video')
              .removeClass('hide');
        } else if (e.request.headers['X-Action'][0].raw == 'stopShareScreen') {
          tmpEle &&
            $(tmpEle)
              .find('.screen-video')
              .addClass('hide');
        }
      }
    },
    newNotify: function(e, session, UAe) {
      if (e.originator === 'remote') {
        notify = true;
        if (e.request.event.event == 'talk') {
          if (session.isEstablished()) {
            if (session.isOnHold()) {
              session.unhold();
            }
          } else {
            session.answer({
              // TODO:  ？
              rtcOfferConstraints: {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 0,
                DtlsSrtpKeyAgreement: 0
              }
            });
          }
        } else if (e.request.event.event == 'hold') {
          session.hold();
        }
      }
    }
  };

  function _RTCSessionStatusSubject(session, UAe) {
    Object.keys(_rtcSessionEvent).map(event => {
      session.on(event, function(e) {
        _rtcSessionEvent[event](e, session, UAe);
      });
    });
  }

  // TODO: what ???
  function _setVideoStream(stream, target) {
    var targetEle = '#' + target;
    document
      .querySelector(targetEle)
      .querySelector('.localVideo').srcObject = stream;
    document
      .querySelector(targetEle)
      .querySelector('.localVideo')
      .play();
    // document.querySelector('#localVideo').srcObject = stream;
    // document.querySelector('#localVideo').play();
  }

  /* WebRTC Class */
  function WebRTC(options = {}) {
    this.account = options.account || ' ';
    this.password = options.password || '';
    this.domain = options.domain || ' ';
    this.wss = options.wss || ' ';

    this.socket = new JsSIP.WebSocketInterface(this.wss);
    this.configuration = {
      sockets: [this.socket],
      uri: 'sip:' + this.account + '@' + this.domain,
      contact_uri:
        'sip:' + this.account + '@' + this.account + '.invalid;transport=ws',
      password: this.password,
      display_name: this.account,
      register: true,
      session_timers: false,
      register_expires: 900,
      user_agent: 'UA/1.0'
    };

    this.ua = new JsSIP.UA(this.configuration);
  }

  WebRTC.prototype.connect = function() {
    this.ua.start();
    _UAMessageSubject(this);
    _UAStatusSubject(this);
  };

  WebRTC.prototype.stop = function() {
    this.ua.stop();
  };

  WebRTC.prototype.unregister = function() {
    if (this.ua.isRegistered()) {
      this.ua.unregister();
    }
  };

  WebRTC.prototype.call = function(linkman, mode) {
    if (_incomingSession) {
      M.toast({
        html: '请处理进行中呼叫后再呼出'
      });
      return;
    }
    mediaConstraints = sessionStorage.getItem('constraints')
      ? JSON.parse(sessionStorage.getItem('constraints'))
      : {
          audio: true,
          video: true
        };

    if (mode == 'video') {
      if (!mediaConstraints.video) {
        mediaConstraints.video = true;
      }
      if (!mediaConstraints.audio) {
        mediaConstraints.audio = true;
      }
    } else if (mode == 'audio') {
      if (mediaConstraints.video) {
        mediaConstraints.video = false;
      }
      if (!mediaConstraints.audio) {
        mediaConstraints.audio = true;
      }
    }
    this.session = this.ua.call('sip:' + linkman + '@' + this.domain, {
      extraHeaders: ['X-Token: 2c8a1be510764ad222ebcc4ffd0f9775'],
      mediaConstraints: mediaConstraints,
      rtcOfferConstraints: {
        offerToReceiveAudio: mediaConstraints.audio ? 1 : 0,
        offerToReceiveVideo: mediaConstraints.video ? 1 : 0
      },
      pcConfig: pcConfig
    });
  };

  WebRTC.prototype.answer = function() {
    mediaConstraints = null;
    _incomingSession.answer(/* {
			rtcOfferConstraints: {
				offerToReceiveAudio: 1,
				offerToReceiveVideo: 0,
				DtlsSrtpKeyAgreement: 0
			},
			mediaConstraints:
				phoneModal == 'audio'
					? {
							video: false,
							audio: true
						}
					: {
							audio: true,
							video: true
						}
		} */);
  };

  WebRTC.prototype.cancel = function() {
    _tmpSession.terminate();
  };

  WebRTC.prototype.reject = function(target) {
    _incomingSession.terminate(_sipCode.reject);
  };

  WebRTC.prototype.youanswer = function(target) {
    _tmpSession.sendInfo('application/json', '', {
      extraHeaders: ['event: talk']
    });
  };

  WebRTC.prototype.hangup = function(target) {
    if (target && _session[target]) {
      _session[target].terminate();
    } else {
      for (var i in _session) {
        _session[i].terminate();
      }
    }
  };

  WebRTC.prototype.closeMic = function(target) {
    if (_session[target]) {
      _session[target].mute();
    }
  };

  WebRTC.prototype.openMic = function(target) {
    if (_session[target]) {
      _session[target].unmute();
    }
  };

  WebRTC.prototype.hold = function(target) {
    if (_session[target]) {
      _session[target].hold();
    }
  };

  WebRTC.prototype.unhold = function(target) {
    if (_session[target]) {
      _session[target].unhold();
    }
  };

  WebRTC.prototype.closeCam = function(target) {
    if (_session[target]) {
      _session[target].mute({
        audio: false,
        video: true
      });
    }
  };

  WebRTC.prototype.openCam = function(target) {
    if (_session[target]) {
      _session[target].unmute({
        audio: false,
        video: true
      });
    }
  };

  WebRTC.prototype.sendDTMF = function(message, target) {
    if (_session[target]) {
      _session[target].sendDTMF(message);
    }
  };

  WebRTC.prototype.sendInfo = function(message, target) {
    if (_session[target]) {
      _session[target].sendInfo('application/json', message);
    }
  };

  WebRTC.prototype.switchStream = function(stream, target) {
    window.stream = stream;
    if (_session && _PeerConnection) {
      _setVideoStream(stream);
      stream.getVideoTracks().forEach(function(track) {
        var sender = _PeerConnection.getSenders().find(function(s) {
          return s.track.kind == track.kind;
        });
        sender.replaceTrack(track);
      });
    }
  };

  WebRTC.prototype.shareScreen = function(stream, target) {
    window.shareStraem = stream;
    if (_session && _PeerConnection) {
      stream.getVideoTracks().forEach(function(track) {
        var sender = _PeerConnection.getSenders().find(function(s) {
          if (s.track) {
            return s.track.label == track.label;
          }
        });
        if (sender) {
          sender.replaceTrack(track);
        } else {
          _PeerConnection.addTrack(track);
        }
      });
      _session[target].renegotiate({ extraHeaders: ['X-Action: shareScreen'] });
    }
    isShareScreen = true;
  };

  WebRTC.prototype.stopShare = function(target) {
    // if (!isShareScreen) {
    //   return;
    // }
    if (_session && _PeerConnection) {
      _PeerConnection.getSenders().find(function(s) {
        if (
          !s.track ||
          s.track.label.indexOf('screen') != -1 ||
          s.track.label.indexOf('window') != -1 ||
          s.track.label.indexOf('web') != -1
        ) {
          s.track && s.track.stop();
          _PeerConnection.removeTrack(s);
        }
      });
      _session[target].renegotiate({
        extraHeaders: ['X-Action: stopShareScreen']
      });
    }
  };

  // WebRTC.prototype.getPeerStats = function() {
  // 	_getPeerStats;
  // };

  App.WebRTC = WebRTC;
  window.App = App;
})(window);
