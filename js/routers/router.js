(function(models, views, routers, templates) {
    
    var content;

    routers.Router = Backbone.Router.extend({
        routes: {
            '': 'main',
            'distributed-web-monitoring/:host/add': 'dwmAdd',
            'distributed-web-monitoring/:host/list': 'dwmList',
            'haproxy/:host/add': 'haProxyAdd',
            'haproxy/:host/list': 'haProxyList'
        },
        
        main: function () {
            if (content) {
                content.undelegateEvents();
                // content.remove();
            }
            new views.Main().render();
        },
        
        dwmAdd: function(host) {
            window.zabbix.call('host.get', {
                output: 'extend',
                hostids: [ host ],
                select_profile: 'extend'
            }, function(err, resp) {
                if (err) {
                    new views.Error({msg: err.data ? err.data : err.message}).render();
                } else {
                    if (content) {
                        // stop event propagation and remove exiting view
                        content.undelegateEvents();
                    }
                    content = new views.DistributedWebMonitoringAdd({host: resp.result[0]}).render();
                }
            });
        },
        dwmList: function(host) {
            window.zabbix.call('host.get', {
                output: 'extend',
                hostids: [ host ],
                select_profile: 'extend'
            }, function(err, resp) {
                if (err) {
                    new views.Error({msg: err.data ? err.data : err.message}).render();
                } else {
                    if (content) {
                        content.undelegateEvents();
                    }
                    content = new views.DistributedWebMonitoringList({host: resp.result[0]}).render();
                }
            });
        },

        
        haProxyAdd: function(host) {
            window.zabbix.call('host.get', {
                output: 'extend',
                hostids: [ host ],
                select_profile: 'extend'
            }, function(err, resp) {
                if (err) {
                    new views.Error({msg: err.data ? err.data : err.message}).render();
                } else {
                    if (content) {
                        content.undelegateEvents();
                    }
                    content = new views.HaProxyAdd({host: resp.result[0]}).render();
                }
            });
        },
        haProxyList: function(host) {
            window.zabbix.call('host.get', {
                output: 'extend',
                hostids: [ host ],
                select_profile: 'extend'
            }, function(err, resp) {
                if (err) {
                    new views.Error({msg: err.data ? err.data : err.message}).render();
                } else {
                    if (content) {
                        content.undelegateEvents();
                    }
                    content = new views.HaProxyList({host: resp.result[0]}).render();
                }
            });
        }
    });
    
    new views.Login().render();

}).apply(this, window.args);