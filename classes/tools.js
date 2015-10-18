var Tools = {
	_prev: null, //previous tool
	selected: null,
	set: function(id){
		if (this.selected !== this[id]){
			this._prev = this.selected;
			this.selected = this[id];
			this.selected.init();
		}
	},
	prev: function(){
		this.selected = this._prev;
		if (this.selected != null)
			this.selected.init();
	},
	onclick: function(){
		if (this.selected != undefined)
			this.selected.onclick();
	},
	onmove: function(){
		if (this.selected != undefined)
			this.selected.onmove();
	},
	onup: function(){
		if (this.selected != undefined)
			this.selected.onup();
	},
	onkeydown: function(e){
		if (e.keyCode == Keys.SPACE)
			this.set('scroll');
		if (this.selected != undefined)
			this.selected.onkeydown(e);
	},
	onkeyup: function(e){
		if (this.selected != undefined)
			this.selected.onkeyup(e);
	},
	render: function(_args){
		if (this.selected != undefined)
			this.selected.render(_args);
	},
	update: function(){
		
	}
};

//Apply zoom to anchor points, see photoshop tool and remake
Tools.pen = {
	that: Tools,
	type: 'pen',//required for properties panel
	selectedpoints: [],
	shape: function () { return Objects_list.selected; },
	properties: {
		threshold: '.05',
		restitution: '0',
		friction: '1',
		density: '1'
	},
	init : function(){
		Pointer.set_cursor('none');
	},
	onclick: function(){
		if (this.shape() == null){
			Objects_list.select(Objects_list.add_item(new object.body()).add_item(new object.shape({
					properties: {
									threshold: this.properties.threshold,
									restitution: this.properties.restitution,
									friction: this.properties.friction,
									density: this.properties.density								
								}
					})).id);
			this.shape().object.add_point({x: Pointer.rX, y: Pointer.rY});
		} else if (this.shape().object.type == 'body'){
			Objects_list.select(this.shape().add_item(new object.shape({
					properties: {
									threshold: this.properties.threshold,
									restitution: this.properties.restitution,
									friction: this.properties.friction,
									density: this.properties.density								
								}
					})).id);
			this.shape().object.add_point({x: Pointer.rX, y: Pointer.rY});
		} else if (this.shape().object.type == 'shape'){ 
			//if intersected select bezier point
			var newpos = (!Keys.list[Keys.CTRL]) ? false : this.points_intersected(true, 'cpoint');
			if (newpos != false){
				this.selectedpoints = newpos;
			} else 	{
				this.shape().object.add_point({x: Pointer.rX, y: Pointer.rY});
				var points = this.shape().object.cpoints;
				//Select bezier anchors to selected points, so you can move then
				this.selectedpoints = [];
				this.selectedpoints.push(points.last());
				this.selectedpoints.push(points.last(1));
			}
		}
	},
	points_intersected: function(_array, _type){//type = all/cpoint/point
		_array = (_array != undefined) ? _array : false;
		_type = (_type != undefined) ? _type : 'all';
		var res = [];
		if (this.shape() != null && this.shape().object.type == 'shape'){
			for (var i = 0; i < this.shape().object.cpoints.length; i++){
				for (var k = 0; k < this.selectedpoints.length &&
					this.shape().object.cpoints[i] != this.selectedpoints[k]; k++){
				}
				if (k == this.selectedpoints.length){ 
					if (_type != 'cpoint' && this.shape().object.points[i] != undefined &&
						Pointer.intersect({position: this.shape().object.points[i], size: {width: .05, height: .05}})){
						if (_array)
							res.push(this.shape().object.points[i]);
						else
							return this.shape().object.points[i];
					} else if (Pointer.intersect({position: this.shape().object.cpoints[i], size: {width: .05, height: .05}})){
						if (_array)
							res.push(this.shape().object.cpoints[i]);
						else
							return this.shape().object.cpoints[i];
					} 
				}
			}		
		}
		if (res.length > 0)
			return res;
		else
			return false;
	},
	onmove: function(){
		//Magnetic points
		if (newpos = this.points_intersected()){
			Pointer.rX = newpos.x;
			Pointer.rY = newpos.y;
		}
		//REVIEW THIS!!!
		if (this.selectedpoints.length > 0){
			if (this.selectedpoints.length == 2 && this.selectedpoints[0].point != undefined){
				this.selectedpoints[0].x = Pointer.rX; 
				this.selectedpoints[0].y = Pointer.rY;
				var dx = this.selectedpoints[0].x - this.selectedpoints[0].point.x, 
					dy = this.selectedpoints[0].y - this.selectedpoints[0].point.y;
				this.selectedpoints[1].x = this.selectedpoints[0].point.x - dx; 
				this.selectedpoints[1].y = this.selectedpoints[0].point.y - dy;
			} else {
				for (var i = 0; i < this.selectedpoints.length; i++){
					this.selectedpoints[i].x = Pointer.rX; 
					this.selectedpoints[i].y = Pointer.rY;
				}
			}
			this.shape().object.update();
		}
	},
	onup: function(){
		this.selectedpoints = [];
	},
	onkeydown: function(e){
		//Review preventdefault, only allowed in inputs
		if (e.keyCode == Keys.BACKSPACE){
			var obj = this.shape().object;
			obj.points.splice(obj.points.length - 1, 1);
			obj.cpoints.splice(obj.cpoints.length - 1, 1);
			obj.cpoints.splice(obj.cpoints.length - 1, 1);
			obj.update();
		}
	},
	onkeyup: function(e){
	},
	render: function(_args){
		var ctx = _args.ctx, repos = _args.repos;
		ctx.lineWidth = 2;
		ctx.fillStyle = 'rgba(255, 198, 0, .7)';
		ctx.strokeStyle = 'rgba(0, 0, 0, .7)';
		ctx.beginPath();
		if (this.shape() != null && this.shape().object.type == 'shape'){
			//bezier curves and points
			for (var k = 0; k < this.shape().object.cpoints.length; k++){
				if (this.shape().object.points[k] != undefined){
					ctx.moveTo(this.shape().object.points[k].x * repos,
										 this.shape().object.points[k].y * repos);
					ctx.arc(this.shape().object.points[k].x * repos,
							 		  this.shape().object.points[k].y * repos, 5, 0, 2*Math.PI);
				}
				ctx.moveTo(this.shape().object.cpoints[k].point.x * repos,
									 this.shape().object.cpoints[k].point.y * repos);
				ctx.lineTo(this.shape().object.cpoints[k].x * repos,
			 			 		  	 this.shape().object.cpoints[k].y * repos);
				ctx.moveTo(this.shape().object.cpoints[k].x * repos,
			 			 		  	 this.shape().object.cpoints[k].y * repos);
				ctx.arc(this.shape().object.cpoints[k].x  * repos,
					 		      this.shape().object.cpoints[k].y * repos, 5, 0, 2*Math.PI);
			}
			//points along the curves
			for (var k = 0; k < this.shape().object.rpoints.length; k++){
				ctx.moveTo(this.shape().object.rpoints[k].x  * repos,
					 		      this.shape().object.rpoints[k].y * repos);
				ctx.arc(this.shape().object.rpoints[k].x  * repos,
					 		      this.shape().object.rpoints[k].y * repos, 2, 0, 2*Math.PI);
			}
		}
		ctx.stroke();
	},
	update: function(){
	}
};

//Change center resize
Tools.transform = {
	option: 'default',
	type  : 'transform',//required for properties panel
	points: {nw: null, n: null, ne: null, e: null, se: null, s: null,  sw: null, w: null},//anchors points to resize
	origin: {x: null, y: null},
	size  : {width: null, height: null},
	scale : {x: 1, y: 1},
	shape: function () { return Objects_list.selected; },
	properties: {
		width: '1',
		height: '1'
	},
	reset_properties: function(){
		this.scale = {x: 1, y: 1};
		this.properties = {
			width: '1',
			height: '1'
		};
	},
	init : function(){
		Pointer.set_cursor('default');
	},
	onclick: function(){
	},
	onmove: function(){
		if (this.shape() != undefined){
			this.update();
			if (Pointer.isDown && this.option != 'default'){
				if (Pointer.hasMoved){
					if (this.option == 'move'){//move
						this.shape().object.set_origin({
								x: this.origin.x - (Pointer.DragX - Pointer.rX),
								y: this.origin.y - (Pointer.DragY - Pointer.rY)});
						this.shape().object.resize_render(this.scale);	
						Pointer.DragX = Pointer.rX;
						Pointer.DragY = Pointer.rY;
					} else if (this.option.indexOf('resize') > -1){
						var distx  = -utils.getSignal(Pointer.DragX - this.origin.x)*(this.origin.x - Pointer.rX);
						var disty  = -utils.getSignal(Pointer.DragY - this.origin.y)*(this.origin.y - Pointer.rY);
						if (this.option == 'e-resize' || this.option == 'w-resize')
							this.scale.x = utils.round(distx / this.size.width, 100);
						else if (this.option == 's-resize' || this.option == 'n-resize')
							this.scale.y = utils.round(disty / this.size.height, 100);
						else {
							this.scale.y = utils.round(disty / this.size.height, 100);
							this.scale.x = utils.round(distx / this.size.width, 100);
						}
						if (this.properties.width != this.scale.x || this.properties.height != this.scale.y){
							Tools_properties.select(Tools.transform); 
							this.properties.width = this.scale.x;
							this.properties.height = this.scale.y;
						}
						this.shape().object.resize_render(this.scale);	
					}
				}
			} else {
				var flag = false;
				for (var property in this.points) 
				    if (this.points.hasOwnProperty(property)){
						if (flag = Pointer.intersect({position: this.points[property], size: {width: .05, height: .05}})){
						    this.option = property+'-resize';
							break;
						}
				    }
				if (!flag)
					if (Pointer.intersect({position: this.origin, 
							size: {width: this.size.width * Math.abs(this.scale.x),
									height: this.size.height * Math.abs(this.scale.y)} }))
						this.option = 'move';
					else
						this.option = 'default';
				Pointer.set_cursor(this.option);
			}
		}
	},
	onup: function(){
	},
	onkeydown: function(e){
		if (e.keyCode == Keys.ENTER){
			this.shape().object.resize(this.scale);	
			this.reset_properties();
			Tools_properties.select(Tools.transform); 
			this.update();
		}
	},
	onkeyup: function(key){
	},
	render: function(_args){
		if (this.shape() != undefined){
			this.update();
			var ctx = _args.ctx, repos = _args.repos;
			ctx.lineWidth = 2;
			ctx.fillStyle = 'rgba(255, 198, 0, .7)';
			ctx.strokeStyle = 'rgba(0, 0, 0, .7)';
			ctx.beginPath();
			ctx.rect((this.origin.x - this.size.width * this.scale.x) * repos , 
						(this.origin.y - this.size.height * this.scale.y) * repos, 
						this.size.width * 2 * repos * this.scale.x, 
						this.size.height * 2 * repos * this.scale.y);
			for (var property in this.points) 
			    if (this.points.hasOwnProperty(property)){
					ctx.rect((this.points[property].x - .05) * repos, 
								(this.points[property].y - .05) * repos, 
								.1 * repos, .1 * repos);

			    }
			ctx.stroke();		
		}
	},
	update: function(){
		if (this.shape() != undefined){
			this.scale.x = parseFloat(this.properties.width);
			this.scale.y = parseFloat(this.properties.height);
			this.origin = this.shape().object.get_origin();
			this.size = this.shape().object.get_size();
			this.shape().object.resize_render(this.scale);	
			this.points.nw = {x: this.origin.x - this.size.width * Math.abs(this.scale.x), 
								y: this.origin.y - this.size.height * Math.abs(this.scale.y)};
			this.points.n = {x: this.origin.x, 
								y: this.origin.y - this.size.height * Math.abs(this.scale.y)};
			this.points.ne = {x: this.origin.x + this.size.width * Math.abs(this.scale.x), 
								y: this.origin.y - this.size.height * Math.abs(this.scale.y)};
			this.points.e = {x: this.origin.x + this.size.width * Math.abs(this.scale.x), 
								y: this.origin.y};
			this.points.se = {x: this.origin.x + this.size.width * Math.abs(this.scale.x), 
								y: this.origin.y + this.size.height * Math.abs(this.scale.y)};
			this.points.s = {x: this.origin.x, 
								y: this.origin.y + this.size.height * Math.abs(this.scale.y)};
			this.points.sw = {x: this.origin.x - this.size.width * Math.abs(this.scale.x), 
								y: this.origin.y + this.size.height * Math.abs(this.scale.y)};
			this.points.w = {x: this.origin.x - this.size.width * Math.abs(this.scale.x), 
								y: this.origin.y};
		}
	}
}

Tools.scroll = {
	init : function(){
		Pointer.set_cursor('grab');
	},
	onclick: function(){
		Pointer.set_cursor('grabbing');
	},
	onmove: function(){
		if (Pointer.isDown && Pointer.hasMoved){
			Camera.move({x: Pointer.rX - Pointer.DragX, y: Pointer.rY - Pointer.DragY});	
			Pointer.DragX = Pointer.rX;
			Pointer.DragY = Pointer.rY;
		}
	},
	onup: function(){
		Pointer.set_cursor('grab');
	},
	onkeydown: function(e){
	},
	onkeyup: function(e){
		if (e.keyCode == Keys.SPACE)
			Tools.prev();
	},
	render: function(_args){	
	},
	update: function(){
	}
}
/*

Tools.transform = {
	cursor: 'move',
	type: 'transform',//required for properties panel
	shape: function () { return Objects_list.selected; },
	properties: {
		width: '.05'
	},
	init : function(){
	},
	onclick: function(){
	},
	onmove: function(){
	},
	onup: function(){
	},
	onkeydown: function(e){
	},
	onkeyup: function(key){
	},
	render: function(_args){
		var ctx = _args.ctx, repos = _args.repos;
		ctx.lineWidth = 2;
		ctx.fillStyle = 'rgba(255, 198, 0, .7)';
		ctx.strokeStyle = 'rgba(0, 0, 0, .7)';
		ctx.beginPath();
		ctx.stroke();		
	},
	update: function(){
	}
}
*/