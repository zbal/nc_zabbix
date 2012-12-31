(function(models, views, routers, templates) {

    views.HaProxyAdd = Backbone.View.extend({
        
        el: '#content',
        events: {
            'click #fetch-haproxy': 'fetchHaProxy'
        },
        initialize: function(options) {
            _.bindAll(this, 'render');
            this.host = options.host;
        },
        render: function() {
            this.$el.html(templates.haProxyAdd());
        },
        fetchHaProxy: function() {
            var url = $('#url').val();
            var user = $('#user').val();
            var pass = $('#pass').val();
            
            // Fetch the CSV from the URl
            url = url +';csv;norefresh';
            $.ajax({
                url: url, 
                beforeSend: function(xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(user + ":" + pass))
                }
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
    