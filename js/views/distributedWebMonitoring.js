(function(models, views, routers, templates) {

    views.DistributedWebMonitoring = Backbone.View.extend({
        
        el: $('#content'),
        events: {
            'click #get_dwm': 'getDWM',
            'click #create_dwm': 'addDWM',
            'keyup #dwm_url': 'updateUrl',
            'click #update_profile': 'updateProfile'
        },
        initialize: function(options) {
            this.host = options.host;
        },
        render: function() {
            console.log('in dwm');
            var view = this;
            this.$el.html(templates.distributedWebMonitoring());

            $('#webnode option:selected').removeAttr('selected');
            $('#webnode option').each(function(index) {
                if (view.host.profile.macaddress 
                && $(this).val().toLowerCase() === view.host.profile.macaddress.toLowerCase()) {
                    $(this).attr('selected', 'selected');
                }
            });
            
            return this;
        },
        updateUrl: function(target) {
            // simply display the URL as a link when being entered to ensure it exists !
            var url = $('#dwm_url').val();
            if (url.search(/^http(|s):\/\//) === -1) url = 'http://'+ url;
            $('#dwm_url').parent().find('a').attr('href', url);
            $('#dwm_url').parent().find('a').html(url);
        },
        getDWM: function() {
            // fetch existing Distributed Web Monitoring info for that host
            // TODO: display more info, such as triggers, etc.
            window.zabbix.call('item.get', {
                output: 'extend',
                hostids: this.host.hostid,
                monitored: 1,
                application: 'Distributed Web Monitoring'
            }, function(err, resp) {
                if (err) {
                    new views.Error({msg: err.data ? err.data : err.message}).render();
                } else {
                    $('#error').empty();
                    $('#results').empty();
                    _.each(resp.result, function(item) {
                        $('#results').append(item.description +' - '+ item.key_ +'<br/>');
                    });
                }
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
                hostid: parseInt(view.host.hostid),
                profile: view.host.profile
            }, function(err, resp) {
                if (err) {
                    new views.Error({msg: err.data ? err.data : err.message}).render();
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
                    new views.Error({
                        msg: err.data ? err.data : err.message
                    }).render();
                }
            });
        }
    });
}).apply(this, window.args);