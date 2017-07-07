const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// Store and access the users in the app
const users = {};

// Database that stores short and long urls
let urlDatabase = {
  "b2xVn2": {
    "url": "http://www.lighthouselabs.ca",
    "userID": ""
  },
  "s9m5xK": {
    "url": "http://www.google.com",
    "userID": ""
  }
};

// Print message to root
app.get("/", (req, res) => {
  res.render("welcome");
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
  const password = body.password;
  const hashed_password = bcrypt.hashSync(password, 10);
  let userId = generateUserRandomId(body);

  // Return messaging alerting with empty input or existing email
  if (email === "" || bcrypt.compareSync("", hashed_password)) {
  // if (email === "" || password === "") {
    res.status(400).render("form-empty-email-password");
    return;
  } else if (!isANewEmail(email)) {
    res.status(400).render("form-existing-email");
    return;
  }

  // Register a new user
  users[userId] = {
    id: userId,
    email: email,
    password: password
  };
  //urlDatabase['userID'] = users[userId]; //**********
  urlDatabase['b2xVn2']['userID'] = userId;


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
  let _urlsForUser = urlsForUser(users[req.cookies['user_id']]['id']);

  let templateVars = {
    urls: _urlsForUser,
    // urls: urlDatabase,
    user: users[req.cookies['user_id']]
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
    user: users[req.cookies['user_id']]
  }

  if (!templateVars.user) {
    return res.render("login");
  } else {
    return res.render("urls-new", templateVars);
  }

});

// Update urlDatabase when given a new long url
app.post("/urls", (req, res) => {
  let user = users[req.cookies['user_id']];
  let returnedInput = req.body;
  let short_URL = generateRandomString();
  let long_URL = `http://${returnedInput.longURL}`;

  // Update urlDatabase with user's url input and a random short url generated
  urlDatabase[short_URL] = {};
  urlDatabase[short_URL]['url'] = long_URL;
  urlDatabase[short_URL]['userID'] = user['id'];

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
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  }

  if (templateVars['urls'][short_URL]['userID'] === templateVars['user']['id']) {
    // Update urlDatabase updating long url
    urlDatabase[short_URL]['url'] = long_URL;
  }

  res.redirect(`/urls`);

});

// Delete data from urlDatabase
app.post("/urls/:id/delete", (req, res) => {
  let short_URL = req.params.id;
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  }

  if (templateVars['urls'][short_URL]['userID'] === templateVars['user']['id']) {
    // Update urlDatabase deleting a key/value pair
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
    user: users[req.cookies['user_id']]
  };

  // for (let id in users) {
  //   console.log(users[id]['id'])
  // }
  if (user !== templateVars['user']['id']) {
    res.render("form-url-not-belong");
  } else {
    res.render("urls-show", templateVars);

  }


});

// Redirect to long url
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
      // if (aUser.email === email && aUser.password === password) {
        res.cookie("user_id", user);
        // urlDatabase['userID'] = aUser.email;
        return res.redirect("/urls"); // ATTENTION '/' SEE LATER
      }
      else if (aUser.email === email && bcrypt.compareSync(aUser.password, hashed_password)){
      // else if (aUser.email === email && aUser.password !== password){
        return res.status(403).render("form-not-match-email-password");
      }
    }
  } else {
    return res.status(403).render("form-cannot-found-email");
  }
});

// Logout route
app.post("/logout", (req,res) => {
  res.clearCookie("user_id");
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

