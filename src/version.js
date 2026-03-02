const version = {
  MAJOR: 1,
  MINOR: 1,
  PATCH: 6,
  toString() {
    return `${this.MAJOR}.${this.MINOR}.${this.PATCH}`;
  }
};

export default version;