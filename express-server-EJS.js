const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession( {
  name: 'session',
  keys: ['key1', 'key2']
}));

// Store and access the users in the app
const users = {};

// Database that stores short and long urls
let urlDatabase = {
  "b2xVn2": {
    "url": "http://www.lighthouselabs.ca",
    "userID": ""
  },
};


// Open index page if logged in otherwise open login page
app.get("/", (req, res) => {

  if (!users[req.session.user_id]) {
    return res.render("login");
  } else {
    return res.redirect("/urls");
  }

  // res.render("welcome");
});


// Open register page where a new user input email and password
app.get("/register", (req, res) => {
  res.render("register");
});


// Receive data from register page
// Register a new user
// Open the index page
app.post("/register", (req, res) => {
  let body = req.body;
  let email = body.email;
  const password = body.password;
  const hashed_password = bcrypt.hashSync(password, 10);
  let userId = generateUserRandomId(body);

  // Return a message alerting with an empty input or an existing email
  if (email === "" || bcrypt.compareSync("", hashed_password)) {
    return res.status(400).render("form-empty-email-password");
  } else if (!isANewEmail(email)) {
    return res.status(400).render("form-existing-email");
  }

  // Register a new user
  users[userId] = {
    id: userId,
    email: email,
    password: password
  };

  // Update a default urlDatabase to the every user logged in
  urlDatabase['b2xVn2']['userID'] = userId;

  // set up user_id cookies
  req.session.user_id =  userId;

  res.redirect("/urls");
});


// Open the login page
app.get("/login", (req, res) => {

  res.render("login");
});


// Index page
app.get("/urls", (req, res) => {
  // If an user tries to access without being logged in the page returns to the welcome page
  if (!users[req.session.user_id]) {
    return res.render("welcome");
  }

  // Generate a unique database for each user
  let _urlsForUser = urlsForUser(users[req.session.user_id]['id']);

  let templateVars = {
    urls: _urlsForUser,
    user: users[req.session.user_id]
  };

  if (templateVars['user']) {
    return res.render("urls-index", templateVars);
  } else {
    return res.render("welcome");
  }
});


// Generate new short url if user is logged in otherwise redirect to login page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  }

  if (!templateVars.user) {
    return res.render("login");
  } else {
    return res.render("urls-new", templateVars);
  }
});


// Update urlDatabase when given a new long url
app.post("/urls", (req, res) => {
  let user = users[req.session.user_id];
  let returnedInput = req.body;
  let short_URL = generateRandomString();
  let long_URL = `http://${returnedInput.longURL}`;

  urlDatabase[short_URL] = {};
  urlDatabase[short_URL]['url'] = long_URL;
  urlDatabase[short_URL]['userID'] = user['id'];

  res.redirect(`/urls/${short_URL}`);
});


// Show short url page
app.post("/urls/:id", (req, res) => {
  let short_URL = req.params.id;

  res.redirect(`/urls/${short_URL}`);
});


// Update url
app.post("/urls/:id/update", (req, res) => {
  let short_URL = req.params.id;
  let returnedInput = req.body;
  let long_URL = `http://${returnedInput.longURL}`;
  let templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  }

  if (templateVars['urls'][short_URL]['userID'] === templateVars['user']['id']) {
    urlDatabase[short_URL]['url'] = long_URL;
  }

  res.redirect(`/urls`);
});


// Delete data from urlDatabase
app.post("/urls/:id/delete", (req, res) => {
  let short_URL = req.params.id;
  let templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  }

  if (templateVars['urls'][short_URL]['userID'] === templateVars['user']['id']) {
    delete urlDatabase[short_URL];
  }

  res.redirect(`/urls`);
});


// Show urls-show page
app.get("/urls/:id", (req, res) => {
  const user = urlDatabase[req.params.id]['userID'];
  const url = urlDatabase[req.params.id]['url'];
  let templateVars = {
    shortURL: req.params.id,
    longURL: url,
    user: users[req.session.user_id]
  };

  if (!users[req.session.user_id]) {
    return res.render("welcome");
  } else {
    if (user !== templateVars['user']['id']) {
      res.render("form-url-not-belong");
    } else {
      res.render("urls-show", templateVars);
    }
  }
});


// Redirect to url from short url
app.get("/u/:shortURL", (req, res) => {
  const short_URL = req.params.shortURL;
  let long_URL = urlDatabase[short_URL]['url'];

  res.redirect(long_URL);
})


// Login route
app.post("/login", (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashed_password = bcrypt.hashSync(password, 10);

  if (!isANewEmail(email)) {
    for (let user in users) {
      let aUser = users[user];
      if (aUser.email === email && bcrypt.compareSync(aUser.password, hashed_password)) {
        req.session.user_id = user;
        urlDatabase['b2xVn2']['userID'] = user;
        return res.redirect("/urls"); // ATTENTION '/' SEE LATER
      }
      else if (aUser.email === email && !(bcrypt.compareSync(aUser.password, hashed_password))){
        return res.status(403).render("form-not-match-email-password");
      }
    }
  } else {
    return res.status(403).render("form-cannot-found-email");
  }
});


// Logout route
app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect("/login");
});


// PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});


// Generate random shrot url
function generateRandomString() {
  let alphanumeric = `abcdefghijklmnopqrstuwvxyzABCDEFGHIJKLMNOPQRSTUWVXYZ0123456789`;
  let aShortURL = "";
  let randomNumber;

  for (let i = 0; i < 6; i++) {
    randomNumber = Math.floor(Math.random() * alphanumeric.length);
    aShortURL += alphanumeric[randomNumber];
  }

  return aShortURL;
}


// Generate an user random id from his input data
function generateUserRandomId(body) {
  let alpha = body.email.indexOf('@');
  let aUserIdPartial1 = body.email.slice(0, alpha);
  let aUserIdPartial2 = Math.floor(Math.random() * 1000);

  let aUserId = aUserIdPartial1 + aUserIdPartial2;

  return aUserId;
}


// Return true if there is an existing email
function isANewEmail(email) {
  let newEmail = true;

  for (let aUserId in users) {
    if (users[aUserId].email === email) {
      newEmail = false;
    }
  }

  return newEmail;
}


// Returns the subset of the URL database taht belongs to the user with ID
function urlsForUser(id) {
  let urlsForUser = {};

  for (let short_URL in urlDatabase) {
    for (let key in urlDatabase[short_URL]) {
      if (urlDatabase[short_URL][key] === id) {
        urlsForUser[short_URL] = {};
        urlsForUser[short_URL]['url'] = urlDatabase[short_URL]['url'];
      }
    }
  }

  return urlsForUser;
}

