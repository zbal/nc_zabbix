(function(models, views, routers, templates) {

    views.DistributedWebMonitoringAdd = Backbone.View.extend({
        
        el: '#content',
        events: {
            'click #get_dwm': 'getDWM',
            'click #create_dwm': 'addDWM',
            'keyup #dwm_url': 'updateUrl',
            'click #update_profile': 'updateProfile'
        },
        initialize: function(options) {
            _.bindAll(this, 'render');
            this.host = options.host;
        },
        render: function() {
            var view = this;
            this.$el.html(templates.distributedWebMonitoringAdd());

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
    
            var item = {
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
            
            var items = [];
            items.push(item);

            // 
            // handle triggers
            //
            var triggers = [];
            var triggers_template = [
                { name: 'Other error',      value: '-1',  priority: 3 },
                { name: 'Bad URL',          value: '-5',  priority: 3 },
                { name: 'Bad DNS',          value: '-10', priority: 3 },
                { name: 'Connection issue', value: '-20', priority: 4 },
                { name: 'Timeout',          value: '-30', priority: 4 },
                { name: 'Bad return code',  value: '-40', priority: 3 },
                { name: 'Bad text',         value: '-50', priority: 3 },
                { name: '4xx error', from: '-499', to: '-400',  priority: 3 },
                { name: '5xx error', from: '-599', to: '-500',  priority: 5 }
            ];

            // iterate through triggers' list and append to actions to run
            _.each(triggers_template, function(trigger) {
                var expression = '';

                // handle ranges
                if (trigger.value) {
                    expression = '{'+ host.host +':'+ item.key_ +'.last(0)}=('+ trigger.value +')';
                } else {
                    expression = '{'+ host.host +':'+ item.key_ +'.last(0)}>('+ trigger.from +')'
                        +' & '
                        +'{'+ host.host +':'+ item.key_ +'.last(0)}<('+ trigger.to +')';
                }
                
                var localTrigger = {
                    description: 'Distributed Web Monitor - '+ trigger.name +' - '+ url,
                    expression: expression,
                    url: 'https://wiki.service.chinanetcloud.com/wiki/Special:NCAlert?alertid=123',
                    status: 0,
                    priority: trigger.priority,
                    type: 0,
                    hostid: parseInt(host.hostid)
                };
                
                triggers.push(localTrigger);
            });            

            //
            // handle graph
            //
            // Happen to an existing graph
            var graphs = [];
            graphs.push({
                name: 'Distributed Web Monitoring',
                gitems: []
            })
            
            var handleItems = function(callback) {
                var remaining = items.length;
                window.zabbix.getApplicationId('Distributed Web Monitoring', {
                    hostid: parseInt(host.hostid)
                }, function(err, applicationId) {
                    if (err) return callback(err);
                    items.forEach(function(item) {
                        item.applications = [ applicationId ];
                        window.zabbix.saveItem(item, function(err, itemId) {
                            if (err) {
                                return callback(err);
                            }
                            $('#items').append('.');
                            // append itemId to graph
                            graphs[0].gitems.push({
                                itemid: parseInt(itemId),
                                color: '009900'
                            });
                            
                            if (--remaining === 0) {
                                $('#items').append(' total: '+ items.length);
                                callback(null)
                            }
                        });
                    });
                });
            }
            
            var handleTriggers = function(callback) {
                var remaining = triggers.length;
                triggers.forEach(function(trigger) {
                    window.zabbix.saveTrigger(trigger, function(err, triggerId) {
                       if (err) {
                           return callback(err);
                       }
                       $('#triggers').append('.');
                       if (--remaining === 0) {
                           $('#triggers').append(' total: '+ triggers.length);
                           callback(null)
                       }
                   });
               });
            }

            var handleGraphs = function(callback) {
                var remaining = graphs.length;
                graphs.forEach(function(graph) {
                    window.zabbix.saveGraph(graph, function(err, graphId) {
                       if (err) {
                           return callback(err);
                       }
                       $('#graphs').append('.');
                       if (--remaining === 0) {
                           $('#graphs').append(' total: '+ graphs.length);
                           callback(null)
                       }
                   });
               });
            }

            async.waterfall([
                handleItems,
                handleTriggers,
                handleGraphs
            ], function(err) {
                if (err) {
                    $('#results').append('Error !')
                    $('#results').append('<div class="error">'+ err.message +'</div>')
                    console.log(err);
                    return
                }
                $('#results').append('Completed !')
                console.log('Succcessssss !!! ')
            });
            

        }
    });
    
    views.DistributedWebMonitoringList = Backbone.View.extend({
        
        el: '#content',
        events: {
        },
        initialize: function(options) {
            _.bindAll(this, 'render');
            this.host = options.host;
        },
        render: function() {
            var view = this;
            var host = view.host;
            
            this.$el.html(templates.distributedWebMonitoringList());

            $('#webnode option:selected').removeAttr('selected');
            $('#webnode option').each(function(index) {
                if (view.host.profile.macaddress 
                && $(this).val().toLowerCase() === view.host.profile.macaddress.toLowerCase()) {
                    $(this).attr('selected', 'selected');
                }
            });
            
            // we fetch the items within the DWM application - not searching for nc.web items...
            window.zabbix.call('application.get', {
                hostids: host.hostid,
                filter: {name: 'Distributed Web Monitoring'},
                output: 'shorten'
            }, function(err, resp) {
                if (err) return;
                if (_.isEmpty(resp.result)) {
                    $('#results').append('No \'Distributed Web Monitoring\' Application.');
                    return
                }
                window.zabbix.call('item.get', {
                    output: 'extend',
                    hostids: [ host.hostid ],
                    select_triggers: 'extend',
                    applicationids: [ resp.result[0].applicationid ]
                }, function(err, resp) {
                    if (err) return;
                    if (_.isEmpty(resp.result)) {
                        $('#results').append('No item defined in the \'Distributed Web Monitoring\' Application.');
                        return
                    }
                    _.each(resp.result, function(item) {
                        $('ul').append('<li>'+ item.description +' - '+ item.key_ +'</li>');
                    });
                });
            });
            return this;
        }
    });
}).apply(this, window.args);