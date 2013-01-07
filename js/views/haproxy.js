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
            var csv = $('#csv').val();
            var obj = $.csv.toObjects(csv);
            var keys = {};
            
            _.each(obj, function(server) {
                keys[server['# pxname'] +' '+ server['svname']] = [];
                var param = [
                    'hrsp_5xx',
                    'chkdown',
                    'chkfail',
                    'econ',
                    'eresp',
                    'check_status',
                    'name',
                    'scur',
                    'slim',
                    'smax',
                    'rate',
                    'rate_max',
                    'status'
                ]
                param.forEach(function(key) {
                    var key_ = 'haproxy[stat,'+ key +','+ server['# pxname'] +','+ server['svname'] +']';
                    keys[server['# pxname'] +' '+ server['svname']].push(key_);
                });
            });
            console.log(keys);
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
    