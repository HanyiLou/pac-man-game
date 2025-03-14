player = stage.createItem({
				width: 30,
				height: 30,
				type: 1,
				location: map,
				visible: true,
				coord: { x: 13.5, y: 23 },
				orientation: 2,
				speed: 1,
				score: 0, // 添加玩家个人分数
				frames: 10,
				update: function () {
					var coord = this.coord;
					
					// 如果玩家处于等待模式，不进行任何更新
					if (this.isWaiting) {
						return;
					}
					
					if (!coord.offset) {
						if (typeof this.control.orientation != 'undefined') {
							var nextX = coord.x + _COS[this.control.orientation];
							var nextY = coord.y + _SIN[this.control.orientation];
							var value = map.get(nextX, nextY);
							
							if (!map.get(nextX, nextY)) {
								this.orientation = this.control.orientation;
								// 直接更新位置到下一个格子
								if (value == 0) {
									this.x = nextX * map.size + map.size / 2;
									this.y = nextY * map.size + map.size / 2;
								} else if (value < 0) {
									// 穿墙时的位置更新
									if (this.orientation == 1) {  // 向右
										this.x = map.size / 2;
										this.y = this.y;
									} else if (this.orientation == 3) {  // 向左
										this.x = (map.x_length - 0.5) * map.size;
										this.y = this.y;
									}
								}
							}
						}
						this.control = {};
					} else {
						if (!beans.get(this.coord.x, this.coord.y)) {    //吃豆
							_SCORE++; 
							this.score++; // 增加玩家的个人分数
							remainingBeans--;
							beans.set(this.coord.x, this.coord.y, 1);
							if (config['goods'][this.coord.x + ',' + this.coord.y]) {    //吃到能量豆
								items.forEach(function (item) {
									if (item.status == 1 || item.status == 3) {    //如果NPC为正常状态，则置为临时状态
										item.timeout = 450;
										item.status = 3;
									}
								});
							}
						}
					}
				},
				draw: function (context) {
					context.fillStyle = '#FFE600';
					context.beginPath();
					if (stage.status != 3) {	//玩家正常状态
						if (this.times % 2) {
							context.arc(this.x, this.y, this.width / 2, (.5 * this.orientation + .20) * Math.PI, (.5 * this.orientation - .20) * Math.PI, false);
						} else {
							context.arc(this.x, this.y, this.width / 2, (.5 * this.orientation + .01) * Math.PI, (.5 * this.orientation - .01) * Math.PI, false);
						}
					} else {	//玩家被吃
						if (stage.timeout) {
							context.arc(this.x, this.y, this.width / 2, (.5 * this.orientation + 1 - .02 * stage.timeout) * Math.PI, (.5 * this.orientation - 1 + .02 * stage.timeout) * Math.PI, false);
						}
					}
					context.lineTo(this.x, this.y);
					context.closePath();
					context.fill();
				}
			});
			//事件绑定
			stage.bind('keydown', function (e) {
				if (document.getElementById('missionPopup').style.display === 'block') {
					// 如果提示框显示，空格键不切换游戏状态
					return;
				}
				switch (e.keyCode) {
					case 13: //回车
					case 32: //空格
						//this.status = this.status == 2 ? 1 : 2; //暂停游戏or继续游戏
						//break;
					case 39: //右
						player.control = { orientation: 0 };
						break;
					case 40: //下
						player.control = { orientation: 1 };
						break;
					case 37: //左
						player.control = { orientation: 2 };
						break;
					case 38: //上
						player.control = { orientation: 3 };
						break;
				}

			});

		});

	})();
	//结束画面
	(function () {
		var stage = game.createStage();
		//游戏结束
		stage.createItem({
			x: game.width / 2,
			y: game.height * .35,
			draw: function (context) {
				context.fillStyle = '#FFF';
				context.font = 'bold 48px PressStart2P';
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillText(_LIFE ? 'YOU WIN!' : 'GAME OVER', this.x, this.y);
			}
		});
		//记分
		stage.createItem({
			x: game.width / 2,
			y: game.height * .5,
			draw: function (context) {
				context.fillStyle = '#FFF';
				context.font = '20px PressStart2P';
				context.textAlign = 'center';
				context.textBaseline = 'middle';
				context.fillText('FINAL SCORE: ' + (_SCORE + 50 * Math.max(_LIFE - 1, 0)), this.x, this.y);
			}
		});
		//事件绑定
		stage.bind('keydown', function (e) {
			switch (e.keyCode) {
				case 13: //回车
				case 32: //空格
					_SCORE = 0;
					_LIFE = 5;
					game.setStage(1);
					break;
			}
		});
	})();

	const myFont = new FontFace('PressStart2P', 'url(./static/font/PressStart2P.ttf)');
	myFont.load().then(font => {
		document.fonts.add(font);
		game.init();
	});
})();
