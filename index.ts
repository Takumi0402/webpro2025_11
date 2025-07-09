import express from "express";
// 生成した Prisma Client をインポート
import { PrismaClient } from "./generated/prisma/client";

const prisma = new PrismaClient({
  // 開発中は、実行されたクエリをログに表示するとデバッグに便利じゃ
  log: ["query"],
});
const app = express();

// 環境変数が設定されていれば、そこからポート番号を取得する。なければ 8888 を使う。
const PORT = process.env.PORT || 8888;

// EJS をテンプレートエンジンとして設定する
app.set("view engine", "ejs");
// EJS のテンプレートファイルが置いてあるディレクトリを指定する
app.set("views", "./views");

app.use(express.static("public"));
// フォームから送信されたデータ（例：<input name="name">）を受け取れるように設定
app.use(express.urlencoded({ extended: true }));

// ルートパス ('/') にアクセスがあったときの処理
// app.get("/", async (req, res) => {
//   // データベースから全ユーザーを取得
//   const users = await prisma.user.findMany();
//   // 'index.ejs' を使ってHTMLを生成し、'users' という名前でユーザー一覧データを渡す
//   res.render("index", { users });
// });

app.get("/", async (req, res) => {
  const shops = await prisma.shop.findMany();
  res.render("index", { shops });
});

app.post("/shops", async (req, res) => {
  const { name, type, description, latitude, longitude } = req.body;
  console.log("受け取ったデータ:", req.body);

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  await prisma.shop.create({
    data: {
      name: name,
      type: type,
      description: description,
      latitude: lat,
      longitude: lon,
    },
  });
  res.redirect("/");
});

// '/users' というパスにPOSTリクエストがあったときの処理（フォーム送信時）
app.post("/users", async (req, res) => {
  const name = req.body.name; // フォームから送信された名前を取得
  const age = req.body.age ? Number(req.body.age) : null;

  if (age !== null && isNaN(age)) {
    console.error("年齢は数値でなければありません。");
    res.status(400).send("年齢は数値でなければありません。");
    return;
  }

  if (name) {
    // データベースに新しいユーザーを作成
    const newUser = await prisma.user.create({
      data: { name, age },
    });
    console.log("新しいユーザーを追加しました:", newUser);
  }
  res.redirect("/"); // ユーザー追加後、一覧ページにリダイレクトする
});

// サーバーを起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
