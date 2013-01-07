(function(models, views, routers, templates) {
    views.HaProxyAdd = Backbone.View.extend({
        
        el: '#content',
        events: {
            'click #fetch-haproxy': 'fetchHaProxy',
            'click #process-haproxy': 'processHaProxy'
        },
        initialize: function(options) {
            _.bindAll(this, 'render');
            this.host = options.host;
        },
        render: function() {
            this.$el.html(templates.haProxyAdd());
        },
        processHaProxy: function() {
            var view = this;
            var host = view.host;
            var csv = $('#csv').val();
            var servers = $.csv.toObjects(csv);

            // var pools = {};
            // _.each(servers, function(server) {
            //     if ()
            // });

            //
            // build items 
            //
            var items = [];
            var items_template = [
                { name: 'hrsp_5xx',     description: 'http_5xx responses',  delay: 1800, value_type: 0 },
                { name: 'chkdown',      description: 'Check Down',          delay: 1800, value_type: 0 },
                { name: 'chkfail',      description: 'Check Fail',          delay: 1800, value_type: 0 },
                { name: 'econ',         description: 'Errors Connection',   delay: 1800, value_type: 0 },
                { name: 'eresp',        description: 'Errors Response',     delay: 1800, value_type: 0 },
                { name: 'check_status', description: 'Last Check Status',   delay: 1800, value_type: 1 },
                { name: 'name',         description: 'Name',                delay: 1800, value_type: 1 },
                { name: 'scur',         description: 'Session Current',     delay: 300,  value_type: 0 },
                { name: 'slim',         description: 'Session Limit',       delay: 1800, value_type: 0 },
                { name: 'smax',         description: 'Session Max',         delay: 1800, value_type: 0 },
                { name: 'rate',         description: 'Session Rate Current', delay: 300, value_type: 0 },
                { name: 'rate_max',     description: 'Session Rate Max',    delay: 1800, value_type: 0 },
                { name: 'status',       description: 'Status',              delay: 300,  value_type: 1 },
            ]
            
            _.each(servers, function(server) {
                items_template.forEach(function(item) {
                    var localItem = _.clone(item);

                    // common data
                    localItem.history = 15;
                    localItem.trends = 60;
                    localItem.hostid = parseInt(host.hostid);

                    localItem.description = 'HA '+ server['# pxname'] +' '+ server['svname'] +' '+ item.description
                    localItem.key_ = 'haproxy[stat,'+ item.name +','+ server['# pxname'] +','+ server['svname'] +']';

                    // do some filtering as not all the items apply to all type of srvname
                    switch (item.name) {
                        case 'slim':
                            if (server.svname !== 'BACKEND') {
                                // session limit only or frontend and regular servers
                                items.push(localItem);
                            }
                            break;
                        default:
                            items.push(localItem);
                    }
                });
            });
            
            //
            // build triggers
            //
            var triggers = [];
            _.each(servers, function(server) {
                var pool = server['# pxname'],
                    name = server['svname'];
                
                if (server['svname'] === 'FRONTEND') {
                    var trigger = {
                        description: 'HA '+ pool +' '+ name +' current session count 75% of the session limit on {HOSTNAME}, now {ITEM.LASTVALUE}',
                        expression: '{'+ host.host +':haproxy[stat,scur,'+ pool +','+ name +'].last(0)}/{'+ host.host +':haproxy[stat,slim,'+ pool +','+ name +'].last(0)}>0.75',
                        status: 0,
                        priority: 0,
                        type: 0,
                        hostid: parseInt(host.hostid)
                    }
                    triggers.push(trigger);
                } else {
                    var trigger = {
                        description: 'HA '+ pool +' '+ name +' is not UP',
                        expression: '{'+ host.host +':haproxy[stat,status,'+ pool +','+ name +'].str(UP)}#1',
                        status: 0,
                        priority: 0,
                        type: 0,
                        hostid: parseInt(host.hostid)
                    }
                    triggers.push(trigger);
                }
            });
            
            
            //
            // build graph
            //
            var graphs = [];
            var graphs_template = {}
            
            var handleItems = function(callback) {
                var remaining = items.length();
                window.zabbix.getApplicationId('HaProxy', {
                    hostid: parseInt(host.hostid)
                }, function(err, applicationId) {
                    if (err) return callback(err);
                    items.forEach(function(item) {
                        item.applications = [ applicationId ];
                        window.zabbix.saveItem(item, function(err, itemId) {
                            if (err) {
                                return callback(err);
                            }
                            if (--remaining === 0) {
                                callback(null)
                            }
                        });
                    });
                });
            }
            
            var handleTriggers = function(callback) {
                var remaining = triggers.length();
                triggers.forEach(function(trigger) {
                    window.zabbix.saveTrigger(trigger, function(err, triggerId) {
                       if (err) {
                           return callback(err);
                       }
                       if (--remaining === 0) {
                           callback(null)
                       }
                   });
               });
            }

            var handleGraphs = function(callback) {
                var remaining = graphs.length();
                graphs.forEach(function(graph) {
                    window.zabbix.saveGraph(graph, function(err, graphId) {
                       if (err) {
                           return callback(err);
                       }
                       if (--remaining === 0) {
                           callback(null)
                       }
                   });
               });
            }
            
            async.waterfall([
                handleItems(cb),
                handleTriggers(cb)
            ], function(err) {
                if (err) {
                    console.log(err);
                    return
                }
                console.log('Succcessssss !!! ')
            });
            
            console.log(items);
        },
        fetchHaProxy: function() {
            var url = $('#url').val();
            var user = $('#user').val();
            var pass = $('#pass').val();
            
            // Fetch the CSV from the URl
            url = url +';csv;norefresh';
            $.ajax({
                url: url,
                type: 'GET',
                headers: {Authorization: "Basic " + btoa(user + ":" + pass)}
            }, function(err, resp) {
                console.log(resp);
            });
        }
    }),
    
    views.HaProxyList = Backbone.View.extend({
        
        el: '#content',
        events: {
        },
        initialize: function(options) {
            _.bindAll(this, 'render');
            this.host = options.host;
        },
        render: function() {
            this.$el.html(templates.haProxyList());
            
        }
    })
}).apply(this, window.args);
    