
jQuery(document).ready(function($) {
	var PPTrainer = (function() {

		var $pianoContainer = $('#pianoContainer'),
			$audio = $pianoContainer.find('audio'),
			$preloader =  $('#preloaderWrapper'),
			$preloaderPercent = $('#preloaderWrapper #percent'),
			$elemKeys = $pianoContainer.find('.key'),
			$info =  $pianoContainer.find('#info'),
			$indicator = $pianoContainer.find('.indicator'),
			$trainBtn = $pianoContainer.find('.startTrain'),
			$repeatBtn = $pianoContainer.find('.repeat'),
			$volumeSlider = $pianoContainer.find('#volumeSlider'),
			$overlay = $pianoContainer.find('.overlay'),
			$result = $pianoContainer.find('#result'),
			$totalAttempts = $result.children('#totalAttempts'),
			$comment = $result.children('#comment'),
			$tryAgainBtn = $result.children('#tryAgain'),
			$closeBtn = $result.children('#close'),
			keys = {},
			keysUrl = [ "sounds/C.mp3",
						"sounds/D.mp3",
						"sounds/E.mp3",
						"sounds/F.mp3",
						"sounds/G.mp3",
						"sounds/A.mp3",
						"sounds/B.mp3",
						"sounds/Db.mp3",
						"sounds/Eb.mp3",
						"sounds/Gb.mp3",
						"sounds/Ab.mp3",
						"sounds/Bb.mp3"];

		//initializate plugin
		function init () {
			audioLoading();

			generateKeys();
			
			//mouse events
			$pianoContainer.on('mousedown', '.key', function(event) {
				var keyCode = $(this).data('keyCode');
				keys[keyCode].pressKey();

				$pianoContainer.one('mouseup mouseleave', '.key', function(event) {
					keys[keyCode].depressKey();
				});
			});

			//keyboard events
			$(document).on({
				keydown : function(event) {

					//detect key
					var key = keys[event.which];

					//Property 'pressed' used to prevent  keyboard repetitive
					if (key && !key.pressed) {
						key.pressKey();
					}
				},

				keyup : function (event) {
					var key = keys[event.which];

					if (key) {
						key.depressKey();
					}
				}
			});

			//start train button event
			$trainBtn.click(function() {

				if (training.isRunning) {
					training.stop();
				} else {
					training.start();
				}
			});


			$volumeSlider.slider({
				min : 0,
				max : 1,
				step: 0.1,
				value : 0.5,
				create : function () {
					//set default volume
					setVolume(0.5);
				},

				slide : function	(event, ui) {
					setVolume(ui.value);

					//display value
					if (!training.isRunning) {
						$info.stop(true, true).html('<br>Volume: ' + ui.value * 100 + '%').show();
					}
				},

				stop : function () {
					if (!training.isRunning) {
						$info.delay(500).fadeOut('400');
					}
				}
			});

			$tryAgainBtn.click(function() {
				training.start();
				$overlay.fadeOut(400);
			});

			$closeBtn.click(function() {
				$overlay.fadeOut(400);
			});

		}

		//detect audio loading
		function audioLoading () {
			var count = 0,
				percent = 0;

			$preloader.show();

			$audio.one('loadedmetadata', function() {
				count++;
				percent += 8;


				if (count === 12) {
					$preloaderPercent.text(100);
					$overlay.fadeOut('400');
					$preloader.hide();
				}
				
				$preloaderPercent.text(percent);
			});

			$audio.on('error', function() {
					$preloader.hide();
					$('#error').show();
			});
		}

		//generate piano keys object and load audiofiles
		function generateKeys () {
			$elemKeys.each(function(index, el) {
				var keyCode = $(el).data('keyCode');

				keys[keyCode] = new Key($(el), keysUrl[index]);
			});
		}

		//key constructor
		function Key ($elem, url) {
			this.$elem = $elem;
			this.audio = this.$elem.children('audio')[0];
			this.noteName =$elem.attr('id');
			this.pressed = false;

			//load audiofiles
			$(this.audio).attr('src', url);
		}

		//Parameter isUser shows who call function, user or not.
		//default false
		Key.prototype.play = function(isUser) {
			var audio = this.audio;

			if (audio.currentTime !== 0) {
				audio.currentTime = 0;
			}

			if (audio.paused) {
				audio.play();
			}

			$pianoContainer.trigger('piano.notePlaying', [{
				isUser : isUser || false,
				noteName : this.noteName
			}]);
		};

		Key.prototype.pressKey = function() {
			Key.prototype.play.call(this, true);
			this.pressed = true;

			if (this.$elem.hasClass('white')) {
				this.$elem.addClass('whitePressed');
			} else {
				this.$elem.addClass('blackPressed');
			}
		};

		Key.prototype.depressKey = function() {
			this.pressed = false;
			this.$elem.removeClass('blackPressed whitePressed');
			$pianoContainer.trigger('piano.keyDepressed');
		};

		function setVolume (value) {
			$elemKeys.each(function() {
				$(this).children('audio')[0].volume = value;
			});
		}

		var	training = (function(){
			var trainerNote, resultInPercent , comment, lightIndicator,
				generatedNote, repeat, misses,
				userAttempts = { correct : 0, all : 0},
				setsLimit = 10,
				playDelay = 1500,
				infoNote = '?',
				count = 3;

			function startTraining () {
				var context = this;

				$trainBtn.addClass('startTrainPressed').children('span').text('Stop');
				context.isRunning = true;

				$pianoContainer.on('piano.notePlaying', function(event, played) {
					//if user press key, verify attempt
					if (played.isUser) {
						verifyAttempt(played.noteName, context);

 					//if random play, remember note name
					} else {
						trainerNote = played.noteName;
						infoNote = '?';
					}

					misses = userAttempts.all - userAttempts.correct;
					//display current result
					$info.html('Note: ' + infoNote + 
					      		 	'<br>Misses: ' + misses +
							 	'<br>Sets: ' + userAttempts.correct + '/' + setsLimit).show();
				});

				lightIndicator.on();
				repeat.on();
				countdown(function () {
					randomPlay(800);
				})
			}

			function stopTraining () {

				//if all sets completed, display result
				if (userAttempts.correct == setsLimit) {
					calculateTotal();
				}

				//reset to init state
				clearInterval(interval);
				lightIndicator.off();
				repeat.off();
				count = 3;
				this.isRunning = false;
				$pianoContainer.off('piano.notePlaying');
				$info.fadeOut(300);
				userAttempts.correct = 0;
				userAttempts.all = 0;
				$trainBtn.removeClass('startTrainPressed').children('span').text('Start');
			}

			function randomPlay (delay) {
				var keyMass = Object.keys(keys),
					randomIndex = Math.floor(Math.random() * keyMass.length);
					
				generatedNote = keys[keyMass[randomIndex]];

				//if note repeated, generate again.	
				if (generatedNote.noteName === trainerNote) {
					randomPlay(playDelay);
				} else {
					setTimeout(function(){
						generatedNote.play();
					}, delay);
				}
			}

			function verifyAttempt (noteName, context) {
				//correct attempt
				if (trainerNote === noteName) {
					++userAttempts.correct;
					++userAttempts.all;
					infoNote = trainerNote;

					//if all sets done, stop training
					if (userAttempts.correct === setsLimit) {
						stopTraining.call(context);
						return;
					}
					randomPlay(playDelay);

					$pianoContainer.trigger('piano.correct');

				//wrong attempt
				} else {
					++userAttempts.all;
					$pianoContainer.trigger('piano.incorrect');
				}			
			}

			function calculateTotal () {
				//calculate efficiency
				resultInPercent = Math.round((userAttempts.correct  * 100) / userAttempts.all);

				//generate comment
				if (resultInPercent <= 25) {
					comment = 'TRAIN MORE!';
				} else if (resultInPercent > 25 && resultInPercent < 50) {
					comment = 'YOU CAN DO BETTER!';
				} else if (resultInPercent >= 50 && resultInPercent < 75) {
					comment = 'GOOD!';
				} else if (resultInPercent >= 75  && resultInPercent < 100) {
					comment = 'EXCELLENT!';
				} else if (resultInPercent === 100 ) {
					comment = 'MOZART, IS IT YOU?';
				}

				//show result
				$totalAttempts.html('Sets: ' + userAttempts.correct +
									 '<br>Misses: ' + misses  +
									 '<br>Efficiency: ' + resultInPercent + '%');
				$comment.html(comment);
				$overlay.show();
				$result.addClass('bounceIn');
			}

			function countdown (callback) {
				interval = setInterval(function(){
					$info.stop(true, true)
							.html('<br>' + count )
							.fadeIn(200)
							.delay(300)
							.fadeOut(200);

					if (count === 1) {
						clearInterval(interval);
						count = 3;
						callback();
					}

					count--;
				}, 800);
			}

			lightIndicator = {
				on : function () {
					$pianoContainer.on({
						'piano.correct' : function () {
							$indicator.removeClass('indicatorRed').addClass('indicatorGreen');
						},

						'piano.incorrect' : function () {
							$indicator.removeClass('indicatorGreen').addClass('indicatorRed');
						},

						'piano.keyDepressed' : function () {
							for (var key in keys) {
								if (keys[key].pressed) {
									return;
								}
							}
							$indicator.removeClass('indicatorGreen indicatorRed');
						}
					});
				},

				off : function () {
					$indicator.removeClass('indicatorGreen indicatorRed');
					$pianoContainer.off('training.correct training.incorrect key.Depressed');
				}
			}

			repeat = {
				$elem : $repeatBtn,

				on : function () {
					var context = this;

					this.$elem.mousedown(function () {
							$(this).addClass('repeatPressed');
							if (generatedNote) generatedNote.play();
					});

					$(document).mouseup(function() {
						context.$elem.removeClass('repeatPressed');
					});
				},

				off : function () {
					this.$elem.off('mousedown mouseup');
				}
			}

			return {
				start : startTraining,
				stop : stopTraining,
				isRunning : false
			}
		})();

		//public methods
		return {
			init : init
		};
	})();

	//initialize application. Load audiofiles.
	$('#runApp').click(function() {
		$(this).hide();

		PPTrainer.init();
	});
});