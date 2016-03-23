(function () {
	var PPTrainer = angular.module('services', []);

	PPTrainer.factory('audioService', ['$rootScope', function ($rootScope) {
		var count = 0,
			errorLoad = false,
			percent = 0;

		return {
			audioLoaded: function () {
				count++;
				percent +=8;

				$rootScope.$broadcast('percentChanged', percent);

				if (count === 12) {
					$rootScope.$broadcast('allAudioLoaded');
				}
			}, 

			error: function () {
				if (errorLoad) return;
				
				$rootScope.$broadcast('LoadingError');
				errorLoad = true;
			}
		}
	}]);

	PPTrainer.factory('keyService', function () {
		return {
			press: function (key) {
				key.pressed = true
				this.pressedKey = key;			
			},

			depress: function (key) {
				key.pressed = false;
			},

			pressedKey: {
				pressed: 'random'
			}
		};
	});

	PPTrainer.factory('trainingService', ['$timeout', '$interval', '$rootScope', 'keyService', 'indicatorService', function ($timeout, $interval, $rootScope, keyService, indicatorService) {
		var randomKey, timeoutPromise, training, verifyWatcher, preventRepeatity, counter, intervalPromise,
			setsLimit = 10, 
			userAttempts = {
				correct: 0,
				all: 0
			};

		training = {
			keysObj: null,

			start: function () {
				this.started = true;
				this.showTotal = false;

				countdown(function () {
					training.showCounter = false;
					training.showInfo = true;
					resetCalculations();
					randomPlay(0);
					verify();
				});
			},

			stop: function () {

				if (this.showInfo) {
					verifyWatcher();
					this.showTotal = true;
					calculateTotal();
					indicatorService.off();
					randomKey.random = false;
				}

				this.showInfo = false;
				this.showCounter = false;
				this.started = false;
				$timeout.cancel(timeoutPromise);
				$interval.cancel(intervalPromise);

			},

			repeatRandomNote: function () {
				if (!this.started) return;

				if (!randomKey) return;  
				
				if (randomKey.random === 'random') {
					randomKey.random = 'repeat';
				} else if (randomKey.random ==="repeat") {
					randomKey.random = 'random';
				}
			},

			counter: 3,
			showInfo: false,
			showCounter: false,
			started: false,
			sets: '0/' + setsLimit,
			misses: 0,
			showTotal: false,
			comment: 'No comment',
			efficiency: 0,
			noteInfo: '?'
		};

		function countdown (callback) {
			training.showCounter = true;
			training.counter = 3;

			intervalPromise = $interval(function () {
				if (training.counter === 1) {
					callback();
				}

				training.counter--;
			}, 800, 3);
		}

		function randomPlay (delay) {
		 	var randomIndex = Math.floor(Math.random() * training.keysObj.length);

		 	randomKey = training.keysObj[randomIndex];

			 if (randomIndex === preventRepeatity) {
			 	randomPlay(delay);
			 	return;
			 }

			 preventRepeatity = randomIndex;

			 timeoutPromise = $timeout(function () {
				randomKey.random = 'random';
				training.noteInfo = '?';
			 }, delay);
		}

		function verify () {
			verifyWatcher = $rootScope.$watch(function () {
				return keyService.pressedKey.pressed;
			}, 

			function (newVal, oldVal) {
				var key = keyService.pressedKey;

				if (key.pressed === false ) indicatorService.off();

				if (key.pressed === 'random' || !key.pressed) return;
				
				//right answer
				if (key.pressed && key.random) {
					++userAttempts.correct;
					++userAttempts.all;
					training.sets = userAttempts.correct + '/' + setsLimit;

					indicatorService.makeGreen();

					training.noteInfo = key.noteName;
					key.random = false;

					if (userAttempts.correct === setsLimit) {
						training.stop();
						return;
					}

					randomPlay(1500);
				}

				//wrong
				else {
					indicatorService.makeRed();
					++training.misses;
				}

				++userAttempts.all;
			});
		}

		function calculateTotal () {
			//calculate efficiency
			training.efficiency = Math.round((userAttempts.correct  * 100) / userAttempts.all);
			if (isNaN(training.efficiency)) training.efficiency = 0;

			//generate comment
			if (training.efficiency <= 25) {
				training.comment = 'TRAIN MORE!';
			} else if (training.efficiency > 25 && training.efficiency < 50) {
				training.comment = 'YOU CAN DO BETTER!';
			} else if (training.efficiency >= 50 && training.efficiency < 75) {
				training.comment = 'GOOD!';
			} else if (training.efficiency >= 75  && training.efficiency < 100) {
				training.comment = 'EXCELLENT!';
			} else if (training.efficiency === 100 ) {
				training.comment = 'MOZART, IS IT YOU?';
			}
		}

		function resetCalculations () {
			training.misses = 0;
			training.efficiency = 0;
			userAttempts.correct = 0;
			userAttempts.all = 0;
			training.sets = '0/' + setsLimit;
		}

		return training;
	}]);

	PPTrainer.factory('indicatorService', function () {
		indicator = {
			red: false,
			green: false,

			off: function () {
				this.red = false;
				this.green = false;
			},

			makeRed: function () {
				if (this.green) {
					this.green = false;
				}

				this.red = true;
			},

			makeGreen: function () {
				if (this.red) {
					this.red = false;
				}

				this.green = true;
			}
		};

		return indicator;
	});

	PPTrainer.factory('setVolumeService', function () {
		return {
			value: 0,

			setValue: function (newValue) {
				this.value = newValue;
			}
		};
	});

	PPTrainer.factory('bindKeyboard', ['keyService', function (keyService) {
		var	pressedKeys = {};

		function bindKeyboardToKeys (scope, keys) {
			scope.$on('kDown', function (event, keyCode) {
				keys.forEach(function (item, index) {

					if (item.keyCode != keyCode) return;

					if (!item.pressed) {
						scope.$apply(function () {
							keyService.press(item);
						});

						pressedKeys[keyCode] = index;
					}
				});
			});

			scope.$on('kUp', function (event, keyCode) {
				var index =  pressedKeys[keyCode];

				if (index === undefined) return;

				scope.$apply(function () {
					keyService.depress(keys[index]);
				});
			});
		}

		return bindKeyboardToKeys;
	}]);
})();