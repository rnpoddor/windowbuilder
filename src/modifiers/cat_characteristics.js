/**
 * Модуль объекта справочника ХарактеристикиНоменклатуры
 * Обрботчики событий after_create, after_load, before_save, after_save, value_change
 * Методы выполняются в контексте текущего объекта this = DocObj
 * Created 16.03.2016<br />
 * &copy; http://www.oknosoft.ru 2014-2016
 * @author Evgeniy Malyarov
 * @module cat_characteristics
 */

$p.modifiers.push(

	function($p) {

		var _mgr = $p.cat.characteristics;

		// перед записью надо пересчитать наименование и рассчитать итоги
		_mgr.attache_event("before_save", function (attr) {

			var name = this.prod_name();
			if(name)
				this.name = name;
			
			// дублируем контрагента для целей RLS
			this.partner = this.calc_order.partner;
			
		});

		// свойства объекта характеристики
		_mgr._obj_constructor.prototype.__define({
			
			calc_order_row: {
				get: function () {
					var _calc_order_row;
					this.calc_order.production.find_rows({characteristic: this}, function (_row) {
						_calc_order_row = _row;
						return false;
					});
					return _calc_order_row;
				},
				enumerable: false
			},
			
			prod_name: {
				value: function (short) {

					var _row = this.calc_order_row,
						name = "";
					
					if(_row){
						
						name = (this.calc_order.number_internal || this.calc_order.number_doc) + "/" + _row.row.pad();
						
						if(!short){
							if(this.clr.name)
								name += "/" + this.clr.name;

							if(this.x && this.y)
								name += "/" + this.x.toFixed(0) + "x" + this.y.toFixed(0);
							else if(this.x)
								name += "/" + this.x.toFixed(0);
							else if(this.y)
								name += "/" + this.y.toFixed(0);

							if(this.z){
								if(this.x || this.y)
									name += "x" + this.z.toFixed(0);
								else
									name += "/" + this.z.toFixed(0);
							}

							if(this.s)
								name += "/S:" + this.s.toFixed(3);	
						}
					}
					return name;
				}
			},

			/**
			 * Возвращает номенклатуру продукции по системе
			 */
			prod_nom: {
				
				get: function () {
					
					if(!this.sys.empty()){

						var setted,
							param = this.params;
													
						if(this.sys.production.count() == 1){
							this.owner = this.sys.production.get(0).nom;
							
						}else{
							this.sys.production.each(function (row) {

								if(setted)
									return false;
								
								if(row.param && !row.param.empty()){
									param.find_rows({cnstr: 0, param: row.param, value: row.value}, function () {
										setted = true;
										this.owner = row.nom;
										return false;
									});
								}
										
							});
							if(!setted){
								this.sys.production.find_rows({param: $p.blank.guid}, function (row) {
									setted = true;
									this.owner = row.nom;
									return false;
								});	
							}
							if(!setted){
								this.owner = this.sys.production.get(0).nom;
							}
						}
					}

					return this.owner;
				}

			}
		});



		// подписываемся на событие после загрузки из pouchdb-ram и готовности предопределенных
		var init_event_id = $p.eve.attachEvent("predefined_elmnts_inited", function () {
			$p.eve.detachEvent(init_event_id);
			return _mgr.pouch_load_view("doc/nom_characteristics");

		});


	}

);
