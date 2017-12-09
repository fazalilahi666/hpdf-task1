var express = require('express');
var morgan = require('morgan');
var path = require('path');
var bodyParser = require('body-parser');
var https = require('https');
var request = require('request-promise');
var cookieParser = require('cookie-parser');

var app = express();
app.use(morgan('combined'));
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.json());
app.use(cookieParser())

function createTemplate(data) {
	var htmlTemplate = "<h3>Authors and their posts count<h3>";
	for (var i = 0; i < data.length; i++) {
		var temp = `<h4>${data[i].author}: ${data[i].postCount}</h4>`;
		htmlTemplate += temp;
	}
	return htmlTemplate;
}

app.get('/', function (req, res) {
	res.send('Hello World - Fazal here.')
});

// get call to fetch all authors and posts from the service
app.get('/authors', function (req, res) {
	// arrays to store authors and posts
	var allAuthors = [], allPosts = [], authorPosts = [];

	// make API call to service and fetch all authors
	request("https://jsonplaceholder.typicode.com/users").then(function (body) {
		// store all authors
		allAuthors = JSON.parse(body);
		// callback another request to fetch posts
		return request("https://jsonplaceholder.typicode.com/posts");
	}).catch(function (err) {
		// something went wrong.call failed...
		//console.log(err);
		res.status(500).send("Sorry!Something went wrong on server. Try again.");
	})
		.then(function (body) {
			// store all posts
			allPosts = JSON.parse(body);
			// process the data to get count of authors posts		
			for (var i = 0; i < allAuthors.length; i++) {
				var authorName = allAuthors[i].name;
				var authorId = allAuthors[i].id;
				//console.log("authorId..",authorId);
				// filter and get only the posts of current author
				var post = allPosts.filter(function (element) {
					return element.userId == authorId;
				});
				var authorPost = { author: authorName, postCount: post.length };
				// add the author and post count
				authorPosts.push(authorPost);
			}
			// create the html template and send as response
			res.send(createTemplate(authorPosts));
			//res.json({ success: true, "data": JSON.parse(authorPosts) });
		}).catch(function (err) {
			// something went wrong.call failed...
			//console.log(err);
			res.status(500).send("Sorry!Something went wrong on server. Try again.");
		});
});

// set cookie
app.get('/setcookie', function (req, res) {
	// check if cookie present
	var cookie = req.cookies.myCookie;
	if (cookie === undefined) {
		// set a new cookie (task specified a SINGLE cookie)
		var cookieVal = { 'name': 'Fazal', 'age': '21' };
		res.cookie('myCookie', cookieVal, { maxAge: 900000, httpOnly: true });
	}
	res.send('Cookie with a key-value pair of name and age is set. Try /getcookies to see it.');
});

// get cookies
app.get('/getcookies', function (req, res) {
	// check if cookie present
	var cookie = req.cookies.myCookie;
	if (cookie != undefined) {
		res.send(cookie);
	} else {
		// cookie not set 
		res.send('Sorry! no available cookies. Try /setcookie');
	}
});


// forbidden request
app.get('/robots.txt', function (req, res) {
	res.status(403).send('You are not allowed here!')
	// or redirect to this cool (emoji?) thingy
	// res.redirect("http://httpbin.org/deny");
});

// serve html file as response
app.get('/html', function (req, res) {
	res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

// serve an image file as response
app.get('/image', function (req, res) {
	res.sendFile(path.join(__dirname, 'ui', 'ab-de-villiers-3a.jpg'));
});


// serve an input box as response
app.get('/input', function (req, res) {
	var formTemp = `
	<div align=center>
	<h1>Enter something...</h1>
	<form action=/post-input method=post>
	<input type=text name=testInput id=testInput><br><br>
	<input type=submit>
	</form>
	</div>`;
	res.write(formTemp);
	res.end();
});

// get input value posted and log it
app.post('/post-input', function (req, res) {
	var inputVal = req.body.testInput;
	console.log("Received input...", inputVal);
	res.status(200).send('We got your message. You entered: ' + inputVal);
});

var port = 8080;
app.listen(port, function () {
	console.log(`App listening on port ${port}!`);
});