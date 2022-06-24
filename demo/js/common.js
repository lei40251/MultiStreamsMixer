(function(window) {
	var App = window.App || {};
	// main-page user
	var registeredUser = document.querySelector('#registered-user');

	// UI pages
	var loginPage = document.querySelector('#login-page');
	var mainPage = document.querySelector('#main-page');
	var callingPage = document.querySelector('#calling-page');
	var sessionPage = document.querySelector('#session-page');
	var incomingPage = document.querySelector('#incoming-page');

	var common = {
		attachSinkId: function(element, sinkId) {
			if (typeof element.sinkId !== 'undefined') {
				element
					.setSinkId(sinkId)
					.then(() => {
						console.log(`Success, audio output device attached: ${sinkId}`);
					})
					.catch((error) => {
						let errorMessage = error;
						if (error.name === 'SecurityError') {
							errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
						}
						console.error(errorMessage);
						// Jump back to first output device in the list as it's the default.
						element.selectedIndex = 0;
					});
			} else {
				console.warn('Browser does not support output device selection.');
			}
		},
		// get地址栏参数
		handleGetQuery: function(name) {
			var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
			var r = window.location.search.substr(1).match(reg);
			if (r != null) return unescape(r[2]);
			return null;
		},
		changePage: function(page, target) {
			var targetEle = '#' + target;
			switch (page) {
				case 'normal':
					if (target) {
						$(targetEle + '>div').addClass('hide');
					} else {
						$('.main > div').addClass('hide');
					}
					break;
				case 'login':
					loginPage.parentNode.childNodes.forEach((ele) => {
						if (ele.nodeName == 'DIV') {
							ele.classList.add('hide');
						}
					});
					loginPage.classList.remove('hide');
					break;
				case 'main':
					mainPage.parentNode.childNodes.forEach((ele) => {
						if (ele.nodeName == 'DIV') {
							ele.classList.add('hide');
						}
					});
					mainPage.classList.remove('hide');
					registeredUser.innerText = sessionStorage.getItem('account');
					break;
				case 'calling':
					document.querySelector(targetEle).querySelector('.calling-page').parentNode.childNodes.forEach((ele) => {
						if (ele.nodeName == 'DIV') {
							ele.classList.add('hide');
						}
					});
					document.querySelector(targetEle).querySelector('.calling-page').classList.remove('hide');
					break;
				case 'session':
					document.querySelector(targetEle).querySelector('.session-page').parentNode.childNodes.forEach((ele) => {
						if (ele.nodeName == 'DIV') {
							ele.classList.add('hide');
						}
					});
					document
						.querySelector(targetEle)
						.querySelector('.session-page')
						.querySelector('.toggle-camera')
						.classList.remove('close-camera');
					document
						.querySelector(targetEle)
						.querySelector('.session-page')
						.querySelector('.toggle-microphone')
						.classList.remove('close-microphone');
					document.querySelector(targetEle).querySelector('.session-page').classList.remove('hide');
					break;
				case 'incoming':
					document.querySelector(targetEle).querySelector('.incoming-page').parentNode.childNodes.forEach((ele) => {
						if (ele.nodeName == 'DIV') {
							ele.classList.add('hide');
						}
					});
					document.querySelector(targetEle).querySelector('.incoming-page').classList.remove('hide');
					break;
			}
		}
	};

	App.common = common;
	window.App = App;
})(window);
