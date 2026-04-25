// app/privacy/page.tsx
export default function PrivacyPage() {
  const linkClass =
    'underline underline-offset-2 decoration-[var(--input-border)] hover:decoration-[var(--text)] hover:text-[var(--text)] transition-colors duration-150';

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-10">
      <article className="w-full max-w-3xl flex flex-col">
        <header className="flex flex-col gap-2 mb-8">
          <h1 className="font-handwriting-cn text-3xl md:text-4xl text-[var(--text)]">
            隐私说明
          </h1>
          <p className="text-xs text-[var(--text-muted)]">最后更新：2026-04-25</p>
        </header>

        <h2 className="font-handwriting-cn text-xl text-[var(--text)] mt-6 mb-3">
          我存什么
        </h2>
        <ul className="list-disc ml-5 space-y-1 text-[var(--text)] leading-relaxed mb-3">
          <li>你写下的担心原文（30 天后自动删除）</li>
          <li>AI 从原文里提取的分类结果（长期保留，这是你的证据库）</li>
          <li>你回来以后的 emoji 反馈 + 一句话（长期保留）</li>
          <li>如果你留了邮箱：邮箱本身，用来发事后验证提醒</li>
        </ul>

        <h2 className="font-handwriting-cn text-xl text-[var(--text)] mt-6 mb-3">
          我不存什么
        </h2>
        <ul className="list-disc ml-5 space-y-1 text-[var(--text)] leading-relaxed mb-3">
          <li>你的身份 —— 没有账号，只有浏览器指纹（换设备就是新身份）</li>
          <li>你的输入草稿 —— 只在你本机浏览器里，不会发到服务器</li>
          <li>任何第三方分析 / 追踪工具</li>
        </ul>

        <h2 className="font-handwriting-cn text-xl text-[var(--text)] mt-6 mb-3">
          AI 厂商
        </h2>
        <p className="text-[var(--text)] leading-relaxed mb-3">
          解码过程调用 Anthropic Claude API。Anthropic 的默认政策是{' '}
          <a
            href="https://privacy.anthropic.com/en/articles/7996868-is-my-data-used-for-model-training"
            className={linkClass}
          >
            不用 API 数据训练模型
          </a>
          。除 Anthropic 外，没有其他 AI 供应商接触你的担心内容。
        </p>

        <h2 className="font-handwriting-cn text-xl text-[var(--text)] mt-6 mb-3">
          你怎么管理
        </h2>
        <p className="text-[var(--text)] leading-relaxed mb-3">
          任何时候打开{' '}
          <a href="/settings/data" className={linkClass}>
            数据管理页
          </a>
          ，可以查看当前浏览器存了什么、导出所有数据、或一键删除。删除不可撤销。
        </p>

        <h2 className="font-handwriting-cn text-xl text-[var(--text)] mt-6 mb-3">
          如果你想联系我
        </h2>
        <p className="text-[var(--text)] leading-relaxed mb-3">
          关于隐私的任何问题，邮件到 wuyifei0208@gmail.com。
        </p>

        <a href="/" className={`block mt-10 text-sm text-[var(--text-muted)] ${linkClass}`}>
          ← 回到首页
        </a>
      </article>
    </main>
  );
}
