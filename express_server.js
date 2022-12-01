const express = require("express");
var cookieParser = require('cookie-parser')

const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs")

app.use(cookieParser());
// Dependencies up to this point

// function to generate random string with 6 alphanumeric characters

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
// Initial database containing short URL and its corresponding long URL
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Data storage for users who access the webpage
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Look up whether email already exists within the users data storage
function getUserByEmail(email) {
  for (let i in users) {
    if(email === users[i].email) {
      return true;
    }
  }
  return false;
}

// Look up whether password matches with what is stored within users data storage
function passwordCheck(pw) {
  for (let i in users) {
    if(pw === users[i].password) {
      return true;
    }
  }
  return false;
}

// Features start here! 

// Sign up for account using email and password
app.post("/register", (req, res) => {
  const newId = generateRandomString(); 
  let email = req.body.email;
  let pw = req.body.password;

  if(email === "" || pw === "") {
    res.status(400).send('Please fill out both email and password.');
    return;
  }
  
  if(getUserByEmail(email)) {
    res.status(400).send('That email is unavailable.');
    return;
  }

  users[newId] = {
    id: newId,
    email: email,
    password: pw,
  }

  res.cookie('user_id', newId);
  res.redirect('/urls');
})


// Accesses /register
app.get("/register", (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];

  const templateVars = { 
    user: user,
  };
  res.render("urls_regis", templateVars);
})

// Displays login page
app.get("/login", (req, res) => {
  res.render("urls_login");
})

// logging in and saving cookies of the info
app.post("/login", (req, res) => {

  let email = req.body.email;   
  let pw = req.body.password; 

  if(!getUserByEmail(email)) {
    res.status(403).send('That email cannot be found.');
    return;
  } else {
    if (!passwordCheck(pw)) {
      res.status(403).send('That password is incorrect');
    } else {

      for (let i in users) {
        if(email === users[i].email) {
          res.cookie('user_id', i);
        }
      }
      res.redirect('/urls');
    }
  }
})

// logging out and clearing cookie of the previously signed in acc
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
})

// List of available shortURL and its corresponding longURL, along with features available
app.get("/urls", (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];

  const templateVars = { 
    urls: urlDatabase,
    user: user,
  };

  console.log(users);

  res.render("urls_index", templateVars);
})

// Displays all the shortUrl and its corresponding longUrl
app.post("/urls", (req, res) => {
  
  const userId = req.cookies['user_id'];
  const user = users[userId];

  const templateVars = { 
    user: user,
  };

  console.log(req.body); // Log the POST request body to the console
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;
  res.redirect(`/urls/${shortUrl}`, templateVars); 
});

// Add new longURL 
app.get("/urls/new", (req, res) => {
  const userId = req.cookies['user_id'];
  const user = users[userId];

  const templateVars = { 
    user: user,

  };
  res.render("urls_new", templateVars);
});

// Delete existing entry in the Database
app.post("/urls/:id/delete", (req, res) => {
  const shortUrl = req.params.id;
  delete urlDatabase[shortUrl];
  res.redirect(`/urls`);
})

// Edit existing URL to a different one based on user input
app.post("/urls/:id/newUrl", (req, res) => {
  const shortUrl = req.params.id;
  const newUrl = req.body.newUrl;

  urlDatabase[shortUrl] = newUrl;

  res.redirect(`/urls`);
})

// Assigns new longURL to shortURL  
app.get("/urls/:id", (req, res) => {
  const shortUrl = req.params.id;
  
  const userId = req.cookies['user_id'];
  const user = users[userId];

  const templateVars = { 
    id: shortUrl, 
    longURL: urlDatabase[shortUrl],
    user: user,
  };

  res.render("urls_show", templateVars);
})

// Transferring from shortURL to longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
})

// Homepage, greets with Hello
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});