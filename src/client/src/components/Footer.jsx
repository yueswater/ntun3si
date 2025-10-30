export default function Footer() {
  return (
    <footer className="footer bg-base-200 text-base-content px-16 py-10 flex flex-wrap justify-center gap-x-16 gap-y-8">
      <nav>
        <h6 className="footer-title">社團服務</h6>
        <a className="link link-hover">活動公告</a>
        <a className="link link-hover">投稿專區</a>
        <a className="link link-hover">會員制度</a>
      </nav>

      <nav>
        <h6 className="footer-title">關於我們</h6>
        <a className="link link-hover">社團介紹</a>
        <a className="link link-hover">聯絡我們</a>
        <a className="link link-hover">合作夥伴</a>
      </nav>

      <nav>
        <h6 className="footer-title">政策與條款</h6>
        <a className="link link-hover">使用條款</a>
        <a className="link link-hover">隱私政策</a>
      </nav>

      <form className="sm:ml-8">
        <h6 className="footer-title">電子報</h6>
        <label className="label">
          <span className="label-text">訂閱我們的電子報</span>
        </label>
        <fieldset className="join">
          <input
            type="text"
            placeholder="your@email.com"
            className="input input-bordered join-item rounded-xl"
          />
          <button className="btn btn-primary join-item rounded-xl">訂閱</button>
        </fieldset>
      </form>
    </footer>
  );
}
