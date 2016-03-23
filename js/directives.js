(function () {
	var PPTrainer = angular.module('directives', []);

	PPTrainer.directive('keyboardEvents', [ '$document' , '$rootScope', function ($document, $rootScope) {
		return {
			restrict: 'A',

			link: function () {
				$document.on('keydown', function (event) {
					$rootScope.$broadcast('kDown', event.which);
				});

				$document.on('keyup', function (event) {
					$rootScope.$broadcast('kUp', event.which);
				});
			}
		}
	}]);

	PPTrainer.directive('mouseEvents', ['keyService', function (keyService) {
		return {
			restrict: 'A',
			scope: {
				key: '=mouseEvents'
			},

			link: function (scope, elem) {
				elem.on('mousedown', function(event) {

					scope.$apply(function () {
						keyService.press(scope.key);
					});

					elem.one('mouseup mouseleave', function() {
						scope.$apply(function () {
							keyService.depress(scope.key);
						});	
					});
				});
			}
		}
	}]);

	PPTrainer.directive('playAudio', ['setVolumeService', 'audioService', function (setVolumeService, audioService) {
		return {
			restrict: 'A',
			link: function (scope, elem, attrs) {
				var audio = elem[0];

				//detect audio loading
				elem.on('loadedmetadata', function(event) {
					audioService.audioLoaded();
				});

				elem.on('error', function () {
					audioService.error();
				})

				scope.$watchCollection(attrs.playAudio, function (newKey, oldKey) {

					if (newKey.pressed) {
						playAudio();
					}

					if (newKey.random === 'random' || newKey.random === 'repeat') { 
						playAudio();
					}
				});

				function playAudio () {
				 	if (audio.currentTime !== 0) {
				 		audio.currentTime = 0;
				 	}

				 	if (audio.paused) {
				 		audio.play();
				 	}
				}

				//set volume
				scope.$watch(function () {
					return setVolumeService.value;
				
				}, function (newVal, oldVal) {
					elem[0].volume = newVal;
				});
			}
		}
	}]);
})();