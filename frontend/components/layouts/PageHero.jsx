export default function PageHero({
  eyebrow,
  titleAccent,
  title,
  description,
  actions = null,
  aside = null,
  className = "",
}) {
  return (
    <section className={`relative overflow-hidden px-1 py-2 md:px-0 md:py-3 ${className}`}>
      <div className="absolute left-0 top-0 h-1 w-32 rounded-full bg-emerald-500/50" />

      <div className={`relative grid gap-6 ${aside ? "xl:grid-cols-[minmax(0,1.3fr)_340px]" : ""}`}>
        <div>
          {eyebrow ? <p className="site-kicker">{eyebrow}</p> : null}
          <h1 className="site-title mt-4">
            {titleAccent && <span className="text-emerald-600">{titleAccent} </span>}
            {title}
          </h1>
          {description ? <p className="site-lead mt-4">{description}</p> : null}
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        {aside ? (
          <div className="site-panel border shadow-md p-5 bg-white/50 backdrop-blur-sm">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
