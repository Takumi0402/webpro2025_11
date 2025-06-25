// httpという、Webサーバー機能を提供してくれる部品を読み込むんじゃ
import { createServer } from "node:http";
// URLを解析してくれる部品も読み込んでおく
import { URL } from "node:url";

// サーバーが動くポート番号を設定する。
// process.env.PORT というのは、外部から「このポートで動いてね」と指定されるための場所じゃ。
// もし指定がなければ、8888番ポートを使うようにしておく。
const PORT = process.env.PORT || 8888;

const server = createServer((req, res) => {
  // アクセスされたURLの情報を解析する
  const url = new URL(req.url, `http://${req.headers.host}`);

  // レスポンスのヘッダーを設定する。
  // これでブラウザに「これから送るデータはHTMLで、文字コードはUTF-8ですよ」と伝えられるんじゃ。
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  // もしアクセスされたパスが '/' なら
  if (url.pathname === "/") {
    console.log("ルートパス (/) へのアクセスがありましたぞ");
    res.statusCode = 200; // 200は「成功」を意味する番号じゃ
    res.end("こんにちは！"); // "こんにちは！"と表示して応答を完了する
    return;
  }

  // もしアクセスされたパスが '/ask' なら
  if (url.pathname === "/ask") {
    console.log("/ask パスへのアクセスがありましたぞ");
    // URLの 'q' というパラメータの値を取得する
    const question = url.searchParams.get("q") || "";
    res.statusCode = 200;
    res.end(`Your question is '${question}'`); // 受け取った質問を返信する
    return;
  }

  // 上のどちらでもないパスにアクセスされた場合
  console.log("未定義のパスへのアクセスがありました：", url.pathname);
  res.statusCode = 404; // 404は「見つかりません」という意味じゃ
  res.end("ページが見つかりません");
});

// 設定したポート番号で、サーバーからのアクセスを待ち始める
server.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しましたぞ`);
});
