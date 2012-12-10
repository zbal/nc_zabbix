(function(){
    var zbx_url = '/api_jsonrpc.php';
    
    var mainView = Backbone.View.extend({
        el: $('body'),
        events: {
            'click input[name=login]': 'login'
        },
        initialize: function() {
            _.bindAll(this, 'login');
        },
        render: function() {
            return this;
        },
        login: function() {
            var user = $('#user').val();
            var pass = $('#pass').val();
            
            if (user && pass) {
                window.zabbix = new Zabbix(zbx_url, user, pass);
                window.zabbix.authenticate(function(err, resp, res) {
                    console.log('error: ', err);
                    console.log('resp: ', resp);
                    console.log('res: ', res);
                });
            } else {
                $('#error').html('missing user / password info');
            }
            
            
        },
        list_hosts: function(e) {
            alert('hosts');
        }
    });
    
    window.App = new mainView;
}());