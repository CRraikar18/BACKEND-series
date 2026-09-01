import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Routes import
import userRouter from "./routes/user.routes.js"
import categoryRouter from "./routes/category.routes.js"
import productRouter from "./routes/product.routes.js"
import cartRouter from "./routes/cart.routes.js"
import orderRouter from "./routes/order.routes.js"

// Routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/categories", categoryRouter)
app.use("/api/v1/products", productRouter)
app.use("/api/v1/cart", cartRouter)
app.use("/api/v1/orders", orderRouter)

// Global Error Handler Middleware (Formats all errors into structured JSON)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        statusCode,
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});

export { app }
