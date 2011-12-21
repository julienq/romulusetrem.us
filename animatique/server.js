var connect = require("connect");
var server = connect.createServer();
server.use(connect.favicon());
server.use(connect.logger());
server.use(connect.static(__dirname + "/static"));
server.listen(8888);
