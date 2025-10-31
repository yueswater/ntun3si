export default function Footer() {
  return (
    <footer className="bg-base-200 text-base-content px-6 md:px-16 py-10">
      <div className="flex flex-nowrap overflow-x-auto justify-start md:justify-center gap-x-10 md:gap-x-16 px-2 scrollbar-none">
        <nav className="flex-shrink-0 space-y-2">
          <h6 className="footer-title">社團服務</h6>
          <a className="link link-hover block">活動公告</a>
          <a className="link link-hover block">投稿專區</a>
          <a className="link link-hover block">會員制度</a>
        </nav>

        <nav className="flex-shrink-0 space-y-2">
          <h6 className="footer-title">關於我們</h6>
          <a className="link link-hover block">社團介紹</a>
          <a className="link link-hover block">聯絡我們</a>
          <a className="link link-hover block">合作夥伴</a>
        </nav>

        <nav className="flex-shrink-0 space-y-2">
          <h6 className="footer-title">政策與條款</h6>
          <a className="link link-hover block">使用條款</a>
          <a className="link link-hover block">隱私政策</a>
        </nav>

        <form className="flex-shrink-0 sm:ml-8 space-y-2">
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
            <button className="btn btn-primary join-item rounded-xl">
              訂閱
            </button>
          </fieldset>
        </form>
      </div>

      <div className="mt-10 text-center text-sm opacity-70">
        © {new Date().getFullYear()} NTUN3SI 國安社. All rights reserved.
      </div>
    </footer>
  );
}
