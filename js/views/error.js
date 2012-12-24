(function(models, views, routers, templates) {

    views.Error = Backbone.View.extend({
        el: $('#error'),
        events: {},
        initialize: function(options) {
            this.msg = options.msg || ''
        },
        render: function() {
            this.$el.html(this.msg);
            return this;
        },
    });
    
}).apply(this, window.args);
