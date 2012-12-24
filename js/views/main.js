(function(models, views, routers, templates) {

    views.Main = Backbone.View.extend({
        el: '#wrapper',
        events: {
            'click #add_dwm': 'distributedWebMonitoring',
            'click #add_haproxy': 'haProxy',
            'change #groups': 'getHosts',
            'change #hosts': 'updateActionHref'
        },
        initialize: function() {
            this.getGroups();
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
        updateActionHref: function() {
            var hostId = $('#hosts').val();
            $('#sidebar a').each(function(index) {
                if ($(this).attr('id') === 'add_dwm') {
                    $(this).attr('href', '#distributed-web-monitoring/'+ hostId);
                }
                if ($(this).attr('id') === 'add_haproxy') {
                    $(this).attr('href', '#haproxy/'+ hostId);
                }
            });
        },
        distributedWebMonitoring: function () {
            var groupId = $('#groups').val(),
                hostId = $('#hosts').val();
                
            var host = _.filter(this.hosts, function(host) {
                return host.hostid === hostId;
            })[0];
            
            if (_.isEmpty(groupId) || _.isEmpty(hostId)) {
                new views.Error({msg: 'Select group / host first'}).render();
            } else {
                new views.DistributedWebMonitoring({host: host}).render();
            }
        },
        haProxy: function () {
            var groupId = $('#groups').val(),
                hostId = $('#hosts').val();
                
            var host = _.filter(this.hosts, function(host) {
                return host.hostid === hostId;
            })[0];
            
            if (_.isEmpty(groupId) || _.isEmpty(hostId)) {
                new views.Error({msg: 'Select group / host first'}).render();
            } else {
                new views.HaProxy({host: host}).render();
            }
        },
        render: function () {
            this.$el.html(templates.layout());
            $('#wrapper header').html(templates.header());
            $('#sidebar').html(templates.sidebar());
            $('#content').html(templates.content());
            return this;
        }
    });

}).apply(this, window.args);