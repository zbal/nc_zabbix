(function(models, views, routers, templates) {
    
    var content;

    routers.Router = Backbone.Router.extend({
        routes: {
            '': 'main',
            'distributed-web-monitoring/:host': 'dwm',
            'haproxy/:host': 'haproxy'
        },
        
        main: function () {
            if (content) content.undelegateEvents();
            new views.Main().render();
        },
        
        dwm: function(host) {
            window.zabbix.call('host.get', {
                output: 'extend',
                hostids: [ host ],
                select_profile: 'extend'
            }, function(err, resp) {
                if (err) {
                    new views.Error({msg: err.data ? err.data : err.message}).render();
                } else {
                    if (content) content.undelegateEvents();
                    content = new views.DistributedWebMonitoring({host: resp.result}).render();
                }
            });
        },
        
        haproxy: function(host) {
            window.zabbix.call('host.get', {
                output: 'extend',
                hostids: [ host ],
                select_profile: 'extend'
            }, function(err, resp) {
                if (err) {
                    new views.Error({msg: err.data ? err.data : err.message}).render();
                } else {
                    if (content) content.undelegateEvents();
                    content = new views.Haproxy({host: resp.result}).render();
                }
            });
        }
    });
    
    new views.Login().render();

}).apply(this, window.args);