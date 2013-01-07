var Client = function (url, user, password) {
    this.url = url;
    this.user = user;
    this.password = password;
    this.rpcid = 0;
    this.authid = null;
    this.debug = true;
};

Client.prototype.call = function call(method, params, callback) {
    var self = this;
    if (this.debug) console.log("::zabbix method: " + method + " params: " + JSON.stringify(params) + " url: " + self.url);
    var send_data = {
            jsonrpc : '2.0',
            id: ++self.rpcid,
            auth: self.authid,
            method: method,
            params: params
        };
    $.ajax({ 
        type: 'POST',
        url: self.url,
        headers: { 'content-type': 'application/json-rpc' },
        data: JSON.stringify(send_data),
        dataType: 'json',
	success: function(data) {
            if (data.error) {
                callback(data.error);
            } else {
                callback(null, data);
            }
        }
    });
}

Client.prototype.getApiVersion = function getApiVersion(callback) {
    var self = this;
    this.call('apiinfo.version', {}, function (err, resp) {
        if (!err) {
            self.apiversion = resp.result;
            callback(null, resp);
        } else {
            callback(err, resp);
        }
    });
};

Client.prototype.authenticate = function authenticate(callback) {
    console.log('authenticate');
    this.rpcid = 0; // Reset this, why not?
    var self = this; //REMEMBER THAT YOU NEED THIS.
    this.call('user.authenticate', {
        "user": this.user,
        "password" : this.password
    }, function (err, resp) {
        if (!err) {
            self.authid = resp.result;
            callback(null, resp);
        } else {
            callback(err, resp);
        }
    });
};

// Helpers

// Get a single application id, based on the name, for a host
Client.prototype.getApplicationId = function(name, options, callback) {
    var self = this;
    
    // required
    if (!name) return callback(new Error('Missing application name'));
    if (!options.hostid) return callback(new Error('Missing hostid'));
    
    // by default create if not existing
    var create = true;
    var hostid = options.hostid;

    self.call('application.get', {
        hostids: hostid,
        filter: {name: name},
        output: 'shorten'
    }, function(err, resp) {
        if (err) return callback(err);
        if (_.isEmpty(resp.result)) {
            if (create) {
                self.call('application.create', {
                    hostid: hostid,
                    name: name
                }, function(err, resp) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, resp.result.applicationids[0]);
                    }
                });
            } else {
                callback(null, false)
            }
        } else {
            callback(null, resp.result[0].applicationid)
        }
    });
}

// Save item
// Either create or update an item
// require hostid + application + item options
Client.prototype.saveItem = function(item, options, callback) {
    var self = this;
    
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    }
    
    // required fields for item
    if (!item) return callback(new Error('Missing item'));
    if (!item.key_) return callback(new Error('Missing item key_'));
    if (!item.description) return callback(new Error('Missing item description'));
    if (!item.type) item.type = 0; // zabbix_get
    if (_.isUndefined(item.value_type)) return callback(new Error('Missing item value_type'));
    if (!item.status) item.status = 0; // enable item
    if (!item.history) return callback(new Error('Missing item history'));
    if (!item.trends) return callback(new Error('Missing item trends'));
    if (!item.hostid) return callback(new Error('Missing item hostid'));
    if (!item.delay) return callback(new Error('Missing item delay'));
    if (!item.applications) return callback(new Error('Missing item applications'));

    var create = true,
        update = true;

    self.call('item.get', {
        hostids: [ item.hostid ],
        filter: {key_: item.key_},
        output: 'shorten'
    }, function(err, resp) {
        if (err) {
            callback(err);
        } else {
            if (_.isEmpty(resp.result)) {
                // not existing - simply create
                self.call('item.create', item, function(err, resp) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, resp.result.itemids[0]);
                    }
                });
            } else {
                // already existing - choose to update or do nothing...
                if (update) {
                    item.itemid = resp.result[0].itemid;
                    self.call('item.update', item, function(err, resp) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, resp.result.itemids[0]);
                        }
                    });
                } else {
                    callback(null, resp.result[0].itemid);
                }
            }
        }
    });
}

// Save item
// Either create or update an item
// require hostid + application + item options
Client.prototype.saveTrigger = function(trigger, options, callback) {
    var self = this;
    
    if (_.isFunction(options)) {
        callback = options;
        options = {};
    }
    
    // required fields for item
    if (!trigger) return callback(new Error('Missing item'));
    if (_.isUndefined(trigger.description)) return callback(new Error('Missing trigger description'));
    if (_.isUndefined(trigger.expression)) return callback(new Error('Missing trigger expression'));
    if (_.isUndefined(trigger.status)) return callback(new Error('Missing trigger status'));
    if (_.isUndefined(trigger.url)) return callback(new Error('Missing trigger url'));
    if (_.isUndefined(trigger.priority)) return callback(new Error('Missing trigger priority'));
    if (_.isUndefined(trigger.type)) return callback(new Error('Missing trigger type'));
    if (_.isUndefined(trigger.hostid)) return callback(new Error('Missing trigger hostid'));

    // var create = true,
    //     update = true;

    self.call('trigger.get', {
        hostids: [ trigger.hostid ],
        filter: {description: trigger.description},
        output: 'shorten'
    }, function(err, resp) {
        if (err) {
            callback(err);
        } else {
            if (_.isEmpty(resp.result)) {
                // not existing - simply create
                delete trigger.hostid;
                self.call('trigger.create', trigger, function(err, resp) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, resp.result.triggerids[0]);
                    }
                });
            } else {
                callback(null, resp.result[0].triggerid);
            }
        }
    });
}

window.Zabbix = Client;
