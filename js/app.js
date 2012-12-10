(function(){
    var zbx_url = '/api_jsonrpc.php';
    
    var mainView = Backbone.View.extend({
        el: $('body'),
        events: {
            'click input[name=login]': 'login',
            'change #groups': 'getHosts',
            'change #hosts': 'showActions',
            'click #get_dwm': 'getDWM',
            'click #add_dwm': 'addDWM'
        },
        initialize: function() {
            $('#content').hide();
            $('#login').show();
            $('#actions').hide();
            _.bindAll(this, 'login', 'getGroups', 'getHosts', 'showActions', 'getDWM', 'addDWM');
        },
        render: function() {
            return this;
        },
        login: function() {
            var view = this;
            var user = $('#user').val();
            var pass = $('#pass').val();
            
            if (user && pass) {
                window.zabbix = new Zabbix(zbx_url, user, pass);
                window.zabbix.authenticate(function(err, resp) {
                    if (err) {
                        $('#error').html(err.data ? err.data : err.message);
                    } else {
                        $('#error').empty();
                        $('#content').show();
                        $('#login').hide();
                        view.getGroups();
                    }
                });
            } else {
                $('#error').html('missing user / password info');
            }
        },
        getGroups: function() {
            var view = this;
            window.zabbix.call('hostgroup.get', {
                output: 'extend',
                real_hosts: 1
            }, function(err, resp) {
                if (err) {
                    $('#error').html(err.data ? err.data : err.message);
                } else {
                    $('#error').empty();
                    $('#groups').html('<option value=""> -- Select a group -- </option>');
                    _.each(resp.result, function(item) {
                        $('#groups').append('<option value="'+ item.groupid +'">'+ item.name +'</option>');
                    });
                    view.showActions();
                }
            });
        },
        getHosts: function() {
            var view = this;
            window.zabbix.call('host.get', {
                output: 'extend',
                groupids: $('#groups').val()
            }, function(err, resp) {
                if (err) {
                    $('#error').html(err.data ? err.data : err.message);
                } else {
                    $('#error').empty();
                    $('#hosts').html('<option value=""> -- Select an host -- </option>');
                    _.each(resp.result, function(item) {
                        $('#hosts').append('<option value="'+ item.hostid +'">'+ item.host +'</option>');
                    });
                    view.showActions();
                }
            });
        },
        getDWM: function() {
            window.zabbix.call('item.get', {
                output: 'extend',
                hostids: $('#hosts').val(),
                monitored: 1,
                application: 'Distributed Web Monitoring'
            }, function(err, resp) {
                if (err) {
                    $('#error').html(err.data ? err.data : err.message);
                } else {
                    $('#error').empty();
                    $('#results').empty();
                    _.each(resp.result, function(item) {
                        $('#results').append(item.description +' - '+ item.key_ +'<br/>');
                    });
                }
            });
        },
        addDWM: function() {},
        showActions: function() {
            if (!_.isEmpty($('#groups').val()) && !_.isEmpty($('#hosts').val())) {
                $('#actions').show();
            } else {
                $('#actions').hide();
            }
        }
    });
    
    window.App = new mainView;
}());
