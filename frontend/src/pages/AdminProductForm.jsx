import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { api } from '../services/api'
import { toAssetUrl } from '../utils/media'
import { useTaxonomy } from '../components/TaxonomyProvider'

const schema = yup.object({
  name: yup.string().required('Name is required.'),
  description: yup.string().required('Description is required.'),
  category: yup.string().required('Category is required.'),
  buyerType: yup.string().oneOf(['personal', 'industrial', 'both']).default('personal'),
  stock: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? 0 : value))
    .typeError('Stock must be a number.')
    .min(0, 'Stock cannot be negative.')
    .integer('Stock must be a whole number.')
    .default(0),
  isBestSeller: yup.boolean().default(false),
  isNewArrival: yup.boolean().default(false),
  sampleEnabled: yup.boolean().default(false),
  availableSizesText: yup.string().default(''),
  highlights: yup.string(),
})

const clampImageZoom = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(Math.max(n, 1), 2.5)
}

function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = id && id !== 'new'
  const [images, setImages] = useState([])
  const [imageUrl, setImageUrl] = useState('')
  const [imageZoom, setImageZoom] = useState(1)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [packs, setPacks] = useState([{ label: '200 gm', price: '', salePrice: '', stock: '' }])
  const [purposeTags, setPurposeTags] = useState([])
  const [familyTags, setFamilyTags] = useState([])
  const [message, setMessage] = useState('')
  const { buyerTypes, purposes: purposeOptions, families: familyOptions } = useTaxonomy()

  const hasPacks = useMemo(() => packs.some((p) => (p.label || '').trim() && p.price !== ''), [packs])

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })
  const sampleEnabled = watch('sampleEnabled')

  const appendDescriptionTemplate = (snippet) => {
    const current = String(getValues('description') || '')
    const normalized = current.trimEnd()
    const nextValue = normalized ? `${normalized}\n${snippet}` : snippet
    setValue('description', nextValue, { shouldDirty: true, shouldValidate: true })
  }

  useEffect(() => {
    // Defaults for new products
    if (!isEditing) {
      setValue('buyerType', 'personal')
      setValue('stock', 0)
      setValue('isBestSeller', false)
      setValue('isNewArrival', false)
      setValue('sampleEnabled', false)
    }
    if (!isEditing) return
    const load = async () => {
      const product = await api.getProduct(id)
      setValue('name', product.name)
      setValue('description', product.description)
      setValue('category', product.category)
      setValue('buyerType', product.buyerType || 'personal')
      setValue('stock', product.stock ?? 0)
      setValue('isBestSeller', product.isBestSeller === true)
      setValue('isNewArrival', product.isNewArrival === true)
      setValue('sampleEnabled', product.sample?.enabled === true)
      setValue('sampleLabel', product.sample?.label || '')
      setValue('samplePrice', product.sample?.price ?? '')
      setValue('availableSizesText', product.availableSizesText || '')
      setValue('highlights', product.highlights?.join(', ') || '')
      setImages(product.images || [])
      setImageZoom(clampImageZoom(product.imageZoom))
      setPurposeTags(Array.isArray(product.purposeTags) ? product.purposeTags : [])
      setFamilyTags(Array.isArray(product.familyTags) ? product.familyTags : [])
      if (Array.isArray(product.packs) && product.packs.length) {
        setPacks(
          product.packs.map((p) => ({
            label: p.label || '',
            price: p.price ?? '',
            salePrice: p.salePrice ?? '',
            stock: p.stock ?? '',
          }))
        )
      } else if (product.price !== undefined && product.price !== null) {
        setPacks([{ label: 'Default pack', price: product.price, salePrice: '', stock: product.stock ?? '' }])
      }
    }
    load()
  }, [id, isEditing, setValue])

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    try {
      setUploadingImages(true)
      setMessage(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}...`)
      const uploaded = await Promise.all(files.map((file) => api.uploadImage(file)))
      // Store relative paths when possible so deploy works without rewriting DB URLs.
      setImages((prev) => {
        const next = [...prev]
        uploaded.forEach((response) => {
          const url = response.url || response.absoluteUrl
          if (url && !next.includes(url)) next.push(url)
        })
        return next
      })
      setMessage(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded. Save product to keep changes.`)
      event.target.value = ''
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUploadingImages(false)
    }
  }

  const makeMainImage = (url) => {
    setImages((prev) => [url, ...prev.filter((item) => item !== url)])
  }

  const addImageUrl = () => {
    const trimmed = (imageUrl || '').trim()
    if (!trimmed) return
    setImages((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
    setImageUrl('')
  }

  const onSubmit = async (data) => {
    const normalizedPacks = packs
      .map((p) => ({
        label: (p.label || '').trim(),
        price: Number(p.price),
        salePrice: p.salePrice === '' || p.salePrice === undefined ? null : Number(p.salePrice),
        stock: p.stock === '' || p.stock === undefined ? 0 : Number(p.stock),
      }))
      .filter((p) => p.label && !Number.isNaN(p.price))

    if (!normalizedPacks.length) {
      setMessage('Add at least one pack size with price.')
      return
    }

    const invalidSalePack = normalizedPacks.find(
      (pack) =>
        pack.salePrice !== null &&
        (!Number.isFinite(pack.salePrice) || pack.salePrice <= 0 || pack.salePrice >= pack.price)
    )

    if (invalidSalePack) {
      setMessage('Sale price must be lower than the regular pack price.')
      return
    }

    if (data.sampleEnabled) {
      const sampleLabel = String(data.sampleLabel || '').trim()
      const samplePrice = Number(data.samplePrice)
      if (!sampleLabel || Number.isNaN(samplePrice)) {
        setMessage('Add sample quantity and sample price.')
        return
      }
    }

    const basePrice = normalizedPacks.reduce((min, pack) => (pack.price < min ? pack.price : min), normalizedPacks[0].price)

    const payload = {
      ...data,
      stock: Math.max(0, Number(data.stock || 0)),
      price: Number(basePrice),
      highlights: data.highlights ? data.highlights.split(',').map((item) => item.trim()) : [],
      images,
      imageZoom: clampImageZoom(imageZoom),
      packs: normalizedPacks,
      purposeTags,
      familyTags,
      sample: data.sampleEnabled
        ? { enabled: true, label: String(data.sampleLabel || '').trim(), price: Number(data.samplePrice) }
        : { enabled: false, label: '', price: 0 },
    }

    try {
      if (isEditing) {
        await api.updateProduct(id, payload)
        setMessage('Product updated.')
      } else {
        await api.createProduct(payload)
        setMessage('Product created.')
      }
      setTimeout(() => navigate('/admin/products'), 800)
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Admin</p>
          <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
            {isEditing ? 'Edit product' : 'Add product'}
          </h1>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-black/10">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            <div>
              <label className="text-sm font-semibold text-ink">Product name</label>
              <input
                {...register('name')}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
              />
              {errors.name && <p className="mt-2 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Description</label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => appendDescriptionTemplate('- Point one\n- Point two')}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-emberDark hover:border-gold/40"
                >
                  Add bullet list
                </button>
                <button
                  type="button"
                  onClick={() => appendDescriptionTemplate('1. First point\n2. Second point')}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-emberDark hover:border-gold/40"
                >
                  Add numbering
                </button>
                <button
                  type="button"
                  onClick={() => appendDescriptionTemplate('\n')}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-emberDark hover:border-gold/40"
                >
                  Add line gap
                </button>
              </div>
              <textarea
                {...register('description')}
                rows="4"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
              />
              <p className="mt-2 text-xs text-muted">
                You can write paragraphs, add bullets with `-`, or numbering like `1.` and `2.`.
              </p>
              {errors.description && (
                <p className="mt-2 text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-ink">Category</label>
                <input
                  {...register('category')}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
                {errors.category && (
                  <p className="mt-2 text-xs text-red-600">{errors.category.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Highlights (comma separated)</label>
                <input
                  {...register('highlights')}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-clay/50 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-muted">Inventory</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">Available stock</h3>
              <p className="mt-2 text-sm text-muted">
                Enter the total number of units available for this product. Stock will reduce automatically when an order is placed.
              </p>

              <div className="mt-5 max-w-sm">
                <label className="text-sm font-semibold text-ink">Stock count</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  {...register('stock')}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
                {errors.stock ? <p className="mt-2 text-xs text-red-600">{errors.stock.message}</p> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-clay/50 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-muted">Merchandising</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">Explore placement</h3>
              <p className="mt-2 text-sm text-muted">
                Curate products on the Explore page for higher visibility.
              </p>

              <label className="mt-5 flex cursor-pointer items-start justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-ink">Best seller</p>
                  <p className="mt-1 text-xs text-muted">
                    If enabled, this product appears in Explore → Best sellers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  {...register('isBestSeller')}
                  className="mt-1 h-5 w-5 accent-ember"
                />
              </label>

              <label className="mt-4 flex cursor-pointer items-start justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-ink">Show “New” tag</p>
                  <p className="mt-1 text-xs text-muted">
                    Turn this on if you want the product card to display a New badge.
                  </p>
                </div>
                <input
                  type="checkbox"
                  {...register('isNewArrival')}
                  className="mt-1 h-5 w-5 accent-ember"
                />
              </label>

              <div className="mt-4 rounded-3xl border border-slate-200/80 bg-white px-5 py-4">
                <label className="flex cursor-pointer items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Show “Buy a sample” option</p>
                    <p className="mt-1 text-xs text-muted">
                      Turn this on to show a separate sample-buying action on the product.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    {...register('sampleEnabled')}
                    className="mt-1 h-5 w-5 accent-ember"
                  />
                </label>

                {sampleEnabled ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted">Sample quantity / size</label>
                      <input
                        {...register('sampleLabel')}
                        placeholder="2 ml"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted">Sample price (₹)</label>
                      <input
                        {...register('samplePrice')}
                        type="number"
                        placeholder="99"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-clay/50 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-muted">Discovery</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">Shop by purpose & fragrance family</h3>
              <p className="mt-2 text-sm text-muted">
                These tags help customers browse faster (B2C) and also help bulk buyers find relevant materials (B2B).
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/filters')}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/50"
                >
                  Manage filters
                </button>
                <p className="text-xs text-muted">
                  Add a new purpose or fragrance family whenever you need a custom filter.
                </p>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5">
                  <label className="text-sm font-semibold text-ink">Buyer type (B2C / B2B)</label>
                  <div className="mt-3 grid gap-2">
                    {buyerTypes.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-ink hover:border-gold/40"
                      >
                        <span className="font-semibold">{opt.label}</span>
                        <input
                          type="radio"
                          value={opt.id}
                          {...register('buyerType')}
                          className="h-4 w-4 accent-ember"
                        />
                      </label>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Tip: Use “Both” if this product applies to personal buyers and bulk/industrial buyers.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200/80 bg-white p-5">
                  <label className="text-sm font-semibold text-ink">Shop by purpose</label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {purposeOptions.map((tag) => {
                      const active = purposeTags.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() =>
                            setPurposeTags((prev) =>
                              prev.includes(tag.id) ? prev.filter((x) => x !== tag.id) : [...prev, tag.id]
                            )
                          }
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                            active
                              ? 'bg-ember text-white'
                              : 'border border-slate-200 bg-white text-emberDark hover:border-gold/50'
                          }`}
                        >
                          {tag.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-6">
                    <label className="text-sm font-semibold text-ink">Fragrance family</label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {familyOptions.map((tag) => {
                        const active = familyTags.includes(tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() =>
                              setFamilyTags((prev) =>
                                prev.includes(tag.id) ? prev.filter((x) => x !== tag.id) : [...prev, tag.id]
                              )
                            }
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                              active
                                ? 'bg-ember text-white'
                                : 'border border-slate-200 bg-white text-emberDark hover:border-gold/50'
                            }`}
                          >
                            {tag.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted">
                    You can select multiple purposes/families (example: “Luxury gifting” + “Woody”).
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-clay/50 p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted">Pack sizes</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">Add multiple pack options</h3>
                  <p className="mt-2 text-sm text-muted">
                    Example: 200 gm, 500 gm, 1 kg, 10 kg. Buyers can choose at checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPacks((prev) => [...prev, { label: '', price: '', salePrice: '', stock: '' }])}
                  className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white transition hover:bg-emberDark"
                >
                  + Add pack
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                {packs.map((p, idx) => (
                  <div
                    key={`${idx}-${p.label}`}
                    className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 md:grid-cols-[1.2fr_1fr_1fr_auto]"
                  >
                    <div>
                      <label className="text-xs font-semibold text-muted">Pack label</label>
                      <input
                        value={p.label}
                        onChange={(e) =>
                          setPacks((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                          )
                        }
                        placeholder="200 gm"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted">Pack price (₹)</label>
                      <input
                        value={p.price}
                        onChange={(e) =>
                          setPacks((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, price: e.target.value } : x))
                          )
                        }
                        type="number"
                        placeholder="999"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted">Sale price (₹)</label>
                      <input
                        value={p.salePrice}
                        onChange={(e) =>
                          setPacks((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, salePrice: e.target.value } : x))
                          )
                        }
                        type="number"
                        placeholder="Optional"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setPacks((prev) => prev.filter((_, i) => i !== idx))}
                        className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:border-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!hasPacks ? <p className="mt-4 text-xs text-muted">Add at least one pack size with price.</p> : null}
              <p className="mt-3 text-xs text-muted">
                Add a sale price to any pack if you want the product to show a Sale badge and discounted price.
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-4">
                <label className="text-sm font-semibold text-ink">Available sizes line (optional)</label>
                <input
                  {...register('availableSizesText')}
                  placeholder="50ml | 100ml | 250ml | Bulk orders available"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
                <p className="mt-2 text-xs text-muted">
                  Leave this blank to auto-show pack labels. Add custom text if you want a different sizes line for this product.
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink">Upload product photos</label>
              <p className="mt-1 text-xs text-muted">
                You can select multiple photos together. The first photo is used as the main product image.
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-ember file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-emberDark focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
              />
              {uploadingImages ? <p className="mt-2 text-xs font-semibold text-emberDark">Uploading photos...</p> : null}
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste image URL/path (e.g. /uploads/photo.jpg)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
                >
                  Add
                </button>
              </div>

              <div className="mt-5 rounded-3xl border border-gold/25 bg-clay/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                      Product image zoom / crop
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Adjust how the main product image fills cards and product detail frames.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-emberDark">
                    {Math.round(clampImageZoom(imageZoom) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={imageZoom}
                  onChange={(e) => setImageZoom(clampImageZoom(e.target.value))}
                  className="mt-4 w-full accent-[#C9A24A]"
                />
                <button
                  type="button"
                  onClick={() => setImageZoom(1)}
                  className="mt-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40"
                >
                  Reset zoom
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((url, index) => (
                  <div key={url} className="rounded-2xl border border-slate-200/80 bg-clay/70 p-3">
                    <div className="h-40 w-full overflow-hidden rounded-xl bg-white">
                      <img
                        src={toAssetUrl(url, import.meta.env.VITE_API_ASSET)}
                        alt="upload"
                        className="h-full w-full object-cover transition-transform duration-300"
                        style={{ transform: `scale(${clampImageZoom(imageZoom)})` }}
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-emberDark">
                        {index === 0 ? 'Main photo' : `Photo ${index + 1}`}
                      </span>
                      {index !== 0 ? (
                        <button
                          type="button"
                          onClick={() => makeMainImage(url)}
                          className="rounded-full border border-gold/30 bg-white px-3 py-1 text-[11px] font-semibold text-emberDark hover:border-gold/60"
                        >
                          Make main
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <p className="text-xs text-muted break-all">{url}</p>
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((x) => x !== url))}
                        className="shrink-0 rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold text-red-600 hover:border-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white">
              Save product
            </button>
            {message && <p className="text-sm font-semibold text-emberDark">{message}</p>}
          </form>
        </div>
      </section>
    </div>
  )
}

export default AdminProductForm
