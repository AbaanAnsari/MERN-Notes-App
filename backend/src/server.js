import express from "express";

import cors from "cors";
import dotenv from "dotenv";
import path from "path"
import jwt from "jsonwebtoken"

import notesRoute from "./Route/notesRoute.js";
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/ratelimiter.js";
import User from "./models/User.js"
import authenticateToken from "./utilities.js";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve()




//middlewares
if (process.env.NODE_ENV !== "production") {
    app.use(cors({
    origin: "http://localhost:5173",
    allowedHeaders: ["Content-Type", "Authorization"],
}));

}

app.use(express.json());
app.use(rateLimiter);

//Create Account
app.post("/create-account", async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName) {
        return res.status(400).json({ error: true, message: "Full Name is required" });
    }
    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }
    if (!password) {
        return res.status(400).json({ error: true, message: "Password is required" });
    }

    const isUser = await User.findOne({ email: email });

    if (isUser) {
        return res.json({
            error: true,
            message: "User already exist"
        })
    }

    const user = new User({
        fullName,
        email,
        password,
    });

    await user.save();

    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SCRIPT,
        { expiresIn: "30m" }
    );

    return res.json({
        error: false,
        user,
        accessToken,
        message: "Registeration Successfull"
    })
});

//Login Account
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }
    if (!password) {
        return res.status(400).json({ error: true, message: "Password is required" });
    }

    const userInfo = await User.findOne({ email: email });

    if (!userInfo) {
        return res.status(400).json({ message: "User not found" })
    }

    if (userInfo.email == email && userInfo.password == password) {
        const user = { user: userInfo };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SCRIPT, {
            expiresIn: "36000m"
        });

        return res.json({
            error: false,
            message: "Login Successfull",
            email,
            accessToken,
        })
    } else {
        return res.status(400).json({
            error: true,
            message: "Invalid Credentials"

        })
    }

})

//Get User
app.get("/get-user", authenticateToken, async (req, res) => {
    const { user } = req.user;

    const isUser = await User.findOne({ _id: user._id });

    if (!isUser) {
        return res.status(401);
    }

    return res.json({
        user: {fullName: isUser.fullName, email: isUser.email, password: isUser.password},
        message: "",
    });
});


//routes
app.use("/api/notes",authenticateToken, notesRoute);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")))

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"))
    })
}

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is running on port :", PORT)
    });
});