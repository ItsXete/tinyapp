// helpers.js
const getUserByEmail = function(email, database) {
  for (const userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return null;
};

const urlsForUser = function(userId, urlDatabase) {
  const filteredURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userId) {
      filteredURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredURLs;
};

const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

module.exports = { getUserByEmail, urlsForUser, generateRandomString };
