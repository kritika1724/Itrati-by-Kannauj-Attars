import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { KNOWLEDGE_PAGES, KNOWLEDGE_PAGE_LIST } from '../config/knowledge'
import { applySeo, resetSeo } from '../utils/seo'

function KnowledgePage() {
  const { slug } = useParams()
  const page = KNOWLEDGE_PAGES[slug]

  useEffect(() => {
    if (!page) return undefined

    applySeo({
      title: `${page.navLabel} | ITRATI by Kannauj Attars`,
      description: page.intro,
    })

    return () => resetSeo()
  }, [page])

  if (!page) {
    return <Navigate to="/" replace />
  }

  const siblingPages = KNOWLEDGE_PAGE_LIST.filter((item) => item.slug !== page.slug)
  const imageGalleries = Array.isArray(page.imageGalleries) ? page.imageGalleries : []

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFF8EA_0%,#F6F7FB_48%,#EEE3D1_100%)] px-4 pb-16 pt-8 text-[#19213C] sm:px-6 lg:px-8 lg:pt-10">
      <div className="mx-auto w-full max-w-6xl">
        <Link to="/" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8D7667] transition hover:text-[#C9A24A]">
          ← Back to home
        </Link>

        <section className="mt-6 rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/90 p-6 shadow-[0_22px_60px_rgba(25,33,60,0.07)] sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">{page.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#19213C] sm:text-4xl lg:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-4xl text-sm leading-8 text-[#5F6475] sm:text-base">
            {page.intro}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {page.highlights.map((item) => (
              <article
                key={item}
                className="rounded-[1.5rem] border border-[rgba(201,162,74,0.18)] bg-[linear-gradient(145deg,rgba(255,250,244,0.94),rgba(255,255,255,0.88))] p-5 shadow-[0_16px_40px_rgba(25,33,60,0.05)]"
              >
                <p className="text-sm font-semibold leading-7 text-[#19213C]">{item}</p>
              </article>
            ))}
          </div>

          {Array.isArray(page.heroGallery) && page.heroGallery.length ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {page.heroGallery.map((image) => (
                <figure
                  key={image.src}
                  className="overflow-hidden rounded-[1.6rem] border border-[rgba(25,33,60,0.08)] bg-white shadow-[0_18px_45px_rgba(25,33,60,0.06)]"
                >
                  <img
                    src={image.src}
                    alt={image.alt || page.title}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 639px) 100vw, 33vw"
                    className="h-full w-full object-cover"
                  />
                </figure>
              ))}
            </div>
          ) : null}

          <div className="mt-10 grid gap-5">
            {page.sections.map((section, index) => (
              <div key={section.title} className="grid gap-5">
                <article className="rounded-[1.5rem] border border-[rgba(25,33,60,0.08)] bg-[rgba(252,249,243,0.92)] p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-[#19213C] sm:text-xl">{section.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#5F6475] sm:text-base sm:leading-8">{section.body}</p>
                </article>

                {imageGalleries
                  .filter((gallery) => gallery.afterSectionIndex === index && Array.isArray(gallery.images) && gallery.images.length)
                  .map((gallery) => (
                    <section
                      key={`${section.title}-${gallery.title}`}
                      className="rounded-[1.6rem] border border-[rgba(25,33,60,0.08)] bg-[linear-gradient(145deg,rgba(255,250,244,0.94),rgba(255,255,255,0.88))] p-5 shadow-[0_16px_40px_rgba(25,33,60,0.05)] sm:p-6"
                    >
                      {gallery.title ? (
                        <h3 className="text-lg font-semibold text-[#19213C] sm:text-xl">{gallery.title}</h3>
                      ) : null}
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {gallery.images.map((image) => (
                          <figure
                            key={image.src}
                            className="overflow-hidden rounded-[1.35rem] border border-[rgba(25,33,60,0.08)] bg-white"
                          >
                            <img
                              src={image.src}
                              alt={image.alt || gallery.title || page.title}
                              loading="lazy"
                              decoding="async"
                              sizes="(max-width: 639px) 100vw, 33vw"
                              className="h-full w-full object-cover"
                            />
                          </figure>
                        ))}
                      </div>
                    </section>
                  ))}
              </div>
            ))}
          </div>

          {page.closingQuote ? (
            <blockquote className="mt-10 rounded-[1.7rem] border border-gold/20 bg-[linear-gradient(135deg,rgba(255,248,240,0.96),rgba(247,238,226,0.92),rgba(255,255,255,0.88))] p-6 shadow-[0_18px_45px_rgba(25,33,60,0.06)] sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8D7667]">A powerful brand story for ITRATI</p>
              <p className="mt-4 text-base leading-8 text-[#19213C] sm:text-lg sm:leading-9">"{page.closingQuote}"</p>
            </blockquote>
          ) : null}

          {siblingPages.length ? (
            <div className="mt-10 rounded-[1.5rem] border border-gold/15 bg-[linear-gradient(135deg,rgba(247,238,226,0.94),rgba(255,255,255,0.86))] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8D7667]">Continue exploring</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {siblingPages.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/knowledge/${item.slug}`}
                    className="rounded-full border border-[#d9c2a0]/55 bg-white px-5 py-3 text-sm font-semibold text-[#19213C] transition hover:border-[#c7a86c] hover:bg-[#fff9f1]"
                  >
                    {item.navLabel}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default KnowledgePage
