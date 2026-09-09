const storageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const storageSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
};
