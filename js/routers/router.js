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
        
        dwm: function() {
            new views.DistributedWebMonitoring().render();
        },
        
        haproxy: function() {
            new views.Haproxy().render();
        }
    });
    
    new views.Login().render();

}).apply(this, window.args);