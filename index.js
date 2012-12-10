var express = require('express');
var http = require('http');
var _ = require('underscore');
var Zabbix = require('zabbix');
var zbx_url = 'https://zabbix.service.chinanetcloud.com'

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('title', 'NetCloud Zabbix API');
  
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('nc-zabbix'));
  app.use(express.session());
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
    res.render('index', { title: 'NC Zabbix' });
});

app.post('/login', function(req, res) {
    var user = req.body.user;
    var pass = req.body.pass;
    
    if (user && pass) {
        app.zabbix = new Zabbix(zbx_url, user, pass);
        app.zabbix.getApiVersion(function (err, resp, body) {
            if (!err) {
                console.log("Unauthenticated API version request, and the version is: " + body.result)
            }
        });
    } else {
        res.send(500, {error: 'Missing zabbix credentials.'});
    }
});

app.post('/api', function(req, res) {
    if (!_.isEmpty(req.body)) {
        if (req.body.toto) {
            res.send('data: '+ req.body.toto);
        } else {
            res.send('no toto param provided in body.');
        }
    } else {
        res.send(500, {error: 'error in the post, missing body.'});
    }
})


http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});