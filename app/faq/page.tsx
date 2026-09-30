export const dynamic = "force-dynamic";

const QA: [string, string][] = [
  ["Will the lens fit my phone?", "Our universal clip fits the vast majority of modern smartphones. Message us with your model and we'll confirm."],
  ["What is the difference between fisheye and macro?", "Fisheye gives a wide, curved artistic look; macro focuses extremely close for tiny subjects."],
  ["How do I attach the lens?", "Center the included clip over your phone's camera and slide the lens on until it clicks."],
  ["Do you offer a guarantee?", "Yes — every lens includes a one-year quality guarantee covering manufacturing defects."],
  ["How long does shipping take?", "Orders ship tracked; most arrive within the standard regional window."],
  ["Can I use it with a case on?", "Slim cases work great. For thick rugged cases, reach out and we'll advise."],
];

export default function Faq() {
  return (
    <>
      <div className="crumbs"><a href="/">Home</a> / <b>FAQ</b></div>
      <div style={{ maxWidth: 760 }}>
        <h1 style={{ fontSize: 30, letterSpacing: "-.02em", marginBottom: 18 }}>Questions, answered</h1>
        {QA.map(([q, a], i) => (
          <details className="faqitem card" key={q} open={i === 0}>
            <summary>{q}<span>＋</span></summary><div className="a">{a}</div>
          </details>
        ))}
        <div className="card support">
          <div style={{ fontSize: 28 }}>🎧</div>
          <div style={{ flex: 1, minWidth: 200 }}><b>Still stuck?</b>
            <p style={{ fontSize: 13, color: "var(--sa-ink-soft)" }}>Support answers within one business day.</p></div>
          <a className="btn" href="/account/tickets">Open a ticket</a>
        </div>
      </div>
    </>
  );
}
