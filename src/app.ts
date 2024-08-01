import express from 'express';
import cors from 'cors';
import bodyparser from 'body-parser';
import Session from 'express-session';

// import './Auth'
// import passport from 'passport'

const app=express();
app.use(cors());
app.use(bodyparser.json());

app.use(Session({
    resave:false,
    saveUninitialized:true,
    secret:'secret'
}))

// app.use(passport.initializer());
// app.use(passport.session());

export default app;
