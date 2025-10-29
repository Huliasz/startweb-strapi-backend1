// src/api/test-hook/content-types/test-hook/lifecycles.js
// src/api/submission/content-types/submission/lifecycles.js
console.log("--- Loading lifecycles.js for Submission ---"); // Log during server start

module.exports = {
  async beforeCreate(event) {
    console.log("--- beforeCreate triggered ---"); // Log before saving
  },
  async afterCreate(event) {
    console.log("--- afterCreate triggered ---"); // Log after saving
    // Temporarily comment out all email sending logic
    /*
    const { result } = event;
    console.log("Submission data:", result);
    // ... rest of your email code ...
    */
  },
};
