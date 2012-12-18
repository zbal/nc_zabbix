(function(models, views, routers, templates) {

    views.Main = Backbone.View.extend({
        el: '#content',
        events: {
            
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