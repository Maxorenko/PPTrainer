(function() {

	var PPTrainer = angular.module('PPTrainer', ['services' , 'directives', 'angular-slider-easy']);

	PPTrainer.controller('PPTrainerController', ['$scope','bindKeyboard', 'trainingService',  function ($scope, bindKeyboard, trainingService) {
			var vm = this, audioCount = 0;

			vm.audio = {
				loading: false,
				loaded: false,
				error: false,
				percent: 0,

				startLoad : function () {
					this.loading = true;
				}
			};

			$scope.$on('percentChanged', function (event, percent) {
				$scope.$apply(function () {
					vm.audio.percent = percent;
				});
			});

			$scope.$on('allAudioLoaded', function () {
				vm.audio.loading = false;
				vm.audio.loaded = true;
				$scope.$apply();
			});

			$scope.$on('LoadingError', function () {
				vm.audio.loading = false;
				vm.audio.error = true;
				$scope.$apply();
			});

			vm.keys = keys;
			vm.training = trainingService;
			vm.training.keysObj = vm.keys;

			bindKeyboard($scope, vm.keys);
	}]);

	PPTrainer.controller('ControlsPanelController', ['$scope', 'trainingService', 'indicatorService', 'setVolumeService', function ($scope, trainingService, indicatorService, setVolumeService) {
		var vm = this;

		vm.indicator = indicatorService;
		
		vm.startButton = {
			label: 'Start',

			toggle: function () {

				if (trainingService.started) {
					trainingService.stop();
					this.label = 'Start';
				}

				else {
					trainingService.start();
					this.label = 'Stop';
				}
			}
		};

		vm.repeater = {
			pressed: false,

			toggle: function () {
				if (!this.pressed) {
					this.pressed = true;
					trainingService.repeatRandomNote();
				} else {
					this.pressed = false;
				}
			}
		};

		vm.volumeSlider = {
			showValue: false,
			
			option: {
				start: 0, 
				end: 10
			},

			val: {
				point: 5
			},

			events: function () {
				var slider = this,
					value = slider.val.point;

				setVolumeService.setValue(slider.val.point / 10);

				$scope.$on('sliderMove', function () {
					if (!slider.showValue) {
						slider.showValue = true;
					}

					setVolumeService.setValue(slider.val.point / 10);
				});

				$scope.$on('sliderMoveEnd', function () {
					$scope.$apply(function () {
						slider.showValue = false;
					});
				});
			}
		};

		vm.volumeSlider.events();
	}]);

	var keys = [
		{
			noteName : 'C',
			keyCode : '81',
			url : 'sounds/C.mp3',
			white : true,
			pressed : false,
			random: false
		},
		{
			noteName : 'D',
			keyCode : '87',
			url : 'sounds/D.mp3',
			white : true,
			pressed : false,
			random: false
		},
		{
			noteName : 'E',
			keyCode : '69',
			url : 'sounds/E.mp3',
			white : true,
			pressed : false,
			random: false
		},
		{
			noteName : 'F',
			keyCode : '82',
			url : 'sounds/F.mp3',
			white : true,
			pressed : false,
			random: false
		},
		{
			noteName : 'G',
			keyCode : '84',
			url : 'sounds/G.mp3',
			white : true,
			pressed : false,
			random: false
		},
		{
			noteName : 'A',
			keyCode : '89',
			url : 'sounds/A.mp3',
			white : true,
			pressed : false,
			random: false
		},
		{
			noteName : 'B',
			keyCode : '85',
			url : 'sounds/B.mp3',
			white : true,
			pressed : false,
			random: false
		},
		{
			noteName : 'Db',
			keyCode : '50',
			url : 'sounds/Db.mp3',
			white : false,
			pressed : false,
			random: false
		},
		{
			noteName : 'Eb',
			keyCode : '51',
			url : 'sounds/Eb.mp3',
			white : false,
			pressed : false,
			random: false
		},
		{
			noteName : 'Gb',
			keyCode : '53',
			url : 'sounds/Gb.mp3',
			white : false,
			pressed : false,
			random: false
		},
		{
			noteName : 'Ab',
			keyCode : '54',
			url : 'sounds/Ab.mp3',
			white : false,
			pressed : false,
			random: false
		},
		{
			noteName : 'Bb',
			keyCode : '55',
			url : 'sounds/Bb.mp3',
			white : false,
			pressed : false,
			random: false
		}
	];

})();
