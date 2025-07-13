// src/index.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import authRouter from './routes/auth.routes.ts';
import appRouter from './routes/app.routes.ts';

const app = express();
const PORT = process.env.PORT || 8888;

app.set('view engine', 'ejs');
app.set('views', './src/views');

app.use(express.static('./src/public'));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(authRouter);
app.use(appRouter);

// ★ 変更点：ここの app.get('/') は削除済み

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});