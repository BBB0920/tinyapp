const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs")

function generateRandomString() {
  let alphaNumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';

  function randomNumberGenerator() {
    return Math.floor(Math.random() * alphaNumeric.length);
  };

  for (let i = 0; i < 6; i++) {
    randomString += alphaNumeric.charAt(randomNumberGenerator());
  }

  return randomString;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;
  res.redirect(`/urls/${shortUrl}`); 
});

app.post("/urls/:id/delete", (req, res) => {
  const shortUrl = req.params.id;
  delete urlDatabase[shortUrl];
  res.redirect(`/urls`);
})

app.get("/urls/:id", (req, res) => {
  const shortUrl = req.params.id;
  const templateVars = { id: shortUrl, longURL: urlDatabase[shortUrl] };
  res.render("urls_show", templateVars);
})

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});