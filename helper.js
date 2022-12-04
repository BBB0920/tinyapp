// Look up whether email already exists within the users data storage
function getUserByEmail(email, database) {
  for (let i in database) {
    if(email === database[i].email) {
      return true;
    }
  }
  return false;
}

module.exports = getUserByEmail; 