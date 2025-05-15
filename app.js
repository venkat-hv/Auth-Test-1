const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config({ path: ".env.staging" });

const app = express();
const PORT = 4000;

const AUTH_SERVER = process.env.AUTH_SERVER;
const HOST = process.env.HOST;
JWT_SECRET = process.env.JWT_SECRET;

// Middleware (SESSION, COOKIES)
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

async function auth1(req, res, next) {
  try {
    const token = req.cookies["auth_token"];
    let user;
    if (!token) {
      const redirect = `${AUTH_SERVER}/auth/google?redirect=${HOST}/dashboard`;
      return res.redirect(redirect);
    } else {
      try {
        const response = await axios.get(`${AUTH_SERVER}/me`, {
          headers: {
            Cookie: `auth_token=${token}`,
          },
        });
        user = response.data.user;
      } catch (error) {
        console.log("Token Expired. Redirecting to Auth Server");
        const redirect = `${AUTH_SERVER}/auth/google?redirect=${HOST}/dashboard`;
        return res.redirect(redirect);
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("ERROR in auth1: ", error);
    return res.status(500).json({ message: error.message });
  }
}

async function auth2(req, res, next) {
  try {
    const token = req.cookies["auth_token"];

    let user;
    if (!token) {
      const redirect = `${AUTH_SERVER}/auth/google?redirect=${HOST}/dashboard`;
      return res.redirect(redirect);
    } else {
      try {
        user = jwt.verify(token, JWT_SECRET); // Needs shared secret
      } catch (error) {
        console.log("Token Expired. Redirecting to Auth Server");
        const redirect = `${AUTH_SERVER}/auth/google?redirect=${HOST}/dashboard`;
        return res.redirect(redirect);
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("ERROR in auth2: ", error);
    return res.status(500).json({ message: error.message });
  }
}

app.get("/", (req, res) => {
  res.send(
    '<h1>Welcome to the Client App</h1><a href="/dashboard">Go to Dashboard</a>'
  );
});

app.get("/dashboard", auth1, async (req, res) => {
  try {
    const user = req.user;
    res.send(
      `<h2>Welcome, ${user.name}</h2><p>Email: ${user.email}</p><br/><p>Email: ${user.role}</p><a href="/logout">Logout</a>`
    );
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("auth_token");

  return res.redirect(`${AUTH_SERVER}/auth/logout?redirect=${HOST}/`);
});

app.listen(PORT, () => console.log("Client running on port: ", PORT));
