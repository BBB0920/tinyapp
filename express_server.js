const express = require("express");
//  var cookieParser = require('cookie-parser')
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');  //encrypt cookie - need to do npm install cookie-session --save
const PORT = 8080; // default port 8080
const app = express();

//  config
app.set("view engine", "ejs")

//  middleware
app.use(express.urlencoded({ extended: false })); // changed from true to false when using cookieSession insetad of cookieParser
app.use(cookieSession({
  name: 'cookiemonster',
  keys: ['hfy843hfhdsakfytdsaghfbad43q46', 'fhdjak4728946fa6df8sdhffa646']
}));

//app.use(cookieParser());  // No longer using it after using cookie-session

// Dependencies up to this point
// ===============================================================================

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
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com"

};

// Data storage for users who access the webpage
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

// function that returns URLs that belongs to that user
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
// hashed! 
function passwordCheck(email, pw) {

  for (let i in users) {
    if (users[i].email === email) {
      return bcrypt.compareSync(pw, users[i].password);
    }
  }
  return false;
}

// Features start here! 
// ====================================================================================

// Sign up for account using email and password
// Hashed!
// Cookie has been encrypted! 
app.post("/register", (req, res) => {
  const newId = generateRandomString(); 
  let email = req.body.email;
  let pw = req.body.password;
  let hpw = bcrypt.hashSync(pw, 10);

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
    password: hpw,
  }

  //res.cookie('user_id', newId);
  req.session.user_id = newId;
  res.redirect('/urls');
})


// Accesses /register
app.get("/register", (req, res) => {
  // const userId = req.cookies['user_id'];
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

// Displays login page
app.get("/login", (req, res) => {
  // const userId = req.cookies['user_id'];
  const userId = req.session.user_id;

  if (userId) {
    res.redirect('/urls');
    return;
  }
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
    if (!passwordCheck(email, pw)) {
      res.status(403).send('That password is incorrect');
    } else {

      for (let i in users) {
        if(email === users[i].email) {
          req.session.user_id = i;
          // res.cookie('user_id', i);
        }
      }
      res.redirect('/urls');
    }
  }
})

// logging out and clearing cookie of the previously signed in acc
app.post('/logout', (req, res) => {
  // res.clearCookie('user_id');
  req.session = null;   // This is how you clear cookie with cookieSession
  res.redirect('/login');
})

// List of available shortURL and its corresponding longURL, along with features available
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!userId) {
    res.status(401).send('This feature is only available to registered users. Please login!');
    return;
  }

  const templateVars = { 
    urls: urlsForUser(userId),  // Solved
    user: user,
  };

  res.render("urls_index", templateVars);
})

// Displays all the shortURL and its corresponding longURL
// Fixed!
app.post("/urls", (req, res) => {

  const userId = req.session.user_id;
  const user = users[userId];

  console.log(req.body); // Log the POST request body to the console
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

// Add new longURL 
// Fixed!
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

// Delete existing entry in the Database
// Fixed!
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;

  const userId = req.session.user_id;

  let obj = urlsForUser(userId);

  if(!obj.hasOwnProperty(shortURL)) {
    res.status(401).send('You do not own this URL!');
  };

  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
})

// Edit existing URL to a different one based on user input
// Fixed! 
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

// Assigns new longURL to shortURL  
// Fixed! 
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

// Transferring from shortURL to longURL
// Fixed! 
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