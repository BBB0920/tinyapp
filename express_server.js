//Submission Copy
//ESlint was not used as I wanted to practice 

// Dependencies for the codes

const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');  
const PORT = 8080; 
const app = express();

const getUserByEmail = require('./helpers');

//  config
app.set("view engine", "ejs")

//  middleware
app.use(express.urlencoded({ extended: false })); 
app.use(cookieSession({
  name: 'cookiemonster',
  keys: ['hfy843hfhdsakfytdsaghfbad43q46', 'fhdjak4728946fa6df8sdhffa646']
}));
// ===============================================================================================
// Functions and Databases

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
let urlDatabase = {

  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "111111",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "222222",
  },
  "gggggg": {
    longURL: "http://www.gmail.com", 
    userID: "111111",
  }
};

// Initial data storage
const users = {
  "111111": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$.UAc3RxtIlUeyHIPfecuBeGpIhGAL4DJ49vOiuY3GRFhCBqtBYtY6", // Hash for 123456
  },
  "222222": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$8G99V6buGoyrA1xIz1tboO0ivieqV2WLajMSYppN2LqIl5hRIoLKq", // Hash for abcdef
  },
};

// Function that returns URLs that belongs to that user
function urlsForUser(id)  {
  let ownURL = {};
  for (let i in urlDatabase) {
    if (id === urlDatabase[i].userID) {
      ownURL[i] = {
        longURL: "",
      };
      ownURL[i].longURL = urlDatabase[i].longURL;
    }
  }
  return ownURL;
}

// Look up whether password matches with what is stored within users data storage
function passwordCheck(email, pw) {
  for (let i in users) {
    if (users[i].email === email) {
      return bcrypt.compareSync(pw, users[i].password);
    }
  }
  return false;
}

// ===============================================================================================
// Features

// Sign up for account using email and password, then stores that information in the database. Password is encrypted. 
app.post("/register", (req, res) => {
  const newId = generateRandomString(); 
  let email = req.body.email;
  let pw = req.body.password;
  let hpw = bcrypt.hashSync(pw, 10);

  if (email === "" || pw === "") {
    res.status(400).send('Please fill out both email and password.');
    return;
  }
  
  if (getUserByEmail(email, users)) {
    res.status(400).send('That email is unavailable.');
    return;
  }

  users[newId] = {
    id: newId,
    email: email,
    password: hpw,
  }

  req.session.user_id = newId;
  res.redirect('/urls');
})


// Accesses registration page - can only be accessed if not logged in, otherwise redirected to /urls
app.get ("/register", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  const templateVars = { 
    user: user,
  };

  if (userId) {
    res.redirect('/urls');
    return;
  }

  res.render("urls_regis", templateVars);

})

// Displays login page - can only be accessed if not logged in, otherwise redirected to /urls
app.get("/login", (req, res) => {
  const userId = req.session.user_id;

  if (userId) {
    res.redirect('/urls');
    return;
  }

  res.render("urls_login");

})

// Login validation - if email/password combination is missing or not correct, appropriate messages are displayed. 
// Encrypted cookie is generated
app.post("/login", (req, res) => {
  let email = req.body.email;   
  let pw = req.body.password; 

  if (!getUserByEmail(email, users)) {
    res.status(403).send('That email cannot be found.');
    return;
  } else {
    if (!passwordCheck(email, pw)) {
      res.status(403).send('That password is incorrect');
    } else {

      for (let i in users) {
        if (email === users[i].email) {
          req.session.user_id = i;
        }
      }
      res.redirect('/urls');
    }
  }
})

// Logs out - cookie is cleared
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
})

// List of available shortURL and its corresponding longURL, along with features available. Is only visible if logged in. 
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!userId) {
    res.status(401).send('This feature is only available to registered users. Please login!');
    return;
  }

  const templateVars = { 
    urls: urlsForUser(userId),
    user: user,
  };

  res.render("urls_index", templateVars);
})

// Creates a new shortURL. Can only be used while logged in. 
app.post("/urls", (req, res) => {

  const userId = req.session.user_id;
  const user = users[userId];

  if (!userId) {
    res.status(401).send('This feature is only available to registered users. Please login!');
    return;
  }

  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userId, 
  };

  const templateVars = { 
    user: user,
  };

  res.redirect(`/urls/${shortURL}`); 
});

// Directs to a page that will generate new shortURL. Can only be used while logged in. 
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!userId) {
    return res.redirect('/login');
  }
  
  const templateVars = { 
    urls: urlDatabase,
    user: user,
  };

  res.render("urls_new", templateVars);
});

// Delete existing shortURL and related data in the Database. The data must belong to the logged in user to be deleted. 
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;

  const userId = req.session.user_id;

  if (!userId) {
    return res.redirect('/login');
  }

  let obj = urlsForUser(userId);

  if(!obj.hasOwnProperty(shortURL)) {
    res.status(401).send('You do not own this URL!');
  };

  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
})

// Assigns a new longURL to shortURL. The shortURL must belong to the logged in user to be edited 
app.post("/urls/:id/newUrl", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const newUrl = req.body.newUrl;

  let obj = urlsForUser(userId);

  if(!obj.hasOwnProperty(shortURL)) {
    res.status(401).send('You do not own this URL!');
  };

  urlDatabase[shortURL].longURL = newUrl;

  res.redirect(`/urls`);
})

// Returns a page with shortURL. The shortURL must belong to the logged in user to be edited.
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;

  const userId = req.session.user_id;
  const user = users[userId];

  if (!userId) {
    res.status(401).send('This feature is only available to registered users. Please login!');
    return;
  }

  let obj = urlsForUser(userId);
  let present = 0;

  for (let i in obj) {
    if (i === shortURL) {
      present++;
    }
  }

  if (present === 0) {
    res.status(401).send('You do not own this URL!');
  }

  const templateVars = { 
    id: shortURL, 
    longURL: urlDatabase[shortURL].longURL,
    user: user,
  };

  res.render("urls_show", templateVars);
})

// Redirects user to longURL through shortURL. 
app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;

  if (!longURL) {
    res.status(400).send(`The short URL ID ${shortURL} does not exist.`);
    return;
  }

  res.redirect(longURL);
})

// Homepage, greets with Hello
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase[req.cookies['user_id']]);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});