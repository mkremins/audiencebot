var osc = require('node-osc');
var config = require('../config');
var oscClient = new osc.Client(config.oscRemoteAddress, config.oscRemotePort);
oscClient.send(new osc.Message('/consensus', 50, 50));
