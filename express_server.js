const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
};

const getUserByEmail = (email, usersDB) => {
  for (const userId in usersDB) {
    if (usersDB[userId].email === email) {
      return usersDB[userId];
    }
  }
  return null;
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

  if (!user) {
    return res.redirect("/login");
  }

  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send("<html><body><h2>URL not found</h2></body></html>");
  }

  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

app.get("/urls/:id", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  
  if (!user) {
    return res.status(401).send('<html><body><h1>Please log in to view this URL</h1></body></html>');
  }
  
  const urlData = urlDatabase[req.params.id];

  if (!urlData) {
    return res.status(404).send('<html><body><h1>This URL does not exist</h1></body></html>');
  }

  if (urlData.userID !== user_id) {
    return res.status(403).send('<html><body><h1>You do not have permission to view this URL</h1></body></html>');
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlData.longURL,
    user,
  };

  res.render("urls_show", templateVars);
});

app.post('/urls/:id/delete', (req, res) => {
  const user_id = req.cookies.user_id;
  const id = req.params.id;

  const urlEntry = urlDatabase[id];

  if (!urlEntry) {
    return res.status(404).send("<html><body><h2>URL not found.</h2></body></html>");
  }

  if (!user_id) {
    return res.status(401).send("<html><body><h2>Please log in to delete URLs.</h2></body></html>");
  }

  if (urlEntry.userID !== user_id) {
    return res.status(403).send("<html><body><h2>You do not have permission to delete this URL.</h2></body></html>");
  }

  delete urlDatabase[id];

  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  const user_id = req.cookies.user_id;
  const id = req.params.id;
  const newLongURL = req.body.longURL;

  const urlEntry = urlDatabase[id];

  if (!urlEntry) {
    return res.status(404).send("<html><body><h2>URL not found.</h2></body></html>");
  }

  if (!user_id) {
    return res.status(401).send("<html><body><h2>Please log in to edit URLs.</h2></body></html>");
  }

  if (urlEntry.userID !== user_id) {
    return res.status(403).send("<html><body><h2>You do not have permission to edit this URL.</h2></body></html>");
  }

  urlDatabase[id].longURL = newLongURL;

  res.redirect('/urls');
});


app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send("No user with that email found.");
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Incorrect password.");
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];

  if (!user) {
    return res.status(401).send("<html><body><h2>Please log in or register to view URLs.</h2></body></html>");
  }

  const userURLs = urlsForUser(user_id);

  const templateVars = {
    user,
    urls: userURLs
  };

  res.render("urls_index", templateVars);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const user_id = req.cookies.user_id;

  if (users[user_id]) {
    return res.redirect("/urls");
  }

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

  if (!email || !password) {
    return res.status(400).send("Email and password cannot be blank.");
  }

  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res.status(400).send("A user with that email already exists.");
  }

  const userID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    id: userID,
    email,
    password: hashedPassword,
  };

  users[userID] = newUser;
  res.cookie("user_id", userID);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];

  if (!user) {
    return res.status(401).send("<html><body><h2>You must be logged in to shorten URLs.</h2></body></html>");
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);
});

const urlsForUser = (id) => {
  const filteredURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      filteredURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredURLs;
};