(function(models, views, routers, templates) {

    views.Main = Backbone.View.extend({
        el: '#content',
        events: {
            'click #add_dwm': 'distributedWebMonitoring',
            'click #add_haproxy': 'haProxy'
        },
        distributedWebMonitoring: function () {
            new views.distributedWebMonitoring().render();
        },
        haProxy: function () {
            new views.haProxy().render();
        },
        render: function () {
            this.$el.html(templates.main());
            return this;
        }
    });

}).apply(this, window.args);