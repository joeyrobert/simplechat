var SimpleChat = angular.module('SimpleChat', ['ngSanitize']);

/* Service example */
SimpleChat.factory('MessageService', function($q, $http) {
	return {
		getMessages: function() {
			var deferred = $q.defer();
			$http.get('simplechat.json').then(function(response) {
				deferred.resolve(response.data.messages);
			});
			return deferred.promise;
		},
		submitMessage: function(name, message) {
			var deferred = $q.defer();
			$http.post('/', {
				message: message,
				name: name
			}).then(function() {
				deferred.resolve();
			});
			return deferred.promise;
		}
	};
});

SimpleChat.filter('timestampToTime', function() {
	return function(input) {
		return moment(Number(input)*1000).format('HH:mm:ss');
	}
});

SimpleChat.filter('sanitize', function($sanitize) {
	return function(input) {
		return $sanitize(input);
	}
});

function ChatController($scope, $http, $q, MessageService) {
	$scope.messageLimit = 500;
	$scope.data = {};

	$scope.setName = function(chatName) {
		$scope.data.name = chatName;

		/* Persist name */
		$.cookie('simplechat_name', $scope.data.name, {'path': '/', 'expires': 365});
		$scope.pollInterval();
	};

	$scope.clearName = function() {
		$scope.data = {};
		$scope.stopPollInterval();
		$.cookie('simplechat_name', '', {'path': '/', 'expires': -1});
	};

	$scope.getMessages = function() {
		MessageService.getMessages().then(function(messages) {
			if(!$scope.data.messages || messages.length !== $scope.data.messages.length) {
				$scope.data.messages = messages;
				$scope.scrollToBottomTimeout();
			}
		});
	};

	$scope.submitMessage = function() {
		if($scope.data.message && $scope.data.message.length > 0) {
			MessageService.submitMessage($scope.data.name, $scope.data.message).then(function() {
				$scope.getMessages();
				$scope.data.message = '';
			});	
		}
	};

	$scope.pollInterval = function() {
		$scope.pollIntervalId = setInterval(function() {
			$scope.getMessages();
		}, 3000);

		$scope.getMessages();
	};

	$scope.stopPollInterval = function() {
		if($scope.pollIntervalId) {
			clearInterval($scope.pollIntervalId);
		}
	};

	$scope.scrollToBottom = function() {
		var messagesHeight = 0;
		$('.message').each(function() {
			messagesHeight += $(this).height();
		});
		$('.message_list').animate({
			scrollTop: messagesHeight + 'px'
		}, 1000);
	};

	$scope.scrollToBottomTimeout = function() {
		setTimeout(function() {
			$scope.scrollToBottom();
		}, 50);
	};

	/* After methods have been defined */	
	$scope.data.name = $.cookie('simplechat_name');

	if(!$scope.data.name) {
		$scope.data.name = '';
	} else {
		$scope.pollInterval();
	}

	$scope.data.message = '';
}