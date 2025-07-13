// src/routes/auth.routes.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { Prisma, PrismaClient } from '../generated/prisma/client'; // Prismaのエラー型をインポート

const prisma = new PrismaClient();
const router = Router();

// サインアップページの表示
router.get('/signup', (req, res) => {
  const { error } = req.query; // URLからエラーメッセージを取得
  res.render('auth/signup', { error }); // EJSに渡す
});

// サインアップ処理
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    // ★ 変更点：成功メッセージを付けてログインページへ
    res.redirect('/login?status=success');
  } catch (error) {
    // ★ 変更点：Prismaのユニーク制約エラーを判定
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // メールアドレス重複エラー
      res.redirect('/signup?error=duplicate');
    } else {
      // その他のエラー
      res.redirect('/signup?error=unknown');
    }
  }
});

// ログインページの表示
router.get('/login', (req, res) => {
  const { status, error } = req.query; // URLからメッセージを取得
  res.render('auth/login', { status, error }); // EJSに渡す
});

// ログイン処理
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && (await bcrypt.compare(password, user.password))) {
    // @ts-ignore
    req.session.userId = user.id;
    res.redirect('/');
  } else {
    // ★ 変更点：ログイン失敗メッセージを付けてログインページへ
    res.redirect('/login?error=invalid');
  }
});

// ログアウト処理
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/login');
  });
});

export default router;