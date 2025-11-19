export default function Unsubscribe() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");

  return (
    <div className="p-10 text-center">
      {status === "success" && <h1>已成功取消訂閱</h1>}
      {status === "not_found" && <h1>找不到此訂閱資料</h1>}
      {status === "error" && <h1>取消訂閱失敗，請稍後再試</h1>}
    </div>
  );
}
