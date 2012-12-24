(function(models, views, routers, templates) {

    var zbx_url = '/api_jsonrpc.php';

    views.Login = Backbone.View.extend({
        el: $('#content'),
        events: {
            'click input[name=login]': 'login'
        },
        initialize: function() {
            
        },
        render: function() {
            this.$el.html(templates.login());
            return this;
        },
        login: function() {
            // authenticate against zabbix server - need to do at every refresh
            // TODO : rely on session
            var view = this;
            var user = $('#user').val();
            var pass = $('#pass').val();
            
            if (user && pass) {
                window.zabbix = new Zabbix(zbx_url, user, pass);
                window.zabbix.authenticate(function(err, resp) {
                    if (err) {
                        new views.Error({msg: err.data ? err.data : err.message}).render();
                    } else {
                        // $('body').html(templates.layout());
                        routers = new routers.Router();
                        Backbone.history && Backbone.history.start();
                    }
                });
            } else {
                new views.Error({msg: 'missing user / password info'}).render();
            }
        }
    });
    
}).apply(this, window.args);
