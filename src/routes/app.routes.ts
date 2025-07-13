// src/routes/app.routes.ts
import { Router } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import express from 'express';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const prisma = new PrismaClient();
const router = Router();

router.use((req, res, next) => {
  // @ts-ignore
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
});

// ★ 変更点：ダッシュボード用のデータ取得処理を追加
router.get('/', async (req, res) => {
  // @ts-ignore
  const userId = req.session.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const recentMemos = await prisma.memo.findMany({
      where: {
        location: {
          userId: userId,
        },
      },
      take: 5, // 最新5件を取得
      orderBy: {
        visitedAt: 'desc',
      },
      include: {
        location: true, // 関連する場所の情報も取得
      },
    });

    res.render('dashboard', { user: user, recentMemos: recentMemos });
  } catch (error) {
    console.error(error);
    res.redirect('/login');
  }
});

// GET /map (マップページ)
router.get('/map', async (req, res) => {
  // @ts-ignore
  const userId = req.session.userId;
  const locations = await prisma.location.findMany({
    where: { userId: userId },
  });
  res.render('map', { locations: locations });
});

// POST /locations (新しい場所を追加する)
router.post('/locations', express.json(), async (req, res) => {
  const { latitude, longitude, name } = req.body;
  // @ts-ignore
  const userId = req.session.userId;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: '緯度経度が必要です' });
  }

  try {
    const newLocation = await prisma.location.create({
      data: {
        name: name || '新しい場所',
        latitude: latitude,
        longitude: longitude,
        userId: userId,
      },
    });
    res.status(201).json(newLocation);
  } catch (error) {
    res.status(500).json({ error: '場所の作成に失敗しました' });
  }
});

// メモページ表示用のルート
router.get('/locations/:id/memo', async (req, res) => {
  const locationId = parseInt(req.params.id, 10);
  if (isNaN(locationId)) {
    return res.status(400).send('Invalid ID');
  }

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      memos: {
        orderBy: {
          visitedAt: 'desc'
        }
      }
    }
  });

  if (!location) {
    return res.status(404).send('場所が見つかりませんでした。');
  }

  // @ts-ignore
  if (location.userId !== req.session.userId) {
    return res.status(403).send('アクセスが許可されていません。');
  }

  res.render('memo', { location: location });
});

// メモ追加ルート
router.post('/locations/:id/memos', upload.single('image'), async (req, res) => {
  const locationId = parseInt(req.params.id, 10);
  const { title, price, body, visitedAt } = req.body;

  if (!title || !visitedAt) {
    return res.redirect(`/locations/${locationId}/memo`);
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await prisma.memo.create({
      data: {
        title: title,
        price: price ? parseInt(price, 10) : null,
        body: body,
        visitedAt: new Date(visitedAt),
        imageUrl: imageUrl,
        locationId: locationId,
      }
    });
    res.redirect(`/locations/${locationId}/memo`);
  } catch (error) {
    console.error(error);
    res.redirect(`/locations/${locationId}/memo`);
  }
});

// ★ 変更点：場所（ピン）を削除するためのルート
router.post('/locations/:id/delete', async (req, res) => {
  const locationId = parseInt(req.params.id, 10);
  // @ts-ignore
  const userId = req.session.userId;

  try {
    // 削除しようとしている場所が、本当にログイン中のユーザーのものか確認
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId: userId,
      },
    });

    if (location) {
      // 所有者であることが確認できたら削除
      await prisma.location.delete({
        where: { id: locationId },
      });
      res.json({ success: true, message: '場所を削除しました。' });
    } else {
      // 所有者でない、または場所が存在しない
      res.status(403).json({ success: false, message: '削除する権限がありません。' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '削除中にエラーが発生しました。' });
  }
});

// ★ 変更点：メモを削除するためのルート
router.post('/memos/:id/delete', async (req, res) => {
  const memoId = parseInt(req.params.id, 10);
  const locationId = req.body.locationId; // どの場所のメモかを判断するために使用
  // @ts-ignore
  const userId = req.session.userId;

  try {
    // 削除しようとしているメモが、本当にログイン中のユーザーのものか（場所の所有者か）を確認
    const memo = await prisma.memo.findFirst({
      where: {
        id: memoId,
        location: {
          userId: userId,
        },
      },
    });

    if (memo) {
      // 所有者であることが確認できたら削除
      await prisma.memo.delete({
        where: { id: memoId },
      });
    }
    // 成功・失敗に関わらず、元のメモページにリダイレクト
    res.redirect(`/locations/${locationId}/memo`);
  } catch (error) {
    res.redirect(`/locations/${locationId}/memo`);
  }
});

export default router;
