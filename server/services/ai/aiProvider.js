class AIProvider {
  async generate() {
    throw new Error(
      "AIProvider.generate() must be implemented."
    );
  }
}

module.exports = AIProvider;