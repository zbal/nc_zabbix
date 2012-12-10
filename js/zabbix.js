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

window.Zabbix = Client;
