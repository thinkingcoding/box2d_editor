var Pointer = {
	elem       : null,
	X          : 0,
	Y          : 0,
	rX         : 0,
	rY         : 0,
	DragX      : 0,
	DragY      : 0,
	wheelDelta : 0,
	isDown     : false,
	render : function(_args){
		var ctx = _args.ctx, repos = _args.repos;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.fillStyle = 'rgba(255, 198, 0, .7)';
		ctx.strokeStyle = 'rgba(0, 0, 0, .7)';
		ctx.arc(this.rX * repos, 
					 		this.rY * repos, 
					 		5, 0, 2*Math.PI);
		ctx.stroke();
	},
	pointerDown : function (e) {
		if (!this.isDown) {
			this.isDown = true;
			this.evt = e;
			this.X  = e.pageX;
			this.Y  = e.pageY - (window.innerHeight - Camera.canvas.height);
			this.DragX = this.rX;
			this.DragY = this.rY;

			Tools.onclick();
		}
	},
	pointerMove : function(e) {
		if (e != undefined){
			this.X  = e.pageX;
			this.Y  = e.pageY - (window.innerHeight - Camera.canvas.height);
		}
		this.rX = Camera.position.x - Camera.size.width  + this.X / (World.scale * Camera.scale),
		this.rY = Camera.position.y - Camera.size.height + this.Y / (World.scale * Camera.scale);
    	
		Tools.onmove();		
	},
	pointerUp : function(e) {
		this.isDown = false;
		Tools.onup();
	},
	pointerCancel : function(e) {
		this.isDown = false;
	},
	init : function(){
		var self = this;
		this.elem = Camera.canvas;
		if ('ontouchstart' in window) {
			this.elem.ontouchstart      = function (e) { self.pointerDown(e); return false;  }
			this.elem.ontouchmove       = function (e) { self.pointerMove(e); return false;  }
			this.elem.ontouchend        = function (e) { self.pointerUp(e); return false;    }
			this.elem.ontouchcancel     = function (e) { self.pointerCancel(e); return false;}
		}
		this.elem.addEventListener("mousedown", function (e) {
			if (
				e.target === self.elem || 
				(e.target.parentNode && e.target.parentNode === self.elem) || 
				(e.target.parentNode.parentNode && e.target.parentNode.parentNode === self.elem)
			) {
				if (typeof e.stopPropagation != "undefined") {
					e.stopPropagation();
				} else {
					e.cancelBubble = true;
				}
				self.pointerDown(e); 
			}
		}, false);
		this.elem.addEventListener("mousemove", function (e) { 
			self.pointerMove(e); 
		}, false);
		this.elem.addEventListener("mouseup",   function (e) {
			self.pointerUp(e);
		}, false);
		if (window.addEventListener) this.elem.addEventListener('DOMMouseScroll', function(e) { 
			self.wheelDelta = e.detail * 10;
	        var value =  Camera.scale - e.detail/30;
	        if (value >= .1)
		        Camera.zoom(value);
			return false; 
		}, false); 
		this.elem.onmousewheel = function () { 
			self.wheelDelta = -event.wheelDelta * .25;
	        var value =  Camera.scale - self.wheelDelta/30;
	        if (value >= .1)
		        Camera.zoom(value);
			return false; 
		}
	}
}