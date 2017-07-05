const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "s9m5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n")
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase};
  res.render("urls-index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls-new");
});

app.post("/urls", (req, res) => {
  let returnedInput = req.body;
  let short_URL = generateRandomString();
  let long_URL = `http://${returnedInput.longURL}`;

  // Update urlDatabase with user's url input and a random short url generated
  urlDatabase[short_URL] = long_URL;

  res.redirect(`http://localhost:8080/urls/${short_URL}`);
})

app.post("/urls/:id/delete", (req, res) => {
  let short_URL = req.params.id;
  delete urlDatabase[short_URL];
  res.redirect(`http://localhost:8080/urls`);
});

app.get("/urls/:id", (req, res) => {
  const aLongURL = urlDatabase[req.params.id];
  let templateVars = { shortURL: req.params.id, longURL: aLongURL };
  res.render("urls-show", templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  const short_URL = req.params.shortURL;
  let long_URL = urlDatabase[short_URL];
  res.redirect(long_URL);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});


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

