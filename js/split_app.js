(function(){
    var zbx_url = '/api_jsonrpc.php';
    
    
    var mainView = Backbone.View.extend({
        el: $('body'),
        events: {
            'change #groups': 'getHosts',
            'change #hosts': 'showActions',
            'click #get_dwm': 'getDWM',
            'click #add_dwm': 'displayDWM',
            'click #create_dwm': 'addDWM',
            'keyup #dwm_url': 'updateUrl',
            'click #update_profile': 'updateProfile'
        },
        initialize: function() {
            $('#content').hide();
            $('#login').show();
            $('#actions').hide();
            _.bindAll(this, 'login', 'reset', 'getGroups', 'getHosts', 'showActions');
            _.bindAll(this, 'getDWM', 'displayDWM', 'addDWM', 'updateUrl', 'updateProfile');
        },
        render: function() {
            return this;
        },
        updateUrl: function(target) {
            // simply display the URL as a link when being entered to ensure it exists !
            var url = $('#dwm_url').val();
            if (url.search(/^http(|s):\/\//) === -1) url = 'http://'+ url;
            $('#dwm_url').parent().find('a').attr('href', url);
            $('#dwm_url').parent().find('a').html(url);
        },

        reset: function() {
            // simply reset the view and add the various fields
            // TODO: user various sub-views instead
            $('#error').empty();
            $('#results').empty();
            $('#content').show();
            $('#login').hide();
            $('#dwm').hide();
            $('#actions').hide();
        },
        showActions: function() {
            var view = this;
            view.host = _.filter(view.hosts, function(host) {
                return host.hostid === $('#hosts').val();
            })[0];
            if (!_.isEmpty($('#groups').val()) && !_.isEmpty($('#hosts').val())) {
                $('#actions').show();
            } else {
                $('#actions').hide();
            }
        },
        getGroups: function() {
            // fetch groups, then populate the #groups select
            var view = this;
            window.zabbix.call('hostgroup.get', {
                output: 'extend',
                real_hosts: 1
            }, function(err, resp) {
                if (err) {
                    $('#error').html(err.data ? err.data : err.message);
                } else {
                    view.reset();
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
                    $('#error').html(err.data ? err.data : err.message);
                } else {
                    view.reset();
                    view.hosts = resp.result;
                    $('#hosts').html('<option value=""> -- Select an host -- </option>');
                    _.each(resp.result, function(item) {
                        $('#hosts').append('<option value="'+ item.hostid +'">'+ item.host +'</option>');
                    });
                    view.showActions();
                }
            });
        },

    });
    
    window.App = new mainView;
}());
