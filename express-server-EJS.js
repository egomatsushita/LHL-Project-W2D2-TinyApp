const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// Database that stores short and long urls
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "s9m5xK": "http://www.google.com"
};

// Print message to root
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Print message to hello directory
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n")
});

// Index page
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };

  res.render("urls-index", templateVars);
});

// Generate new short url
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
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
    username: req.cookies["username"]
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
  const body = req.body;

  res.cookie("username", body.username);
  res.redirect("/urls");
});

// Logout route
app.post("/logout", (req,res) => {
  const body = req.body;

  res.clearCookie("username");
  res.redirect("/urls");
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

