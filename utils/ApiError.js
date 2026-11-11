/**
 * Error with an HTTP status code, thrown by controllers and
 * turned into a JSON response by the central error handler.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

module.exports = ApiError;
