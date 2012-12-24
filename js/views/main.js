(function(models, views, routers, templates) {

    views.Main = Backbone.View.extend({
        el: '#content',
        events: {
            'click #add_dwm': 'distributedWebMonitoring',
            'click #add_haproxy': 'haProxy',
            'change #groups': 'getHosts',
            'change #hosts': 'showActions',
        },
        getGroups: function() {
            // fetch groups, then populate the #groups select
            var view = this;
            window.zabbix.call('hostgroup.get', {
                output: 'extend',
                real_hosts: 1
            }, function(err, resp) {
                if (err) {
                    new views.Error({msg: err.data ? err.data : err.message}).render();
                } else {
                    $('#groups').html('<option value=""> -- Select a group -- </option>');
                    _.each(resp.result, function(item) {
                        $('#groups').append('<option value="'+ item.groupid +'">'+ item.name +'</option>');
                    });
                }
            });
        },
        getHosts: function() {
            // fetch hosts using group, then populate the #hosts select
            var view = this;
            window.zabbix.call('host.get', {
                output: 'extend',
                groupids: $('#groups').val(),
                select_profile: 'extend'
            }, function(err, resp) {
                if (err) {
                    new views.Error({msg: err.data ? err.data : err.message}).render();
                } else {
                    view.hosts = resp.result;
                    $('#hosts').html('<option value=""> -- Select an host -- </option>');
                    _.each(resp.result, function(item) {
                        $('#hosts').append('<option value="'+ item.hostid +'">'+ item.host +'</option>');
                    });
                }
            });
        },
        distributedWebMonitoring: function () {
            var group_id = $('#groups').val(),
                host_id = $('#hosts').val();
                
            if (_.isEmpty(group_id) || _.isEmpty(host_id)) {
                new views.Error({msg: 'Select group / host first'}).render();
            } else {
                new views.distributedWebMonitoring().render();
            }
        },
        haProxy: function () {
            var group_id = $('#groups').val(),
                host_id = $('#hosts').val();
                
            if (_.isEmpty(group_id) || _.isEmpty(host_id)) {
                new views.Error({msg: 'Select group / host first'}).render();
            } else {
                new views.haProxy().render();
            }
        },
        render: function () {
            this.$el.html(templates.main());
            return this;
        }
    });

}).apply(this, window.args);