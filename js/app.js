(function(){
    var zbx_url = '/api_jsonrpc.php';
    
    var mainView = Backbone.View.extend({
        el: $('body'),
        events: {
            'click input[name=login]': 'login',
            'change #groups': 'getHosts',
            'change #hosts': 'showActions',
            'click #get_dwm': 'getDWM',
            'click #add_dwm': 'displayDWM',
            'click #create_dwm': 'addDWM',
            'keydown #dwm_url': 'updateUrl'
        },
        initialize: function() {
            $('#content').hide();
            $('#login').show();
            $('#actions').hide();
            _.bindAll(this, 'login', 'reset', 'getGroups', 'getHosts', 'showActions', 'getDWM', 'displayDWM', 'addDWM', 'updateUrl');
        },
        render: function() {
            return this;
        },
        updateUrl: function(target) {
            var url = $('#dwm_url').val();
            if (url.search(/^http(|s):\/\//) === -1) url = 'http://'+ url;
            target.parent().find('a').attr('href', url);
            target.parent().find('a').html(url);
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
                        view.reset();
                        view.getGroups();
                    }
                });
            } else {
                $('#error').html('missing user / password info');
            }
        },
        reset: function() {
            $('#error').empty();
            $('#content').show();
            $('#login').hide();
            $('#dwm').hide();
            $('#actions').hide();
        },
        showActions: function() {
            if (!_.isEmpty($('#groups').val()) && !_.isEmpty($('#hosts').val())) {
                $('#actions').show();
            } else {
                $('#actions').hide();
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
                    view.reset();
                    $('#groups').html('<option value=""> -- Select a group -- </option>');
                    _.each(resp.result, function(item) {
                        $('#groups').append('<option value="'+ item.groupid +'">'+ item.name +'</option>');
                    });
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
                    view.reset();
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
        displayDWM: function() {
            $('#dwm').show();
        },
        addDWM: function() {
            var url = $('#dwm_url').val();
            var code = $('#dwm_code').val();
            var timeout = $('#dwm_timeout').val();
            var text = $('#dwm_text').val();
            var frequency = $('#dwm_frequency').val() || 120;
            
            if (!url) return alert('Missing URL');
            if (!code) return alert('Missing return code');
            if (!timeout) return alert('Missing timeout');
            if (!text) return alert('Missing matching text');

            var item = {
                key_: 'nc.web.status['+ url +','+ timeout +','+ code +','+ text +',]',
                description: 'Distributed Web Monitor - $1',
                type: 2,
                value_type: 0,
                status: 0,
                history: 7,
                trends: 30,
                hostid: $('#hosts').val()
            }
            
            console.log('item: ', item);
            return;
            
            
            // waterfall execution
            async.waterfall([
                function(cb) {
                    $('#results').append('Fetching application id: ... ');
                    window.zabbix.call('application.get', {
                        hostids: $('#hosts').val(),
                        filter: {name: 'Distributed Web Monitoring'},
                        output: 'shorten'
                    }, function(err, resp) {
                        if (err) {
                            cb(err);
                        } else {
                            if (_.isEmpty(resp.result)) {
                                $('#results').append('not existing.</br>');
                                cb(null, null)
                            } else {
                                $('#results').append('done</br>');
                                cb(null, resp.result[0].applicationid);
                            }
                        }
                    });
                },
                function(id, cb) {
                    if (id) {
                        cb(null, id);
                    } else {
                        $('#results').append('Creating new application: ... ');
                        window.zabbix.call('application.create', {
                            hostid: $('#hosts').val(),
                            name: 'Distributed Web Monitoring'
                        }, function(err, resp) {
                            if (err) {
                                cb(err);
                            } else {
                                $('#results').append('done</br>');
                                cb(null, resp.result.applicationids)
                            }
                        });
                    }
                },
                function(appid, cb) {
                    $('#results').append('application id: '+ appid +'...</br>');
                    $('#results').append('That\'s enough for today ! going back home...</br>');
                    cb(null);
                }
            ], function(err, result) {
                if (err) {
                    $('#error').html(err.data ? err.data : err.message);
                }
            });
        }
    });
    
    window.App = new mainView;
}());
