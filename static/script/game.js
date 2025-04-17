// --- START OF MODIFIED game.js ---

'use strict';

// requestAnimationFrame polyfill
if (!Date.now)
Date.now = function() { return new Date().getTime(); };
(function() {
    'use strict';
    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
        var vp = vendors[i];
        window.requestAnimationFrame = window[vp+'RequestAnimationFrame'];
        window.cancelAnimationFrame = (window[vp+'CancelAnimationFrame'] || window[vp+'CancelRequestAnimationFrame']);
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) // iOS6 is buggy
    || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
        var lastTime = 0;
        window.requestAnimationFrame = function(callback) {
            var now = Date.now();
            var nextTime = Math.max(lastTime + 16, now);
            return setTimeout(function() { callback(lastTime = nextTime); },
            nextTime - now);
        };
        window.cancelAnimationFrame = clearTimeout;
    }
}());

function Game(id,params){
    var _ = this;
    var settings = {
        width:960,						//画布宽度
        height:640						//画布高度 (保持和你提供的一致)
    };
    Object.assign(_,settings,params);
    var $canvas = document.getElementById(id);
     // 添加检查 $canvas 是否存在
     if (!$canvas) {
         console.error("Canvas element with ID '" + id + "' not found.");
         alert("错误：找不到画布元素！游戏无法启动。");
         return; // 阻止进一步执行
     }
    $canvas.width = _.width;
    $canvas.height = _.height;
    var _context = $canvas.getContext('2d');	//画布上下文环境
    var _stages = [];							//布景对象队列
    var _events = {};							//事件集合
    var _index=0,								//当前布景索引
        _hander;  								//帧动画控制

    //活动对象构造 (保持不变)
    var Item = function(params){
        this._params = params||{};
        this._id = 0;
        this._stage = null;
        this._settings = {
            x:0, y:0, width:20,	height:20, type:0, color:'#F00', status:1,
            orientation:0, speed:0, location:null, coord:null, path:[], vector:null,
            frames:1, times:0, timeout:0, control:{},
            update:function(){}, draw:function(){}
        };
        Object.assign(this,this._settings,this._params);
    };
    Item.prototype.bind = function(eventType,callback){
         if(!_events[eventType]){
             _events[eventType] = {};
             $canvas.addEventListener(eventType,function(e){
                 var position = _.getPosition(e);
                 // 添加检查 _stages[_index]
                 if (_stages[_index] && _stages[_index].items) {
                     _stages[_index].items.forEach(function(item){
                         // 添加检查 item
                         if(item && item.x<=position.x&&position.x<=item.x+item.width&&item.y<=position.y&&position.y<=item.y+item.height){
                             var key = 's'+_index+'i'+item._id;
                             if(_events[eventType] && _events[eventType][key]){ // 添加检查 _events[eventType]
                                 _events[eventType][key](e);
                             }
                         }
                     });
                 }
                 e.preventDefault();
             });
         }
         // 添加检查 _events[eventType]
         if (_events[eventType] && this._stage) { // 检查 _stage 是否存在
             _events[eventType]['s'+this._stage.index+'i'+this._id] = callback.bind(this);
         }
    };

    //地图对象构造器 (保持不变)
    var Map = function(params){
        this._params = params||{};
        this._id = 0;
        this._stage = null;
        this._settings = {
            x:0, y:0, size:20, data:[], x_length:0, y_length:0,
            frames:1, times:0, cache:false, imageData: null, // 添加 imageData
            update:function(){}, draw:function(){}
        };
        Object.assign(this, this._settings, this._params); // 应用默认值和构造参数
         // 如果传入了 data，则计算 length
         if (this._params.data && this.data.length === 0) {
              this.data = JSON.parse(JSON.stringify(this._params.data)); // 深拷贝
              this.y_length = this.data.length;
              this.x_length = this.data[0] ? this.data[0].length : 0;
         } else if (this.data.length > 0) {
             this.y_length = this.data.length;
             this.x_length = this.data[0] ? this.data[0].length : 0;
         }
    };
    Map.prototype.get = function(x,y){
        // 添加边界检查
        if(y >= 0 && y < this.y_length && x >= 0 && x < this.x_length){
             return this.data[y][x];
         }
        return -1;
    };
    Map.prototype.set = function(x,y,value){
        // 添加边界检查
        if(y >= 0 && y < this.y_length && x >= 0 && x < this.x_length){
            this.data[y][x] = value;
        }
    };
    Map.prototype.coord2position = function(cx,cy){
        return { x:this.x+cx*this.size+this.size/2, y:this.y+cy*this.size+this.size/2 };
    };
    Map.prototype.position2coord = function(x,y){
         // 添加检查 this.size
         if (this.size === 0) return { x: 0, y: 0, offset: 0 };
         var ix = (x-this.x)/this.size;
         var iy = (y-this.y)/this.size;
         var fx = ix%1-0.5;
         var fy = iy%1-0.5;
         return { x:Math.floor(ix), y:Math.floor(iy), offset:Math.sqrt(fx*fx+fy*fy)*this.size };
    };
    Map.prototype.finder = function(params){ // 寻路算法保持不变
        var defaults = { map:null, start:{}, end:{}, type:'path' };
        var options = Object.assign({},defaults,params);
         if (!options.map || options.map.length === 0 || !options.map[0] || !options.start || !options.end || !options.map[options.start.y] || !options.map[options.end.y]) {
             console.error("Map finder: Invalid map, start, or end points.");
             return [];
         }
         if (options.start.y < 0 || options.start.y >= options.map.length || options.start.x < 0 || options.start.x >= options.map[0].length ||
             options.end.y < 0 || options.end.y >= options.map.length || options.end.x < 0 || options.end.x >= options.map[0].length) {
            console.error("Map finder: Start or end point out of bounds.");
            return [];
         }
        // 允许起点或终点在墙上 (原逻辑)
        // if(options.map[options.start.y][options.start.x]>0||options.map[options.end.y][options.end.x]>0){ return []; }

        var finded = false;
        var result = [];
        var y_length = options.map.length;
        var x_length = options.map[0].length;
        var steps = Array(y_length).fill(0).map(()=>Array(x_length).fill(0));
        var _getValue = function(x,y){
            if(options.map[y]&&typeof options.map[y][x]!='undefined'){ return options.map[y][x]; }
            return -1;
        };
        var _next = function(to){ /* ... _next 逻辑不变 ... */ var value=_getValue(to.x,to.y);if(value<1){if(value==-1){to.x=(to.x+x_length)%x_length;to.y=(to.y+y_length)%y_length;to.change=1;}if(!steps[to.y][to.x]){result.push(to);}} };
        var _render = function(list){ /* ... _render 逻辑不变 ... */ var new_list=[];var next=function(from,to){var value=_getValue(to.x,to.y);if(value<1){if(value==-1){to.x=(to.x+x_length)%x_length;to.y=(to.y+y_length)%y_length;to.change=1;}if(to.x==options.end.x&&to.y==options.end.y){steps[to.y][to.x]=from;finded=true;}else if(!steps[to.y][to.x]){steps[to.y][to.x]=from;new_list.push(to);}}};list.forEach(function(current){next(current,{y:current.y+1,x:current.x});next(current,{y:current.y,x:current.x+1});next(current,{y:current.y-1,x:current.x});next(current,{y:current.y,x:current.x-1});});if(!finded&&new_list.length){_render(new_list);} };
        _render([options.start]);
        if(finded){
            var current=options.end;
            if(options.type=='path'){ while(current.x!=options.start.x||current.y!=options.start.y){ result.unshift(current); current=steps[current.y][current.x]; } }
            else if(options.type=='next'){ _next({x:current.x+1,y:current.y}); _next({x:current.x,y:current.y+1}); _next({x:current.x-1,y:current.y}); _next({x:current.x,y:current.y-1}); }
        }
        return result;
    };

    //布景对象构造器 (保持不变)
    var Stage = function(params){
        this._params = params||{};
        this._settings = {
            index:0, status:0, maps:[], audio:[], images:[], items:[],
            timeout:0, update:function(){}
        };
        Object.assign(this, this._settings, this._params);
        // 重新初始化数组，防止共享引用
        this.maps = Array.isArray(this._params.maps) ? [...this._params.maps] : [];
        this.audio = Array.isArray(this._params.audio) ? [...this._params.audio] : [];
        this.images = Array.isArray(this._params.images) ? [...this._params.images] : [];
        this.items = Array.isArray(this._params.items) ? [...this._params.items] : [];
    };
    Stage.prototype.createItem = function(options){ // 保持不变
        var item = new Item(options);
        if(item.location && item.coord){
            Object.assign(item,item.location.coord2position(item.coord.x,item.coord.y));
        }
        item._stage = this;
        item._id = this.items.length;
        this.items.push(item);
        return item;
    };
    Stage.prototype.resetItems = function(){ // 保持不变 (依赖 _settings 和 _params)
        // this.status = 1; // 重置 stage 状态可能不在这里做
        this.items.forEach(function(item){
             // 基础重置：恢复到构造时的状态
             if (item._params) Object.assign(item, item._params);
             if (item._settings) {
                 for (const key in item._settings) {
                     if (!(key in item._params) && item._settings.hasOwnProperty(key)) {
                         item[key] = item._settings[key];
                     }
                 }
             }
             // 特别重置位置
             if(item.location && item.coord){
                 Object.assign(item,item.location.coord2position(item.coord.x,item.coord.y));
             }
             // 重置其他状态
             item.timeout = item._params?.timeout ?? item._settings?.timeout ?? 0;
             item.path = item._params?.path ? [...item._params.path] : (item._settings?.path ? [...item._settings.path] : []);
             item.vector = item._params?.vector ? {...item._params.vector} : (item._settings?.vector ? {...item._settings.vector} : null);
             item.control = {};
             item.times = 0;
             item.status = item._params?.status ?? item._settings?.status ?? 1; // 确保状态重置
        });
    };
    Stage.prototype.getItemsByType = function(type){ // 保持不变
        return this.items.filter(function(item){ return item.type == type; });
    };
    Stage.prototype.createMap = function(options){ // 保持不变
        var map = new Map(options);
        map._stage = this;
        map._id = this.maps.length;
        this.maps.push(map);
        return map;
    };
    Stage.prototype.resetMaps = function(){ // 保持不变 (依赖 _settings 和 _params)
        // this.status = 1; // 同上
        this.maps.forEach(function(map){
             // 基础重置
             if (map._params) Object.assign(map, map._params);
             if (map._settings) {
                 for (const key in map._settings) {
                     if (!(key in map._params) && map._settings.hasOwnProperty(key)) {
                         map[key] = map._settings[key];
                     }
                 }
             }
             // 确保 data 被正确重置
             if (map._params && map._params.data) {
                  map.data = JSON.parse(JSON.stringify(map._params.data));
                  map.y_length = map.data.length;
                  map.x_length = map.data[0] ? map.data[0].length : 0;
              } else {
                  map.data = map._settings?.data ? JSON.parse(JSON.stringify(map._settings.data)) : [];
                  map.y_length = map.data.length;
                  map.x_length = map.data[0] ? map.data[0].length : 0;
              }
             map.imageData = null; // 清除缓存
             map.times = 0;
        });
    };
    Stage.prototype.reset = function(){ // 保持不变
        // Object.assign(this,this._settings,this._params); // 谨慎使用
        this.timeout = this._params?.timeout ?? this._settings?.timeout ?? 0;
        // this.status = this._params?.status ?? this._settings?.status ?? 0; // status 由 setStage 控制
        this.resetMaps();
        this.resetItems();
    };
    Stage.prototype.bind = function(eventType,callback){ // 保持不变
        if(!_events[eventType]){
            _events[eventType] = {};
            window.addEventListener(eventType,function(e){
                 if (_events[eventType]) { // 检查
                     var key = 's' + _index;
                     if(_events[eventType][key]){
                         _events[eventType][key](e);
                     }
                 }
                 // e.preventDefault(); // 按需调用
            });
        }
        if (_events[eventType] && this.index != null) { // 检查 index
            _events[eventType]['s'+this.index] = callback.bind(this);
        }
    };

    //动画开始 (主循环, 保持不变)
    this.start = function() {
        var f = 0;
        var timestamp = Date.now();
        var fn = function(){
            var now = Date.now();
            if(now-timestamp<16){
                _hander = requestAnimationFrame(fn);
                return;
            }
            timestamp = now;
            var stage = _stages[_index];
            if (!stage) { console.error("Animation loop: Stage " + _index + " not found."); _.stop(); return; } // 安全检查
            _context.clearRect(0,0,_.width,_.height);
            _context.fillStyle = '#000000';
            _context.fillRect(0,0,_.width,_.height);
            f++;
            if(stage.timeout > 0){ stage.timeout--; } // 检查大于0

            var continueDrawing = true;
            if(typeof stage.update === 'function' && stage.update() === false){ continueDrawing = false; }

            if(continueDrawing){
                 if (stage.maps) { // 检查 maps 数组
                     stage.maps.forEach(function(map){
                         if (!map) return; // 检查 map
                         if(map.frames > 0 && !(f%map.frames)){ map.times = f/map.frames; }
                         if(map.cache){
                             if(!map.imageData){
                                 _context.save();
                                 if(typeof map.draw === 'function') map.draw(_context); // 检查 draw
                                 map.imageData = _context.getImageData(0,0,_.width,_.height);
                                 _context.restore();
                             }else{ _context.putImageData(map.imageData,0,0); }
                         }else{
                             if(typeof map.update === 'function') map.update(); // 检查 update
                             if(typeof map.draw === 'function') map.draw(_context); // 检查 draw
                         }
                     });
                 }
                 if (stage.items) { // 检查 items 数组
                     stage.items.forEach(function(item){
                         if (!item) return; // 检查 item
                         if(item.frames > 0 && !(f%item.frames)){ item.times = f/item.frames; }
                          // --- 修改状态检查，允许 status 3 (临时/害怕) 也更新 ---
                          if(stage.status === 1 && (item.status === 1 || item.status === 3)){ // 检查 stage 和 item 状态
                             if(item.location && item.coord){
                                 item.coord = item.location.position2coord(item.x,item.y);
                             }
                             if(item.timeout > 0){ item.timeout--; } // 检查大于 0
                             if(typeof item.update === 'function') item.update(); // 检查 update
                         }
                         if(typeof item.draw === 'function') item.draw(_context); // 检查 draw
                     });
                 }
            }
            _hander = requestAnimationFrame(fn);
        };
        _hander = requestAnimationFrame(fn);
    };
    //动画结束 (保持不变)
    this.stop = function(){
        if (_hander) { cancelAnimationFrame(_hander); _hander = null; }
    };
    //事件坐标 (保持不变)
    this.getPosition = function(e){
        if (!$canvas) return { x: 0, y: 0 }; // 安全检查
        var box = $canvas.getBoundingClientRect();
        var scaleX = (box.width > 0) ? (_.width / box.width) : 1;
        var scaleY = (box.height > 0) ? (_.height / box.height) : 1;
        return { x:(e.clientX-box.left)*scaleX, y:(e.clientY-box.top)*scaleY };
    };
    //创建布景 (保持不变)
    this.createStage = function(options){
        var stage = new Stage(options);
        stage.index = _stages.length;
        _stages.push(stage);
        return stage;
    };

    // --- 指定布景 (核心修改处) ---
    this.setStage = function(index){
        // 停止当前 stage (如果存在)
        if (_stages[_index]) {
            _stages[_index].status = 0;
        }
        // 设置新索引并获取新 stage
        _index = index;
        var currentStage = _stages[_index];

        // 检查新 stage 是否有效
        if (currentStage) {
            currentStage.status = 1; // 标记为活动
            currentStage.reset();    // 调用 stage 的 reset 方法 (这个方法会调用 resetMaps 和 resetItems)

            // 【*** 核心修改 开始 ***】
            // 检查新舞台是否有 init 方法，如果有则调用它
            if (typeof currentStage.init === 'function') {
                // console.log("调用舞台 " + _index + " 的 init 方法"); // 可选的调试输出
                currentStage.init();
            }
            // 【*** 核心修改 结束 ***】

            return currentStage; // 返回激活的 stage
        } else {
            console.error("错误: 尝试设置的舞台索引无效:", index);
            return null; // 或者返回到第一个舞台: return this.setStage(0);
        }
    };
    // --- 核心修改结束 ---

    //下个布景 (保持不变)
    this.nextStage = function(){
        if(_index < _stages.length - 1){
            return this.setStage(++_index); // 调用修改后的 setStage
        } else {
             console.error('nextStage 错误: 没有下一个舞台。');
             return null;
        }
    };
    //获取布景列表 (保持不变)
    this.getStages = function(){ return _stages; };

    //初始化游戏引擎
    this.init = function(){
        _index = 0; // 设置初始索引为 0

        // 【*** 核心修改 开始 ***】
        // 检查并调用第一个舞台的 init 方法 (如果存在)
        if (_stages[_index] && typeof _stages[_index].init === 'function') {
             // console.log("调用初始舞台 (0) 的 init 方法"); // 可选的调试输出
             _stages[_index].init();
         } else if (_stages[_index]) {
             // 如果第一个舞台没有 init，确保它状态为 1 并被 reset
             _stages[_index].status = 1;
             _stages[_index].reset();
         }
         // 【*** 核心修改 结束 ***】

        this.start(); // 启动动画循环
    };
}
// --- END OF MODIFIED game.js ---