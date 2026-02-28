const version = {
  MAJOR: 1,
  MINOR: 1,
  PATCH: 2,
  toString() {
    return `${this.MAJOR}.${this.MINOR}.${this.PATCH}`;
  }
};

export default version;