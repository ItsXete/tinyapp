// SETUP

const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session'); // Manage cookies securely
const bcrypt = require("bcryptjs"); // Hashing password before storing
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helpers'); // Helper function

// Parse URL & session setup
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1-secret', 'key2-secret', 'key3-secret'],
  maxAge: 24 * 60 * 60 * 1000
}));
app.set("view engine", "ejs");

// -------------- urlDatabase --------------

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
};

// Users database

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10), // hashed password
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10), // hashed password
  },
};

// GET

app.get("/", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    return res.redirect("/urls");
  } else {
    return res.redirect("/login");
  }
}); // Re-direct handler

app.get("/login", (req, res) => {
  const user = users[req.session.user_id] || null;
  res.render("login", { error: null, user });
}); // Login error handler


app.get("/register", (req, res) => {
  const user = users[req.session.user_id] || null;
  if (user) return res.redirect("/urls");
  res.render("register", { user, error: null });  // <-- MUST ALWAYS PASS USER!!
}); // Handle login, registration & re-direct

app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) return res.status(401).send("<h2>Please log in or register to view URLs.</h2>");

  const userURLs = urlsForUser(user_id, urlDatabase);
  const templateVars = { user, urls: userURLs };
  res.render("urls_index", templateVars);
}); // Login display

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) return res.redirect("/login");

  res.render("urls_new", { user });
}); // Create new URL form

app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  const urlData = urlDatabase[req.params.id];

  if (!user) return res.status(401).send('<h1>Please log in to view this URL</h1>');
  if (!urlData) return res.status(404).send('<h1>This URL does not exist</h1>');
  if (urlData.userID !== user_id) return res.status(403).send('<h1>You do not have permission to view this URL</h1>');

  const templateVars = { id: req.params.id, longURL: urlData.longURL, user };
  res.render("urls_show", templateVars);
}); // Show short URL

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) return res.status(404).send("<h2>URL not found</h2>");
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
}); // Return error

// -------------- POST --------------

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) return res.status(403).render("login", { error: "No user with that email found.", user: null });
  if (!bcrypt.compareSync(password, user.password)) return res.status(403).render("login", { error: "Incorrect password.", user: null });

  req.session.user_id = user.id;
  res.redirect("/urls");
}); // Login form submission handler 

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
}); // Logout sessions

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const user = users[req.session.user_id] || null;

  if (!email || !password) {
    return res.status(400).render("register", { user, error: "Email and password cannot be blank." });
  }

  if (getUserByEmail(email, users)) {
    return res.status(400).render("register", { user, error: "A user with that email already exists." });
  }

  const userID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = { id: userID, email, password: hashedPassword };
  users[userID] = newUser;

  req.session.user_id = userID;
  res.redirect("/urls");
}); // Register handler

app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) return res.status(401).send("<h2>You must be logged in to shorten URLs.</h2>");

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = { longURL, userID: user_id };
  res.redirect(`/urls/${shortURL}`);
}); // New short URL handler

app.post('/urls/:id', (req, res) => {
  const user_id = req.session.user_id;
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  const urlEntry = urlDatabase[id];

  if (!urlEntry) return res.status(404).send("<h2>URL not found.</h2>");
  if (!user_id) return res.status(401).send("<h2>Please log in to edit URLs.</h2>");
  if (urlEntry.userID !== user_id) return res.status(403).send("<h2>You do not have permission to edit this URL.</h2>");

  urlDatabase[id].longURL = newLongURL;
  res.redirect('/urls');
}); // Edit & URL handler for short URL

app.post('/urls/:id/delete', (req, res) => {
  const user_id = req.session.user_id;
  const id = req.params.id;
  const urlEntry = urlDatabase[id];

  if (!urlEntry) return res.status(404).send("<h2>URL not found.</h2>");
  if (!user_id) return res.status(401).send("<h2>Please log in to delete URLs.</h2>");
  if (urlEntry.userID !== user_id) return res.status(403).send("<h2>You do not have permission to delete this URL.</h2>");

  delete urlDatabase[id];
  res.redirect('/urls');
}); // Check for short URL

// -------------- SERVER CONTROL --------------

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
