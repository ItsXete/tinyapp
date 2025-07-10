const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];

  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL not found");
  }
});

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = { id, longURL };
  res.render("urls_show", templateVars);
});

app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls'); 
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;

  if (urlDatabase[id]) {
    urlDatabase[id] = newLongURL;
  }

  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];

  const templateVars = {
    user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// Store users in the app
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

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // Check for empty email or password
  if (!email || !password) {
    return res.status(400).send("Email and password cannot be blank.");
  }

  // Check if email already exists
  for (const userId in users) {
    if (users[userId].email === email) {
      return res.status(400).send("A user with that email already exists.");
    }
  }

  // Generate a new user ID
  const userID = generateRandomString();

  // Create and store new user
  const newUser = {
    id: userID,
    email,
    password,
  };

  users[userID] = newUser;

  // Set a cookie with the user's ID
  res.cookie("user_id", userID);

  // Log users object to verify
  console.log("Updated users object:", users);

  // Redirect to /urls
  res.redirect("/urls");
});