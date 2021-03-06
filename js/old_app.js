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
            'keyup #dwm_url': 'updateUrl',
            'click #update_profile': 'updateProfile'
        },
        initialize: function() {
            $('#content').hide();
            $('#login').show();
            $('#actions').hide();
            _.bindAll(this, 'login', 'reset', 'getGroups', 'getHosts', 'showActions');
            _.bindAll(this, 'getDWM', 'displayDWM', 'addDWM', 'updateUrl', 'updateProfile');
        },
        render: function() {
            return this;
        },
        updateUrl: function(target) {
            // simply display the URL as a link when being entered to ensure it exists !
            var url = $('#dwm_url').val();
            if (url.search(/^http(|s):\/\//) === -1) url = 'http://'+ url;
            $('#dwm_url').parent().find('a').attr('href', url);
            $('#dwm_url').parent().find('a').html(url);
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
            // simply reset the view and add the various fields
            // TODO: user various sub-views instead
            $('#error').empty();
            $('#results').empty();
            $('#content').show();
            $('#login').hide();
            $('#dwm').hide();
            $('#actions').hide();
        },
        showActions: function() {
            var view = this;
            view.host = _.filter(view.hosts, function(host) {
                return host.hostid === $('#hosts').val();
            })[0];
            if (!_.isEmpty($('#groups').val()) && !_.isEmpty($('#hosts').val())) {
                $('#actions').show();
            } else {
                $('#actions').hide();
            }
        },
        getGroups: function() {
            // fetch groups, then populate the #groups select
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
            // fetch hosts using group, then populate the #hosts select
            var view = this;
            window.zabbix.call('host.get', {
                output: 'extend',
                groupids: $('#groups').val(),
                select_profile: 'extend'
            }, function(err, resp) {
                if (err) {
                    $('#error').html(err.data ? err.data : err.message);
                } else {
                    view.reset();
                    view.hosts = resp.result;
                    $('#hosts').html('<option value=""> -- Select an host -- </option>');
                    _.each(resp.result, function(item) {
                        $('#hosts').append('<option value="'+ item.hostid +'">'+ item.host +'</option>');
                    });
                    view.showActions();
                }
            });
        },
        getDWM: function() {
            // fetch existing Distributed Web Monitoring info for that host
            // TODO: display more info, such as triggers, etc.
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
            var view = this;
            $('#dwm').show();
            $('#webnode option:selected').removeAttr('selected');
            $('#webnode option').each(function(index) {
                if (view.host.profile.macaddress && $(this).val().toLowerCase() === view.host.profile.macaddress.toLowerCase()) $(this).attr('selected', 'selected');
            });
        },
        updateProfile: function() {
            var view = this;
            // update the host profile to use the proper "macaddress"
            if (_.isEmpty($('#webnode').val())) return alert('Select a region to run the DWM from.');
            
            view.host.profile || (view.host.profile = {});
            if (_.isArray(view.host.profile)) {
                // if array -> not set hence need create with all attributes
                view.host.profile = {
                    devicetype: '',
                    name: '',
                    os: '',
                    serialno: '',
                    tag: '',
                    macaddress: '',
                    hardware: '',
                    software: '',
                    contact: '',
                    location: '',
                    notes: ''
                };
            };
            view.host.profile.macaddress = $('#webnode').val();
            
            window.zabbix.call('host.update', {
                hostid: parseInt($('#hosts').val()),
                profile: view.host.profile
            }, function(err, resp) {
                if (err) {
                    $('#error').html(err.data ? err.data : err.message);
                } else {
                    $('#error').empty();
                    $('#results').empty();
                    _.each(resp.result, function(item) {
                        $('#results').append('Host profile updated.<br/>');
                    });
                }
            });
        },
        addDWM: function() {
            var view = this;
            var host = view.host;
            
            var url = $('#dwm_url').val();
            var code = $('#dwm_code').val();
            var timeout = $('#dwm_timeout').val();
            var text = $('#dwm_text').val();
            var frequency = $('#dwm_frequency').val();
            
            if (!url) return alert('Missing URL');
            if (!code) return alert('Missing return code');
            if (!timeout) return alert('Missing timeout');
            if (!text) return alert('Missing matching text');

            // check type and reformat
            if (!code.match(/^[0-9]*$/)) return alert('Invalid code format - expecting number')
            if (!timeout.match(/^[0-9]*$/)) return alert('Invalid timeout format - expecting number')
            if (!frequency.match(/^[0-9]*$/)) return alert('Invalid frequency format - expecting number')
            var code = parseInt(code);
            var timeout = parseInt(timeout);
            var frequency = parseInt(frequency);
            if (url.search(/^http(|s):\/\//) === -1) url = 'http://'+ url;

            var zbx_item = {
                key_: 'nc.web.status['+ url +','+ timeout +','+ code +','+ text +',]',
                description: 'Distributed Web Monitor - $1',
                type: 2,
                value_type: 0,
                status: 0,
                history: 7,
                trends: 30,
                hostid: parseInt(host.hostid),
                delay: frequency
            }
            
            // waterfall execution
            var actions = [
                function(cb) {
                    $('#results').append('Searching for existing application id: ... ');
                    window.zabbix.call('application.get', {
                        hostids: host.hostid,
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
                            hostid: host.hostid,
                            name: 'Distributed Web Monitoring'
                        }, function(err, resp) {
                            if (err) {
                                cb(err);
                            } else {
                                $('#results').append('done</br>');
                                cb(null, resp.result.applicationids[0])
                            }
                        });
                    }
                },
                function(appid, cb) {
                    $('#results').append('application id: '+ appid +'...</br>');
                    $('#results').append('Searching for existing DWM item: ... ');
                    window.zabbix.call('item.get', {
                        hostids: [ host.hostid ],
                        filter: {key_: zbx_item.key_},
                        output: 'shorten'
                    }, function(err, resp) {
                        if (err) {
                            cb(err);
                        } else {
                            if (_.isEmpty(resp.result)) {
                                $('#results').append('not existing.</br>');
                                cb(null, null, appid)
                            } else {
                                $('#results').append('done</br>');
                                cb(null, resp.result[0].itemid, appid);
                            }
                        }
                    });
                },
                function(itemid, appid, cb) {
                    if (itemid) {
                        cb(null, itemid, appid);
                    } else {
                        $('#results').append('Creating new DWM item: ... ');
                        zbx_item.applications = [ appid ]
                        window.zabbix.call('item.create', zbx_item, function(err, resp) {
                            if (err) {
                                cb(err);
                            } else {
                                $('#results').append('done</br>');
                                cb(null, resp.result.itemids, appid);
                            }
                        });
                    }
                },
                function(itemid, appid, cb) {
                    $('#results').append('itemid: '+ itemid +' - appid: '+ appid +'</br>');
                    cb(null);
                }
            ];
            
            var buildTriggerAction = function(trigger) {
                return function(cb) {
                    var zbx_trigger = {
                        description: 'Distributed Web Monitor - '+ trigger.name +' - '+ url,
                        expression: '{'+ host.host +':'+ zbx_item.key_ +'.last(0)}=('+ trigger.value +')',
                        url: 'https://wiki.service.chinanetcloud.com/wiki/Special:NCAlert?alertid=123',
                        status: 0,
                        priority: trigger.priority,
                        type: 0
                    };
                    
                    $('#results').append('Checking for existing trigger for "'+ trigger.name +'": ... ');
                    window.zabbix.call('trigger.get', {
                        hostids: [ host.hostid ],
                        filter: {description: [zbx_trigger.description]},
                        output: 'shorten'
                    }, function(err, resp) {
                        if (err) {
                            cb(err);
                        } else {
                            if (_.isEmpty(resp.result)) {
                                $('#results').append('missing</br>');
                                $('#results').append('Creating new trigger for "'+ trigger.name +'": ... ');
                                window.zabbix.call('trigger.create', zbx_trigger, function(err, resp) {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        $('#results').append('done</br>');
                                        cb(null);
                                    }
                                })
                            } else {
                                $('#results').append('existing</br>');
                                cb(null);
                            }
                        }
                    });
                }
            }
            
            // list all triggers to apply
            var triggers = [
                { name: 'Other error',      value: '-1',  priority: 0 },
                { name: 'Bad URL',          value: '-5',  priority: 0 },
                { name: 'Bad DNS',          value: '-10', priority: 0 },
                { name: 'Connection issue', value: '-20', priority: 0 },
                { name: 'Timeout',          value: '-30', priority: 0 },
                { name: 'Bad return code',  value: '-40', priority: 0 },
                { name: 'Bad text',         value: '-50', priority: 0 },
            ];
            // iterate through triggers' list and append to actions to run
            _.each(triggers, function(trigger) {
                actions.push(buildTriggerAction(trigger));
            });
            
            async.waterfall(actions, function(err, result) {
                if (err) {
                    $('#error').html(err.data ? err.data : err.message);
                }
            });
        }
    });
    
    window.App = new mainView;
}());
