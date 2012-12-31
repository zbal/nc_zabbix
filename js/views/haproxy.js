(function(models, views, routers, templates) {

    views.HaproxyAdd = Backbone.View.extend({
        
        el: '#content',
        events: {
            'click #fetch_haproxy': 'fetchHaProxy'
        },
        initialize: function(options) {
            _.bindAll(this, 'render');
            this.host = options.host;
        },
        render: function() {
            
        },
        fetchHaProxy: function() {
            var url = $('#url').text();
            var user = $('#user').text();
            var pass = $('#pass').text();
            
            // Fetch the CSV from the URl
            url = url +';csv;norefresh';
            $.ajax(url, {
                username: user,
                password: pass
            }, function(err, resp) {
                console.log(resp);
            });
        }
    }),
    
    views.HaproxyList = Backbone.View.extend({
        
        el: '#content',
        events: {
        },
        initialize: function(options) {
            _.bindAll(this, 'render');
            this.host = options.host;
        },
        render: function() {
            
        }
    })
}).apply(this, window.args);
    