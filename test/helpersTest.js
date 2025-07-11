const { assert } = require('chai');
const { urlsForUser } = require('../helpers.js'); // Adjust path if needed

describe('urlsForUser', function() {
  const urlDatabase = {
    "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: "user1" },
    "9sm5xK": { longURL: "http://www.google.com", userId: "user2" },
    "a1b2c3": { longURL: "http://www.example.com", userId: "user1" }
  };

  it('should return urls that belong to the specified user', function() {
    const expectedOutput = {
      "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: "user1" },
      "a1b2c3": { longURL: "http://www.example.com", userId: "user1" }
    };
    const result = urlsForUser('user1', urlDatabase);
    assert.deepEqual(result, expectedOutput);
  });

  it('should return an empty object if the user has no urls', function() {
    const result = urlsForUser('nonexistentUser', urlDatabase);
    assert.deepEqual(result, {});
  });

  it('should return an empty object if the urlDatabase is empty', function() {
    const emptyDB = {};
    const result = urlsForUser('user1', emptyDB);
    assert.deepEqual(result, {});
  });

  it('should not return urls belonging to other users', function() {
    const result = urlsForUser('user2', urlDatabase);
    const expectedOutput = {
      "9sm5xK": { longURL: "http://www.google.com", userId: "user2" }
    };
    assert.deepEqual(result, expectedOutput);
  });
});