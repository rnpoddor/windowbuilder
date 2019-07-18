/**
 *
 *
 * @module DeliveryAddr
 *
 * Created by Evgeniy Malyarov on 13.02.2019.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from 'metadata-react/App/Dialog';
import connect from './connect';

import FormGroup from '@material-ui/core/FormGroup';
import DataField from 'metadata-react/DataField';
import TextField  from '@material-ui/core/TextField';
import GoogleMap from './GoogleMap';
import YaMap from './YaMap';
import {ReactDadata} from './DadataTyped/index.tsx';

class DeliveryAddr extends Component {

  constructor(props, context) {
    super(props, context);
    const {handleCancel, handleCalck, FakeAddrObj, dialog: {ref, _mgr}} = props;
    const t = this;
    t.handleCancel = handleCancel.bind(t);
    t.handleCalck = handleCalck.bind(t);
    t.obj = new FakeAddrObj(_mgr.by_ref[ref]);
    t.state = {
      msg: null,
      queryClose: false,
      cpresentation: t.cpresentation(),
    };
    t.wnd = {
      setText() {},
      elmnts: {
        get map() {
          return t.map;
        },
        toolbar: {
          setValue() {
            t.obj.coordinates = JSON.stringify([t.v.latitude, t.v.longitude]);
            t.setState({cpresentation: t.cpresentation()});
          }
        }
      }
    };
    t.v = new $p.classes.WndAddressData(t);
    _mgr.on('update', this.onDataChange);
    t.geo_map = $p.job_prm.builder.geo_map;
  }

  componentWillUnmount() {
    this.props.dialog._mgr.off('update', this.onDataChange);
  }

  refresh_grid(co) {
    const {obj, v, dadata} = this;
    if(co) {
      v.latitude = co[0];
      v.longitude = co[1];
    }
    v.assemble_address_fields(true);
    dadata && dadata.onInputChange({
      target: {value: obj.shipping_address}
    });
    const data = {area: true};
    if(co) {
      data.data = true;
      data.value = obj.shipping_address;
    }
    this.findArea({
      lat: v.latitude,
      lng: v.longitude,
      data,
    });
  }

  cpresentation() {
    let res = '';
    try {
      const point = JSON.parse(this.obj.coordinates);
      res = `${point[0].round(9)}, ${point[1].round(9)}`;
    }
    catch (e) {}
    return res;
  }

  handleOk = () => {
    this.props.handleCalck.call(this)
      .then(this.handleCancel)
      .catch((err) => {
        this.setState({msg: err.msg || err.message});
      });
  };

  handleCalck = () => {
    this.props.handleCalck.call(this)
      .catch((err) => {
        this.setState({msg: err.msg});
      });
  };

  handleErrClose = () => {
    this.setState({msg: null, queryClose: false});
  };

  queryClose = () => {
    if(this.obj._data._modified) {
      this.setState({queryClose: true});
    }
    else {
      this.handleCancel();
    }
  };

  dadataChange = (data) => {
    const {props: {delivery}} = this;
    let nearest;
    if(data.data && data.data.geo_lat && data.data.geo_lon) {
      nearest = Promise.resolve();
    }
    else if(data.value) {
      nearest = delivery.dadata.suggestions(data.value)
        .then(({suggestions}) => {
          if(suggestions && suggestions[0].data.geo_lat && suggestions[0].data.geo_lon) {
            data.data.geo_lat = suggestions[0].data.geo_lat;
            data.data.geo_lon = suggestions[0].data.geo_lon;
            return;
          }
          else if(data.data && data.data.postal_code) {
            return delivery.geonames.postalCodeLookup(data.data.postal_code)
              .then(({postalcodes}) => {
                data.data.geo_lat = postalcodes[0].lat;
                data.data.geo_lon = postalcodes[0].lng;
              });
          }
        });
    }
    nearest && nearest.then(() => this.findArea({
      lat: parseFloat(data.data.geo_lat),
      lng: parseFloat(data.data.geo_lon),
      data,
    }));
  };

  findArea = ({lat, lng, data}) => {
    const {obj, props: {delivery}, map} = this;
    const [area, point] = delivery.nearest({lat, lng});
    if(data.data || data.area) {
      obj.delivery_area = area;
    }
    if(data.data) {
      obj.coordinates = JSON.stringify([point.lat, point.lng]);
      this.setState({cpresentation: this.cpresentation()});
      obj.shipping_address = data.value || data.unrestricted_value;
      map && map.reflectCenter([point.lat, point.lng]);
    }
  }

  coordinatesChange = ({target}) => {
    this.setState({cpresentation: target ? target.value : this.cpresentation()});
  };

  coordinatesKeyPress = ({key}) => {
    if(key === 'Enter') {
      this.coordinatesFin();
    }
  };

  coordinatesFin() {
    try{
      const {v, map, state: {cpresentation}} = this;
      const co = v.assemble_lat_lng(cpresentation);
      if(co) {
        map && map.reflectCenter([co.lat, co.lng]);
        this.obj.coordinates = JSON.stringify([co.lat, co.lng]);
        this.setState({cpresentation: this.cpresentation()});

        map.coordinatesFin();
      }
    }
    catch (e) {}
  }

  onDataChange = (obj, fields) => {
    if(obj === this.obj && ('delivery_area' in fields || 'coordinates' in fields)) {
      this.forceUpdate();
    }
  }

  content() {
    const {obj, state: {cpresentation}, props: {delivery, classes}, geo_map} = this;
    const ComponentMap = geo_map.includes('google') ? GoogleMap : YaMap;
    const addr = <ReactDadata
      key="row_addr"
      label="Населенный пункт, улица, дом, квартира"
      ref={(el) => this.dadata = el}
      token={delivery.dadata.token}
      query={obj.shipping_address}
      onChange={this.dadataChange}
    />;
    const coordin = <TextField
      value={cpresentation}
      label="Координаты"
      classes={{root: classes.coordinates}}
      onChange={this.coordinatesChange}
      onBlur={this.coordinatesFin}
      onKeyPress={this.coordinatesKeyPress}
    />;
    return [
      !geo_map.includes('without_area') && <FormGroup key="row1" row>
        <DataField _obj={obj} _fld="delivery_area"/>
        {coordin}
      </FormGroup>,
      !geo_map.includes('without_area') && addr,
      geo_map.includes('without_area') && <FormGroup key="row" row>
        {addr}
        {coordin}
      </FormGroup>,
      <ComponentMap
        key="map"
        mapRef={(map) => this.map = map}
        v={this.v}
        larger={geo_map.includes('without_area')}
      />
    ];
  }

  render() {

    const {handleCancel, handleErrClose, obj: {_data}, state: {msg, queryClose}} = this;


    return <Dialog
      open
      initFullScreen
      large
      title={`Адрес доставки${_data._modified ? ' *' : ''}`}
      onClose={this.queryClose}
      actions={[
        <Button key="ok" onClick={this.handleOk} color="primary">Ок</Button>,
        <Button key="cancel" onClick={handleCancel} color="primary">Отмена</Button>
      ]}
    >
      {this.content()}
      {msg &&
      <Dialog
        open
        title={msg.title}
        onClose={handleErrClose}
        actions={[
          <Button key="ok" onClick={handleErrClose} color="primary">Ок</Button>,
        ]}
      >
        {msg.text || msg}
      </Dialog>}
      {queryClose &&
      <Dialog
        open
        title="Закрыть форму ввода адреса?"
        onClose={handleErrClose}
        actions={[
          <Button key="ok" onClick={handleCancel} color="primary">Ок</Button>,
          <Button key="cancel" onClick={handleErrClose} color="primary">Отмена</Button>
        ]}
      >
        Внесённые изменения будут потеряны
      </Dialog>}
    </Dialog>;

  }
}

DeliveryAddr.propTypes = {
  dialog: PropTypes.object.isRequired,
  delivery: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  handlers: PropTypes.object.isRequired,
  handleCalck: PropTypes.func.isRequired,
  handleCancel: PropTypes.func.isRequired,
};

export default connect(DeliveryAddr);