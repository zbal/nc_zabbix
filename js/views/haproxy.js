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
            var obj = $.csv.toObjects(csv);
            var items = [];
            
            _.each(obj, function(server) {
                var items = [
                    { name: 'hrsp_5xx',     description: 'http_5xx responses',  delay: 1800, value_type: 0 },
                    { name: 'chkdown',      description: 'Check down',          delay: 1800, value_type: 0 },
                    { name: 'chkfail',      description: 'Check fail',          delay: 1800, value_type: 0 },
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

                items.forEach(function(item) {
                    var localItem = _.clone(item);

                    // common data
                    localItem.history = 15;
                    localItem.trends = 60;
                    localItem.hostid = host.hostid;

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
            
            window.zabbix.getApplicationId('HaProxy', {
                hostid: host.hostid
            }, function(err, applicationId) {
                if (err) return;
                if (!applicationId) return;
                items.forEach(function(item) {
                    console.log('processing item');
                    item.applications = [ applicationId ];
                    
                    window.zabbix.saveItem(item, function(err, itemId) {
                        if (err) {
                            console.log(err)
                            return
                        }
                        console.log('successs ! '+ itemId);
                    });
                });
            })
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
    