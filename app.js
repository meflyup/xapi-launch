var express = require('express');
var async = require('async');
var app = express();
var Datastore = require('nedb');
var DB = null;
var hoganExpress = require('hogan-express');
require('pretty-error').start();
var mongoose = require('mongoose');
var DAL = require("./server/DAL.js").DAL;
async.series([
	
	function loadConfig(cb)
	{
		if (require("./server/config.js").config === null)
		{
			var readline = require('readline');
			var rl = readline.createInterface(
			{
				input: process.stdin,
				output: process.stdout
			});
			rl.question('Please enter the LRS URL (ending with a slash): ', function(LRS_Url)
			{
				require("./server/config.js").config = {};
				require("./server/config.js").config.LRS_Url = LRS_Url; 
				rl.question('Please enter the LRS Username: ', function(LRS_Username) 
				{
					require("./server/config.js").config.LRS_Username = LRS_Username;
					rl.question('Please enter the LRS Password: ', function(LRS_Password) 
					{
						require("./server/config.js").config.LRS_Password = LRS_Password;
						rl.question('Please enter the host (not ending in slash - eg. http://localhost:3000): ', function(host) 
						{
							require("./server/config.js").config.host = host;
							rl.question('Enter the email for the administrator login: ', function(admin_email) 
							{
								require("./server/config.js").config.admin_email = admin_email;
								// TODO: Log the answer in a database
								rl.question('Enter the password for the administrator login: ', function(admin_pass) 
								{
									require("./server/config.js").config.admin_pass = admin_pass;
									// TODO: Log the answer in a database
									console.log('This information has been saved to config.json. Please start the server again.');
									require('fs').writeFileSync("./config.json",JSON.stringify(require("./server/config.js").config));
									rl.close();
									process.exit();
								});
							});
						});
					});
				});
			});
		}
		else return cb();
	},
	function loadDB(cb)
	{
		
		mongoose.connect('mongodb://localhost/xapi-launch');
		var db = mongoose.connection;
		db.once('open', function(err)
		{
			
			DB = new DAL();
			cb(err);
		});
		
	}
], function startServer()
{
	//serve static files
	var config = require("./server/config.js").config;

	app.use('/static', express.static('public'));
	app.use(require("body-parser").json());
	app.use(require("body-parser").urlencoded(
	{
		extended: true
	}));
	app.use(require("cookie-parser")());
	//use mustache templating
	app.engine('html', hoganExpress);
	app.set('view engine', 'html');
	app.set('views', __dirname + '/views');
	app.set('partials',
	{
		header: 'header',
		footer: 'footer',
		scripts: 'scripts',
		form:'forms/form'
	});
	app.set('layout', 'layout');
	
	app.use(function(req,res,next)
	{
		if(!res.locals)
			res.locals = {};
		res.locals.demoMode = config.demoMode;
		next();
	})
	//setup various routes
	require('./server/users.js').setup(app, DB);
	require('./server/xapi.js').setup(app, DB);
	require('./server/admin.js').setup(app, DB);
	require('./server/content.js').setup(app, DB);
	require('./server/media.js').setup(app, DB);
	require('./server/mediaType.js').setup(app, DB);
	require('./server/launch.js').setup(app, DB);
	require('./server/files.js').setup(app, DB);
	require('./server/protocol.js').setup(app, DB);
	/*app.all("*",function(req,res,next)
	{
		res.redirect("/");
	});*/
	app.listen(3000, function() {})

	var app2 = express();
	app2.use('/static', express.static('public'));
	app2.listen(3001, function() {});

	var app3 = express();
	app3.use('/static', express.static('public'));
	app3.listen(3002, function() {})

	var app4 = express();
	app4.use('/static', express.static('public'));
	app4.listen(3003, function() {})
});