var Service, Characteristic;

const request = require('request');
const url = require('url');
 
var teco;



module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("teco1", "Zarovka1", zarovka001);
}

function zarovka001(log, config) {
  this.currentState = false;
  this.log = log;
  this.name = config["name"];
  this.host = config["host"];
}

zarovka001.prototype = {
  getServices: function () {
    let informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "tecoBulb")
      .setCharacteristic(Characteristic.Model, "Bulb01")
      .setCharacteristic(Characteristic.SerialNumber, "000011");
 
    let fanv2Service = new Service.Fanv2("Zarovka");
    fanv2Service
      .getCharacteristic(Characteristic.Active)
        .on('get', this.getFanv2ActiveCharacteristic.bind(this))
        .on('set', this.setFanv2ActiveCharacteristic.bind(this));

    fanv2Service
      .getCharacteristic(Characteristic.RotationSpeed) // Volume!!
        .on('get', this.getFanv2RotationSpeedCharacteristic.bind(this))
        .on('set', this.setFanv2RotationSpeedCharacteristic.bind(this));

    this.informationService = informationService;
    this.fanv2Service = fanv2Service;
    return [informationService, fanv2Service];
  },
  
  getFanv2ActiveCharacteristic: function (next) {
    const me = this;
    request({
        method: 'GET',
            url: 'http://' + this.host + '/tecoXapi/v1/' + '/getStatus',
            headers: {
                'X-AppName': 'TecoCast/1.0',
                'X-AppPort': '61000',
			},
    }, 
    function (error, response, body) {
      if (error) {
        //me.log('HTTP get error ');
        me.log(error.message);
        return next(error);
      }
	  att=JSON.parse(body);
	  me.log('HTTP GetStatus result:' + (att.power=='on' ? "On" : "Off"));
      return next(null, (att.power=='on')); // presuming that the bool is an int with value 0 or 1
    });
  },
   
  setFanv2ActiveCharacteristic: function (on, next) {
    var url='http://' + this.host + '/tecoXapi/v1/' + '/setPower?power=' + (on ? 'on' : 'standby');
	const me = this;
    request({
      url: url  ,
      method: 'GET',
      body: ""
    },
    function (error, response) {
      if (error) {
        //me.log('error with HTTP url='+url);
        me.log(error.message);
        return next(error);
      }
	  //me.log('HTTP setPower succeeded with url:' + url);
      return next();
    });
  },
  
  // speaker characteristics
  
  
  getFanv2RotationSpeedCharacteristic: function (next) {
    const me = this;
	var res;
    request({
        method: 'GET',
            url: 'http://' + this.host + '/tecoXapi/v1/' + '/getStatus',
            headers: {
                'X-AppName': 'TecoCast/1.0',
                'X-AppPort': '61000',
			},
    }, 
    function (error, response, body) {
      if (error) {
        //me.log('HTTP get error ');
        me.log(error.message);
        return next(error);
      }
	  att=JSON.parse(body);
	  res = Math.floor(att.volume / this.maxVol * 100);
	  me.log('HTTP GetStatus result:' + res);
      return next(null, res);
    });
  },
   
  setFanv2RotationSpeedCharacteristic: function (volume, next) {
    var url='http://' + this.host + '/tecoXapi/v1/' + '/setVolume?volume=' + Math.floor(volume/100 * this.maxVol);
	const me = this;
    request({
      url: url  ,
      method: 'GET',
      body: ""
    },
    function (error, response) {
      if (error) {
        //me.log('error with HTTP url='+url);
        me.log(error.message);
        return next(error);
      }
	  //me.log('HTTP setVolume succeeded with url:' + url);
      return next();
    });
  }
}
