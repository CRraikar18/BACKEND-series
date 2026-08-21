// the agenda of this code is to use of our own created error class
class ApiError extends Error {
    // extends because i am inheriting from Error class
    constructor(
        statusCode, 
        message = "Something went wrong", 
        errors = [], 
        stack = ""
    ) {
        super(message)
        this.statusCode = statusCode 
        this.data = null
        this.message = message
        this.success = false 
        this.errors = errors 
// creating stack here beczz this error class is created by me 
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export default ApiError
