// 生成した Prisma Client をインポートするんじゃ
import { PrismaClient } from "./generated/prisma/client";

const prisma = new PrismaClient({
  // PrismaがどんなSQLクエリを実行したか、コンソールに表示するための設定じゃ
  log: ["query"],
});

async function main() {
  // Prisma Client を使ってデータベースに接続したことを知らせる
  console.log("Prisma Client を初期化しました。");

  // まず、現在の全ユーザーを取得して表示する
  const usersBefore = await prisma.user.findMany();
  console.log("Before ユーザー一覧:", usersBefore);

  // 新しいユーザーを1件作成する
  const newUser = await prisma.user.create({
    data: {
      name: `新しいユーザー ${new Date().toISOString()}`,
    },
  });
  console.log("新しいユーザーを追加しました:", newUser);

  // 追加後にもう一度、全ユーザーを取得して表示する
  const usersAfter = await prisma.user.findMany();
  console.log("After ユーザー一覧:", usersAfter);
}

// main 関数を実行する。
main()
  .catch((e) => {
    // もし途中でエラーが起きたら、内容を表示して異常終了する
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // 最後に、必ずデータベースとの接続を切断する
    await prisma.$disconnect();
    console.log("Prisma Client を切断しました。");
  });
