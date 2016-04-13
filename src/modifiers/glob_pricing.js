/**
 * Аналог УПзП-шного __ЦенообразованиеСервер__
 *
 * Created 26.05.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @author	Evgeniy Malyarov
 * @module  glob_pricing
 */

$p.modifiers.push(
	function($p){

		$p.pricing = new Pricing($p);


		function Pricing($p){

			var _cache;

			/**
			 * Возвращает цену номенклатуры по типу цен из регистра пзМаржинальныеКоэффициентыИСкидки
			 * Аналог УПзП-шного __ПолучитьЦенуНоменклатуры__
			 * @method nom_price
			 * @param nom
			 * @param characteristic
			 * @param price_type
			 * @param prm
			 * @param row
			 */
			this.nom_price = function (nom, characteristic, price_type, prm, row) {

			};

			/**
			 * Возвращает структуру типов цен и КМарж
			 * Аналог УПзП-шного __ПолучитьТипЦенНоменклатуры__
			 * @method price_type
			 * @param prm {Object}
			 * @param prm.calc_order_row {TabularSectionRow.doc.calc_order.production}
			 */
			this.price_type = function (prm) {

				// first_cost_price_type = $p.job_prm.pricing.first_cost_price_type;
				// Рез = Новый Структура("КМарж, КМаржМин, КМаржВнутр, Скидка, СкидкаВнешн, НаценкаВнешн, ТипЦенСебестоимость, ТипЦенПрайс, ТипЦенВнутр,
				// 				|Формула, ФормулаПродажа, ФормулаВнутр, ФормулаВнешн",
				// 				1.9, 1.2, 1.5, 0, 10, 0, ТипЦенПоУмолчанию, ТипЦенПоУмолчанию, ТипЦенПоУмолчанию, "", "", "",);
				prm.price_type = {
					marginality: 1.9,
					marginality_min: 1.2,
					marginality_internal: 1.5,
					discount: 0,
					discount_external: 10,
					extra_charge_external: 0,
					price_type_first_cost: $p.job_prm.pricing.first_cost_price_type,
					price_type_sale: $p.job_prm.pricing.first_cost_price_type,
					price_type_internal: $p.job_prm.pricing.first_cost_price_type,
					formula: "",
					sale_formula: "",
					internal_formula: "",
					external_formula: ""
				};
				
				return prm.price_type;
			};


			/**
			 * Рассчитывает плановую себестоимость строки документа Расчет
			 * Аналог УПзП-шного __РассчитатьПлановуюСебестоимость__
			 * @param prm {Object}
			 * @param prm.calc_order_row {TabularSectionRow.doc.calc_order.production}
			 */
			this.calc_first_cost = function (prm) {

			};

			/**
			 * Рассчитывает стоимость продажи в строке документа Расчет
			 * Аналог УПзП-шного __РассчитатьСтоимостьПродажи__
			 * @param prm {Object}
			 * @param prm.calc_order_row {TabularSectionRow.doc.calc_order.production}
			 */
			this.calc_amount = function (prm) {

			};

			// виртуальный срез последних
			function build_cache() {

				var _tmp = {};

				return $p.doc.nom_prices_setup.pouch_db.query("nom_prices_setup/slice_last",
					{
						limit : 1000,
						include_docs: false,
						startkey: '',
						endkey: '\uffff'
					})
					.then(function (res) {
						res.rows.forEach(function (row) {
							var keys = row.key.split("|"),
								key = keys[0] + "|" + keys[1] + "|" + keys[2];

							if(!_tmp[key])
								_tmp[key] = [];

							_tmp[key].push({
								date: new Date(keys[3]),
								price: row.value.price,
								currency: $p.cat.currencies.get(row.value.currency)
							});

						});
					})
					.then(function () {
						if(_cache){
							Object.keys(_cache).forEach(function (key) {
								delete _cache[key];
							});
						}
						_cache = _tmp;
						_tmp = null;
					});
			}

			// подписываемся на событие после загрузки из pouchdb-ram и готовности предопределенных
			var init_event_id = $p.eve.attachEvent("predefined_elmnts_inited", function () {
				$p.eve.detachEvent(init_event_id);
				build_cache();
			});

			// следим за изменениями документа установки цен, чтобы при необходимости обновить кеш
			$p.eve.attachEvent("pouch_change", function (dbid, change) {
				if (dbid != $p.doc.nom_prices_setup.cachable)
					return;

				// формируем новый
			});
		}

	}
);
