// (function (window) {
  var COMMON = window.App.common;

  var webrtc = null;
  var account = null;
  var password = null;
  // var testStream = null;
  var constraints = {};

  var videoFlag = 0;

  // element
  var linkman = document.querySelector("#linkman");
  var callBtn = $(".call");
  var conferenceBtn = $(".conference");
  var cancelBtn = $(".cancel");
  var youanswerBtn = $(".youanswer");
  var hangupBtn = $(".hangup");
  var rejectBtn = $(".reject");
  var answerBtn = $(".answer");
  var dialpadBtn = $(".dialpad");
  var modalCloseBtn = $(".modal-close");
  var switchCamBtn = $(".change-camera");
  var toggleCamBtn = $(".toggle-camera");
  var toggleMicBtn = $(".toggle-microphone");
  var shareScreenBtn = $(".share-screen");
  var toMCUBtn = $(".to-mcu");
  var DTMFArea = document.querySelector("#DTMF");
  var infoMessage = document.querySelector("#info-message");
  var sendInfoBtn = document.querySelector("#sendInfo");
  var togglePhoneBtn = $(".toggle-phone");
  var switchMicSelect = $("#switch-microphone")[0];
  var switchCamSelect = $("#switch-camera")[0];
  var switchAudioOutput = $("#switch-audiooutput")[0];
  var selectors = [switchMicSelect, switchAudioOutput, switchCamSelect];
  var changeFrameRageRang = document.querySelector("#change-frameRate");
  var saveContraintsBtn = document.querySelector("#save-contraints");
  var logoinBtn = document.querySelector("#login");
  var logoutBtn = document.querySelector("#logout");
  var testVideo = document.querySelector("#test-video");

  // TODO: DEBUG
  FlyInnWeb.debug.enable("FlyInnWeb:*");
  // var vConsole = new VConsole();
  sessionStorage.setItem('autoAnswer', autoAnswer);
  sessionStorage.setItem('autoAnswerTimer', autoAnswerTimer);

  M.FormSelect.init(document.querySelectorAll("select"));
  M.Modal.init(document.querySelectorAll("#dialpad-modal"), {
    dismissible: false
  });
  M.Modal.init(document.querySelectorAll("#settings-modal"), {
    // dismissible: false,
    onOpenStart: initSettings,
    onCloseEnd: settingModalOpenEnd
  });
  var floatingActionButtons = M.FloatingActionButton.init(
    document.querySelectorAll(".fixed-action-btn")
  );

  var draggable = document.querySelector(".small-video");
  var draggie = new Draggabilly(draggable, {});

  // modals.forEach(modal => {
  //   if (modal.el.id == 'setting-modal') {

  //   }
  // })

  conferenceBtn.click(function(){
    const mix = new MultiStreamsMixer([document.querySelector('.localVideo').srcObject,document.querySelector('.remoteVideo').srcObject])
    mix.frameInterval = 1;
    mix.startDrawingFrames();
    webrtc.conference(linkman.value, mix.getMixedStream());
  })

  /* Listen */
  callBtn.click(function () {
    if (linkman.value) {
      webrtc.call(linkman.value, $(this).data("method"));
    } else {
      M.toast({
        html: "请输入客服号码！"
      });
    }
  });

  cancelBtn.click(function () {
    webrtc.cancel(
      $(this)
        .closest(".main")
        .data("target")
    );
  });

  youanswerBtn.click(function () {
    webrtc.youanswer(
      $(this)
        .closest(".main")
        .data("target")
    );
  });

  answerBtn.click(function () {
    webrtc.answer(
      $(this)
        .closest(".main")
        .data("target")
    );
  });

  hangupBtn.click(function () {
    webrtc.hangup(
      $(this)
        .closest(".main")
        .data("target")
    );
    // window.location.reload();
  });

  rejectBtn.click(function () {
    webrtc.reject(
      $(this)
        .closest(".main")
        .data("target")
    );
  });

  toMCUBtn.click(function(){
    webrtc.toMCU($(this)
    .closest(".main")
    .data("target"))
  })

  toggleCamBtn.click(function () {
    toggleCam(this);
  });

  toggleMicBtn.click(function () {
    toggleMic(this);
  });

  togglePhoneBtn.click(function () {
    togglePhone(this);
  });

  shareScreenBtn.click(function () {
    toggleScreen(
      $(this)
        .closest(".main")
        .data("target")
    );
  });

  dialpadBtn.click(function () {
    $(".dtmfTarget").val(
      $(this)
        .closest(".main")
        .data("target")
    );
  });

  modalCloseBtn.click(function () {
    $(".dtmfTarget").val();
  });

  DTMFArea.querySelectorAll("button").forEach(ele => {
    if (ele.dataset["value"]) {
      ele.onclick = function (e) {
        if ($(".dtmfTarget").val()) {
          webrtc.sendDTMF(this.dataset["value"], $(".dtmfTarget").val());
        }
      };
    }
  });

  sendInfoBtn.onclick = function () {
    if (infoMessage.value) {
      webrtc.sendInfo(infoMessage.value, $(".dtmfTarget").val());
    } else {
      M.toast({
        html: "请输入消息内容！"
      });
    }
  };

  saveContraintsBtn.onclick = function () {
    saveConstraints();
  };

  logoinBtn.onclick = function () {
    login();
  };

  logoutBtn.onclick = function () {
    webrtc.unregister();
    sessionStorage.clear();
    window.location.replace("index.html");
  };

  switchCamBtn.onclick = function (e) {
    switchCam();
  };

  window.onbeforeunload = function () {
    if (webrtc) {
      webrtc.stop();
    }
    // sessionStorage.clear();
  };

  switchCamSelect.onchange = function () {
    renderTestVideo();
  };

  switchMicSelect.onchange = function () {
    renderTestVideo();
  };

  switchAudioOutput.onchange = function () {
    renderTestVideo();
  };

  /* Function */
  function switchCam() {
    var tmpVideoArr = sessionStorage.getItem("video").split(",");
    var tmpConstraints = JSON.parse(sessionStorage.getItem("constraints"));
    var constraints = null;
    if (tmpVideoArr.length < 1) {
      M.toast({
        html: "no camera can switch！"
      });
    } else if (videoFlag < tmpVideoArr.length) {
      if (window.stream) {
        window.stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }
      if (tmpConstraints) {
        constraints = {
          audio: tmpConstraints.audio,
          video: {
            deviceId: {
              exact: device
            }
          }
        };
      } else {
        constraints = {
          audio: true,
          video: {
            deviceId: {
              exact: tmpVideoArr[videoFlag]
            }
          }
        };
      }
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(stream => webrtc.switchStream(stream))
        .catch(handleError);

      // navigator.getDisplayMedia({
      //     video: true
      //   })
      //   .then((stream) => webrtc.switchStream(stream))
      //   .catch(handleError);

      videoFlag++;
    }
    if (videoFlag >= tmpVideoArr.length) {
      videoFlag = 0;
    }
  }

  function saveConstraints() {
    var audio = {};
    var video = {};

    if (switchMicSelect.value != "no") {
      audio = {
        deviceId: {
          exact: switchMicSelect.value
        }
      };
    } else {
      audio = false;
    }
    if (switchCamSelect.value != "no") {
      video = {
        // facingMode: (frontCameraCheckbox.value ? "user" : "environment"),
        deviceId: {
          exact: switchCamSelect.value
        },
        frameRate: changeFrameRageRang.value
      };
    } else {
      video = false;
    }

    constraints = {
      video: video,
      audio: audio
    };
    sessionStorage.setItem("audiooutput", switchAudioOutput.value);
    sessionStorage.setItem("constraints", JSON.stringify(constraints));
  }

  // all Device
  function gotDevices(deviceInfos) {
    var audioArr = [];
    var videoArr = [];
    var audiooutputArr = [];
    var noSelect = '<option value="no">无</option>';

    const values = selectors.map(select => select.value);
    selectors.forEach(select => {
      while (select.firstChild) {
        select.removeChild(select.firstChild);
      }

      select.innerHTML = select.innerHTML + noSelect;
    });

    deviceInfos.forEach(deviceInfo => {
      var option = document.createElement("option");
      option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === "audioinput") {
        audioArr.push(deviceInfo.deviceId);
        option.text =
          deviceInfo.label || `microphone ${switchMicSelect.length + 1}`;
        switchMicSelect.appendChild(option);
      } else if (deviceInfo.kind === "audiooutput") {
        audiooutputArr.push(deviceInfo.deviceId);
        option.text =
          deviceInfo.label || `speaker ${switchAudioOutput.length + 1}`;
        switchAudioOutput.appendChild(option);
      } else if (deviceInfo.kind === "videoinput") {
        videoArr.push(deviceInfo.deviceId);
        option.text =
          deviceInfo.label || `camera ${switchCamSelect.length + 1}`;
        switchCamSelect.appendChild(option);
      } else {
        // console.log('Some other kind of source/device: ', deviceInfo);
      }
    });

    if (sessionStorage.getItem("constraints")) {
      const constraints = sessionStorage.getItem("constraints");
      // TODO: init selected device
    }

    selectors.forEach((select, selectorIndex) => {
      if (
        Array.prototype.slice
          .call(select.childNodes)
          .some(n => n.value === values[selectorIndex])
      ) {
        select.value = values[selectorIndex];
      }
    });

    sessionStorage.setItem("audio", audioArr);
    sessionStorage.setItem("video", videoArr);
    // sessionStorage.setItem('audiooutput', audiooutputArr);

    // init m FormSelect
    M.FormSelect.init(document.querySelectorAll("select"));
  }

  function gotStream(stream) {
    window.stream = stream;
    testVideo.srcObject = stream;
    if (switchAudioOutput.value && switchAudioOutput.value != "no") {
      COMMON.attachSinkId(testVideo, switchAudioOutput.value);
    }
    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
  }

  function handleError(error) {
    console.error("navigator.getUserMedia error: ", error);
    M.toast({
      html: error
    });
  }

  function initSettings() {
    var mediaConstraints = sessionStorage.getItem("constraints")
      ? JSON.parse(sessionStorage.getItem("constraints"))
      : {
        audio: false,
        video: false
      };
    switchMicSelect.innerHTML = "";
    switchAudioOutput.innerHTML = "";
    switchCamSelect.innerHTML = "";
    initDevice();
    renderTestVideo();
  }

  function renderTestVideo(options) {
    if (options) {
      navigator.mediaDevices
        .getUserMedia(options)
        .then(gotStream)
        .then(gotDevices)
        .catch(handleError);
    } else {
      if (window.stream) {
        window.stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      const audioSource = switchMicSelect.value;
      const videoSource = switchCamSelect.value;
      if (audioSource == "no" && videoSource == "no") {
        M.toast({
          html: "必须选择音频和视频中的一个！"
        });
        return;
      }
      const constraints = {
        audio: audioSource
          ? audioSource == "no" || audioSource == ""
            ? false
            : {
              deviceId: audioSource
                ? {
                  exact: audioSource
                }
                : false
            }
          : false,
        video: videoSource
          ? videoSource == "no" || videoSource == ""
            ? false
            : {
              deviceId: videoSource
                ? {
                  exact: videoSource
                }
                : false
            }
          : false
      };
      if (constraints.video || constraints.audio) {
        navigator.mediaDevices
          .getUserMedia(constraints)
          .then(gotStream)
          .then(gotDevices)
          .catch(handleError);
      }
    }
  }

  function settingModalOpenEnd() {
    testVideo.srcObject &&
      testVideo.srcObject.getTracks() &&
      testVideo.srcObject.getTracks().forEach(track => track.stop());
    testVideo.srcObject = null;
  }

  function initDevice() {
    navigator.mediaDevices
      .enumerateDevices()
      .then(gotDevices)
      .catch(handleError);
  }

  // toggle camera
  function toggleCam(e) {
    var classes = e.classList;
    if (classes.contains("close-camera")) {
      webrtc.openCam(
        $(e)
          .closest(".main")
          .data("target")
      );
      classes.toggle("close-camera");
    } else {
      webrtc.closeCam(
        $(e)
          .closest(".main")
          .data("target")
      );
      classes.toggle("close-camera");
    }
  }

  // toggle microphone
  function toggleMic(e) {
    var classes = e.classList;
    if (classes.contains("close-microphone")) {
      webrtc.openMic(
        $(e)
          .closest(".main")
          .data("target")
      );
      classes.toggle("close-microphone");
    } else {
      webrtc.closeMic(
        $(e)
          .closest(".main")
          .data("target")
      );
      classes.toggle("close-microphone");
    }
  }

  // toggle phone
  function togglePhone(e) {
    var classes = e.classList;
    if (classes.contains("close-phone")) {
      webrtc.unhold(
        $(e)
          .closest(".main")
          .data("target")
      );
      classes.toggle("close-phone");
    } else {
      webrtc.hold(
        $(e)
          .closest(".main")
          .data("target")
      );
      classes.toggle("close-phone");
    }
  }

  var isShare = false;
  // shareScreen
  function toggleScreen(target) {
    if (isShare) {
      webrtc.stopShare(target);
      isShare = false;
    }
    isShare = true;
    navigator.mediaDevices
      .getDisplayMedia({
        video: true
      })
      .then(stream => {
        stream.addEventListener("inactive", e => {
          console.log("Capture stream inactive - stop recording!");
          webrtc.stopShare(target);
        });
        webrtc.shareScreen(stream, target);
      })
      .catch(handleError);
  }

  // login
  function login() {
    sessionStorage.setItem("account", document.querySelector("#account").value);
    sessionStorage.setItem(
      "password",
      document.querySelector("#password").value
    );
    start();
  }

  // start
  function start() {
    var urlAccount = COMMON.handleGetQuery("account");
    var sessionAccount = sessionStorage.getItem("account");
    var urlPassword = COMMON.handleGetQuery("password");
    var sessionPassword = sessionStorage.getItem("password");
    // check account
    if (urlAccount) {
      account = urlAccount;
      sessionStorage.setItem("account", urlAccount);
    } else if (sessionAccount) {
      account = sessionAccount;
    }
    // check password
    if (urlPassword) {
      password = urlPassword;
      sessionStorage.setItem("password", urlPassword);
    } else if (sessionPassword) {
      password = sessionPassword;
    }

    if (account) {
      webrtc = new window.App.WebRTC({
        account: account,
        password: password,
        domain: domain,
        wss: wss
      });
      webrtc.connect();
    } else {
      COMMON.changePage("login");
    }

    // TODO: why?
    initDevice();
  }

  start();
// })(window);
