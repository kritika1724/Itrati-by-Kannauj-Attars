import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { saveShippingAddress } from '../../features/cartSlice'

const schema = yup.object({
  fullName: yup.string().required('Full name is required.'),
  email: yup.string().email('Enter a valid email.').required('Email is required.'),
  phone: yup.string().required('Phone is required.'),
  whatsapp: yup.string().required('WhatsApp number is required.'),
  addressLine1: yup.string().required('Address is required.'),
  addressLine2: yup.string(),
  city: yup.string().required('City is required.'),
  state: yup.string().required('State is required.'),
  postalCode: yup.string().required('Postal code is required.'),
  country: yup.string().required('Country is required.'),
})

function Shipping() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const shippingAddress = useSelector((state) => state.cart.shippingAddress)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: shippingAddress,
  })

  useEffect(() => {
    reset(shippingAddress)
  }, [shippingAddress, reset])

  const onSubmit = (data) => {
    dispatch(saveShippingAddress(data))
    navigate('/checkout/payment')
  }

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-4xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Checkout</p>
          <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Shipping address</h1>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-black/10">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
            <div>
              <label className="text-sm font-semibold text-ink">Full name</label>
              <input
                {...register('fullName')}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
              />
              {errors.fullName && <p className="mt-2 text-xs text-red-600">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Email</label>
              <input
                {...register('email')}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
              />
              {errors.email && <p className="mt-2 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Phone</label>
              <input
                {...register('phone')}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
              />
              {errors.phone && <p className="mt-2 text-xs text-red-600">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">WhatsApp number</label>
              <input
                {...register('whatsapp')}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                placeholder="+91XXXXXXXXXX"
              />
              {errors.whatsapp && (
                <p className="mt-2 text-xs text-red-600">{errors.whatsapp.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Address line 1</label>
              <input
                {...register('addressLine1')}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
              />
              {errors.addressLine1 && (
                <p className="mt-2 text-xs text-red-600">{errors.addressLine1.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">Address line 2 (optional)</label>
              <input
                {...register('addressLine2')}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-ink">City</label>
                <input
                  {...register('city')}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
                {errors.city && <p className="mt-2 text-xs text-red-600">{errors.city.message}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">State</label>
                <input
                  {...register('state')}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
                {errors.state && <p className="mt-2 text-xs text-red-600">{errors.state.message}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Postal code</label>
                <input
                  {...register('postalCode')}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
                {errors.postalCode && (
                  <p className="mt-2 text-xs text-red-600">{errors.postalCode.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Country</label>
                <input
                  {...register('country')}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
                {errors.country && (
                  <p className="mt-2 text-xs text-red-600">{errors.country.message}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
            >
              Continue
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Shipping
