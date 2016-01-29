﻿/**
 * Расширения объектов paper.js
 *
 * &copy; http://www.oknosoft.ru 2014-2015
 * @author	Evgeniy Malyarov
 * @module  paper_ex
 */

/**
 * Расширение класса Path
 */
paper.Path.prototype.__define({

	/**
	 * Вычисляет направленный угол в точке пути
	 * @param point
	 * @return {number}
	 */
	getDirectedAngle: {
		value: function (point) {
			var np = this.getNearestPoint(point),
				offset = this.getOffsetOf(np);
			return this.getTangentAt(offset).getDirectedAngle(point.add(np.negate()));
		},
		enumerable: false
	},

	/**
	 * Выясняет, является ли путь прямым
	 * @return {Boolean}
	 */
	is_linear: {
		value: function () {
			// если в пути единственная кривая и она прямая - путь прямой
			if(this.curves.length == 1 && this.firstCurve.isLinear())
				return true;
			// если в пути есть искривления, путь кривой
			else if(this.hasHandles())
				return false;
			else{
				// если у всех кривых пути одинаковые направленные углы - путь прямой
				var curves = this.curves,
					da = curves[0].point1.getDirectedAngle(curves[0].point2), dc;
				for(var i = 1; i < curves.lenght; i++){
					dc = curves[i].point1.getDirectedAngle(curves[i].point2);
					if(Math.abs(dc - da) > 0.01)
						return false;
				}
			}
			return true;
		},
		enumerable: false
	},

	/**
	 * возвращает фрагмент пути между точками
	 * @param point1 {paper.Point}
	 * @param point2 {paper.Point}
	 * @return {paper.Path}
	 */
	get_subpath: {
		value: function (point1, point2) {
			var path = this.clone(), tmp,
				loc1 = path.getLocationOf(point1),
				loc2 = path.getLocationOf(point2);
			if(!loc1)
				loc1 = path.getNearestLocation(point1);
			if(!loc2)
				loc2 = path.getNearestLocation(point2);
			if(loc1.offset > loc2.offset){
				tmp = path.split(loc1.index, loc1.parameter);
				if(tmp)
					tmp.remove();
				loc2 = path.getLocationOf(point2);
				if(!loc2)
					loc2 = path.getNearestLocation(point2);
				tmp = path.split(loc2.index, loc2.parameter);
				if(path)
					path.remove();
				if(tmp)
					tmp.reverse();
			}else{
				tmp = path.split(loc2.index, loc2.parameter);
				if(tmp)
					tmp.remove();
				loc1 = path.getLocationOf(point1);
				if(!loc1)
					loc1 = path.getNearestLocation(point1);
				if(loc1.index || loc1.parameter){
					tmp = path.split(loc1.index, loc1.parameter);
					if(path)
						path.remove();
				}else
					tmp = path;
			}
			return tmp;
		},
		enumerable: false
	},

	/**
	 * возвращает путь, равноотстоящий от текущего пути
	 * @param delta {number}
	 * @return {paper.Path}
	 */
	equidistant: {
		value: function (delta) {
			var res = new paper.Path({insert: false});
			// если исходный путь прямой, эквидистанту строим по начальной и конечной точкам
			if(this.is_linear()){
				this.outer.add(point_b.add(normal_b.multiply(d1)));
				this.inner.add(point_b.add(normal_b.multiply(d2)));
				this.outer.add(point_e.add(normal_b.multiply(d1)));
				this.inner.add(point_e.add(normal_b.multiply(d2)));
			}else{

			}
			return res;
		},
		enumerable: false
	},

	elongation: {
		value: function (delta1, delta2) {

		},
		enumerable: false
	}

});


paper.Point.prototype.__define({

	/**
	 * Выясняет, расположена ли точка в окрестности точки
	 * @param point {paper.Point}
	 * @param [sticking] {Boolean}
	 * @returns {Boolean}
	 */
	is_nearest: {
		value: function (point, sticking) {
			return this.getDistance(point, true) < (sticking ? consts.sticking2 : 10);
		},
		enumerable: false
	}

});

/**
 * Расширение класса Tool
 */
paper.Tool.prototype.__define({

	/**
	 * Отключает и выгружает из памяти окно свойств инструмента
	 * @param tool
	 */
	detache_wnd: {
		value: function(){
			if(this.wnd && this.wnd.wnd_options){
				this.wnd.wnd_options(this.options.wnd);
				$p.wsql.save_options("editor", this.options);
				this.wnd.close();
			}
			this.wnd = null;
			this.profile = null;
		},
		enumerable: false
	},

	/**
	 * Подключает окно редактор свойств текущего элемента, выбранного инструментом
	 */
	attache_wnd: {
		value: function(profile, _editor){

			this.profile = profile;

			if(!this.wnd || !this._grid){
				$p.wsql.restore_options("editor", this.options);
				this.wnd = $p.iface.dat_blank(_editor._dxw, this.options.wnd);
				this.wnd.buttons = this.wnd.bottom_toolbar({
					wrapper: this.wnd.cell, width: '100%', height: '28px', bottom: '0px', left: '0px', name: 'aling_bottom',
					buttons: [
						{name: 'left', img: 'align_left.png', title: $p.msg.align_node_left, float: 'left'},
						{name: 'bottom', img: 'align_bottom.png', title: $p.msg.align_node_bottom, float: 'left'},
						{name: 'top', img: 'align_top.png', title: $p.msg.align_node_top, float: 'left'},
						{name: 'right', img: 'align_right.png', title: $p.msg.align_node_right, float: 'left'},
						{name: 'delete', img: 'trash.gif', title: 'Удалить элемент', clear: 'right', float: 'right'}
					],
					image_path: "dist/imgs/",
					onclick: function (name) {
						return _editor.profile_align(name);
					}
				});

				this._grid = this.wnd.attachHeadFields({
					obj: profile,
					oxml: {
						" ": ["inset", "clr"],
						"Начало": ["x1", "y1"],
						"Конец": ["x2", "y2"]

					}
				});
				this._grid.attachEvent("onRowSelect", function(id,ind){
					if(id == "x1" || id == "y1")
						profile.select_node("b");
					else if(id == "x2" || id == "y2")
						profile.select_node("e");
				});
			}else{
				this._grid.attach({obj: profile})
			}
		},
		enumerable: false
	}

});



