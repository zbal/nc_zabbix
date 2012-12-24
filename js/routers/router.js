(function(models, views, routers, templates) {

    routers.Router = Backbone.Router.extend({
        routes: {
            '': 'main',
            'distributed-web-monitoring/:host': 'dwm',
            'haproxy/:host': 'haproxy'
        },
        
        main: function () {
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
                    new views.DistributedWebMonitoring({host: resp.result}).render();
                }
            });
        },
        
        haproxy: function(host) {
            new views.Haproxy().render();
        }
    });
    
    new views.Login().render();

}).apply(this, window.args);