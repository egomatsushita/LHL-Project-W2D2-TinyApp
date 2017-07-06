const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// Store and access the users in the app
const users = {};

// Database that stores short and long urls
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "s9m5xK": "http://www.google.com"
};

// Print message to root
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Returns a page that includes a form with an email and password field
app.get("/register", (req, res) => {
  res.render("register");
});

// Receive data from register page
// Register a new user
// Redirect to /urls
app.post("/register", (req, res) => {
  let body = req.body;
  let email = body.email;
  let password = body.password;
  let userId = generateUserRandomId(body);

  // Return messaging alerting with empty input or existing email
  if (email === "" || password === "") {
    res.status(400).render("form-empty-email-password");
    return;
  } else if (!isANewEmail(email)) {
    res.status(400).render("form-existing-email");
    return;
  }

  // Register a new user
  users[userId] = {
    email: email,
    password: password
  };

  // set up user_id cookies
  res.cookie("user_id", userId);

  res.redirect("/urls");
});

// Create a login page
app.get("/login", (req, res) => {
  res.render("login");
});


// Index page
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
    user: users[req.cookies['user_id']]
  };

  res.render("urls-index", templateVars);
});

// Generate new short url
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    user: users[req.cookies['user_id']]
  }

  res.render("urls-new", templateVars);
});

// Update urlDatabase when given a new long url
app.post("/urls", (req, res) => {
  let returnedInput = req.body;
  let short_URL = generateRandomString();
  let long_URL = `http://${returnedInput.longURL}`;

  // Update urlDatabase with user's url input and a random short url generated
  urlDatabase[short_URL] = long_URL;

  res.redirect(`/urls/${short_URL}`);
});

// Show short url
app.post("/urls/:id", (req, res) => {
  let short_URL = req.params.id;

  res.redirect(`/urls/${short_URL}`);
});

// Update long url
app.post("/urls/:id/update", (req, res) => {
  let short_URL = req.params.id;
  let returnedInput = req.body;
  let long_URL = `http://${returnedInput.longURL}`;

  // Update urlDatabase updating long url
  urlDatabase[short_URL] = long_URL;

  res.redirect(`/urls`);

});

// Delete data from urlDatabase
app.post("/urls/:id/delete", (req, res) => {
  let short_URL = req.params.id;

  // Update urlDatabase deleting a key/value pair
  delete urlDatabase[short_URL];

  res.redirect(`/urls`);
});

// Show urls-show page
app.get("/urls/:id", (req, res) => {
  const aLongURL = urlDatabase[req.params.id];
  let templateVars = {
    shortURL: req.params.id,
    longURL: aLongURL,
    username: req.cookies["username"],
    user: users[req.cookies['user_id']]
  };

  res.render("urls-show", templateVars);
});

// Redirect to long url
app.get("/u/:shortURL", (req, res) => {
  const short_URL = req.params.shortURL;
  let long_URL = urlDatabase[short_URL];

  res.redirect(long_URL);
})

// Login route
app.post("/login", (req,res) => {
  const email = req.body.email;

  if (!isANewEmail(email)) {
    res.redirect("/urls");
  } else {
    res.redirect("/register");
  }

  // res.cookie("username", body.username);
  // res.redirect("/urls");
});

// Logout route
app.post("/logout", (req,res) => {
  const body = req.body;
  console.log(body);

  res.clearCookie("user");
  res.redirect("/login");
});

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
  }
    aShortURL += alphanumeric[randomNumber];

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

