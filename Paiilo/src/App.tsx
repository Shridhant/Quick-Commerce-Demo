import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'

const partners = ['FreshMart', 'Urban Farms', 'MilkRun', 'K-Shop', 'SnackBox']

const groceryTiles = [
  { label: 'Fruits', icon: 'FR', tone: 'bg-[#eaf8d6]' },
  { label: 'Vegetables', icon: 'VG', tone: 'bg-[#dff3e8]' },
  { label: 'Milk', icon: 'ML', tone: 'bg-[#edf4ff]' },
  { label: 'Cereal', icon: 'CR', tone: 'bg-[#fff3c8]' },
  { label: 'Meat', icon: 'MT', tone: 'bg-[#ffe0db]' },
  { label: 'Korean ramen', icon: 'KR', tone: 'bg-[#ffe8ef]' },
  { label: 'American chips', icon: 'US', tone: 'bg-[#e7edff]' },
  { label: 'Juices', icon: 'JC', tone: 'bg-[#ffeac7]' },
  { label: 'Festive boxes', icon: 'FX', tone: 'bg-[#f0e8ff]' },
  { label: 'Bulk deals', icon: 'BD', tone: 'bg-[#e8f7ef]' },
  { label: 'Imported pantry', icon: 'IP', tone: 'bg-[#fff6dc]' },
  { label: 'Ready meals', icon: 'RM', tone: 'bg-[#e5f2ef]' },
]

const dealRows = [
  ['Farm bananas 1kg', 'Rs. 64', '12 min'],
  ['Imported grape juice', 'Rs. 249', '9 min'],
  ['Kimchi ramen 5-pack', 'Rs. 399', '14 min'],
]

const notifications = [
  ['Spend Rs. 500 - unlock 8% off', true],
  ['Spend Rs. 2000 - unlock 18% off', true],
  ['Rare imported ramen access', false],
  ['American chips + juices drop', true],
]

const activity = [
  ['You chose milk, bananas, cereal, and Korean ramen', 'Step 1'],
  ['Payment confirmed. Rider arrives in 11 minutes', 'Step 2'],
]

function Home() {
  const reduceMotion = useReducedMotion()
  const rise = {
    initial: reduceMotion ? false : { opacity: 0, y: 22 },
    whileInView: reduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.65, ease: 'easeOut' as const },
  }

  return (
    <main className="bg-[#fbfcf8] text-[#082f27]">
      <div className="mx-auto w-full overflow-hidden bg-[#fbfcf8]">
        <header className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-6 sm:px-7">
          <a href="#home" className="flex items-center gap-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#064236]">
            <img src="/logo.png" alt="Paiilo" className="h-12 w-24 object-contain sm:h-14 sm:w-28" />
          </a>
          <nav className="hidden items-center gap-8 text-xs font-medium text-[#163f36] md:flex">
            {['Solutions', 'Customers'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-[#007a5f]">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/delete-account" className="rounded-full px-4 py-2 text-xs font-semibold text-[#143d34] transition hover:bg-[#edf1eb]">
              Delete
            </Link>
            <motion.a
              href="#cta"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="rounded-full bg-[#063f34] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(6,63,52,0.22)]"
            >
              Start Now
            </motion.a>
          </div>
        </header>

        <section id="home" className="relative mx-auto max-w-[1120px] px-5 pb-24 pt-20 text-center sm:px-7">
          <div className="absolute inset-x-5 top-10 h-[470px] bg-[linear-gradient(#e5ebe3_1px,transparent_1px),linear-gradient(90deg,#e5ebe3_1px,transparent_1px)] bg-[size:54px_54px] sm:inset-x-12" />
          {[
            ['Fresh', 'left-[8%] top-[86px]'],
            ['Milk', 'right-[8%] top-[86px]'],
            ['Ramen', 'left-[14%] top-[320px]'],
            ['Fruit', 'right-[12%] top-[330px]'],
          ].map(([name, pos], index) => (
            <motion.div
              key={name}
              animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 4 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute ${pos} hidden md:block`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-white bg-[#e9efe7] text-[10px] font-bold shadow-xl">
                {name}
              </div>
              <span className="absolute -bottom-5 -right-3 h-0 w-0 rotate-45 border-b-[14px] border-l-[14px] border-b-[#063f34] border-l-transparent" />
            </motion.div>
          ))}

          <motion.div {...rise} className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dce5dc] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-normal text-[#0b5848]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff59]" />
              Quick commerce for daily needs
            </span>
            <h1 className="mx-auto mt-8 max-w-[790px] text-5xl font-semibold leading-[1.02] tracking-normal text-[#07382f] sm:text-6xl md:text-7xl">
              One app to order groceries and global cravings faster
            </h1>
            <p className="mx-auto mt-6 max-w-[650px] text-sm leading-7 text-[#48655e]">
              Paiilo helps homes stock fruits, vegetables, cereal, milk, meat, bulk staples, imported snacks, Korean ramen, American chips, juices, and festive products in minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <motion.a
                href="#features"
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="rounded-full bg-[#063f34] px-6 py-3 text-xs font-bold text-white shadow-[0_12px_24px_rgba(6,63,52,0.2)]"
              >
                Start for Free
              </motion.a>
              <motion.a
                href="#demo"
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="rounded-full bg-white px-6 py-3 text-xs font-bold text-[#143d34] shadow-[0_10px_26px_rgba(22,44,38,0.08)]"
              >
                Get a Demo
              </motion.a>
            </div>
            <div className="mx-auto mt-12 max-w-[520px] rounded-xl border border-[#e1e8df] bg-white/86 p-3 text-left shadow-[0_20px_55px_rgba(22,44,38,0.08)] backdrop-blur">
              {dealRows.map(([item, price, eta]) => (
                <div key={item} className="flex items-center justify-between rounded-lg px-4 py-3 text-xs odd:bg-[#f3f6f1]">
                  <span className="font-semibold text-[#173f36]">{item}</span>
                  <span className="text-[#607972]">{price} - {eta}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto flex max-w-[1120px] flex-col items-center gap-7 border-y border-[#edf0eb] px-5 py-9 text-center sm:px-7 md:flex-row md:text-left">
          <p className="mx-auto max-w-[220px] text-xs font-bold leading-5 md:mx-0 md:max-w-[130px]">More than 100+ local stores partner</p>
          <div className="grid w-full flex-1 grid-cols-2 gap-x-5 gap-y-4 text-center text-base font-bold text-[#77908a] sm:grid-cols-5 sm:text-lg">
            {partners.map((partner) => (
              <span key={partner}>{partner}</span>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-[960px] px-5 py-20 sm:px-7 sm:py-24">
          <motion.div {...rise} className="text-center">
            <span className="text-[10px] font-bold uppercase text-[#0b5848]">Features</span>
            <h2 className="mx-auto mt-4 max-w-[640px] text-3xl font-semibold leading-tight text-[#0a332c] sm:text-4xl">
              Latest shopping technology to ensure everything you need arrives fast
            </h2>
            <p className="mx-auto mt-4 max-w-[540px] text-sm leading-7 text-[#57716a]">
              Maximize cart value, freshness, and speed with affordable, easy-to-use quick commerce tools.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 sm:mt-16 sm:gap-6">
            <motion.article {...rise} className="grid overflow-hidden rounded-lg border border-[#e3e9e2] bg-[#eef3ed] md:grid-cols-[1.05fr_1fr]">
              <div className="p-6 text-center sm:p-8 md:text-left">
                <h3 className="text-xl font-semibold sm:text-2xl">Dynamic pantry dashboard</h3>
                <p className="mt-4 max-w-[390px] text-sm leading-6 text-[#526c65]">
                  Track fruits, vegetables, cereal, milk, meat, imported stock, and festive inventory before demand spikes.
                </p>
                <a href="#dashboard" className="mt-8 inline-flex rounded-md bg-[#063f34] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#063f34]/15 sm:mt-20">
                  Explore all
                </a>
              </div>
              <div className="bg-[#fbfcf8] p-5 sm:p-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold">Paiilo Fresh Co.</span>
                  <div className="flex -space-x-2">
                    {['FR', 'VG', 'KR', 'BD'].map((item) => (
                      <span key={item} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#eaf8d6] text-[9px] font-bold">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex h-44 items-end gap-2 sm:h-52 sm:gap-5">
                  {[44, 70, 34, 24, 88, 42, 62, 40, 28, 34].map((height, index) => (
                    <motion.span
                      key={`${height}-${index}`}
                      initial={reduceMotion ? false : { height: 0 }}
                      whileInView={{ height }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: index * 0.04 }}
                      className={`min-w-3 flex-1 rounded-full sm:w-7 sm:flex-none ${index === 4 ? 'bg-[#006c58]' : 'bg-[#dde4dc]'}`}
                    />
                  ))}
                </div>
              </div>
            </motion.article>

            <div className="grid gap-6 md:grid-cols-2">
              <motion.article {...rise} className="overflow-hidden rounded-lg border border-[#e3e9e2] bg-[#eef3ed] text-center">
                <div className="p-6 sm:p-8">
                  <h3 className="text-xl font-semibold sm:text-2xl">Bigger carts unlock better deals</h3>
                  <p className="mx-auto mt-3 max-w-[360px] text-sm leading-6 text-[#526c65]">
                    Cross Rs. 500 or Rs. 2000 to unlock cart discounts, rare imported items, and limited snack drops.
                  </p>
                </div>
                <div className="bg-[#fbfcf8] p-5 text-left sm:p-7">
                  <div className="mb-5 flex items-center justify-between text-xs font-bold">
                    Cart rewards
                    <span className="text-[#0b5848]">Imported picks</span>
                  </div>
                  <div className="space-y-5">
                    {notifications.map(([label, enabled]) => (
                      <div key={label as string} className="flex items-center justify-between gap-4 text-xs text-[#526c65]">
                        <span>{label}</span>
                        <span className={`h-5 w-9 rounded-full p-0.5 ${enabled ? 'bg-[#006c58]' : 'bg-[#cfd8d1]'}`}>
                          <span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? 'translate-x-4' : ''}`} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.article>

              <motion.article {...rise} className="overflow-hidden rounded-lg border border-[#e3e9e2] bg-[#eef3ed] text-center">
                <div className="p-6 sm:p-8">
                  <h3 className="text-xl font-semibold sm:text-2xl">Choose, pay, get it in minutes</h3>
                  <p className="mx-auto mt-3 max-w-[360px] text-sm leading-6 text-[#526c65]">
                    Build a basket, pay securely, and watch fresh essentials move from nearby shelves to your door.
                  </p>
                </div>
                <div className="bg-[#fbfcf8] p-5 text-left sm:p-7">
                  <div className="mb-5 flex items-center justify-between text-xs font-bold">
                    Your order
                    <span className="text-[#0b5848]">11 min ETA</span>
                  </div>
                  <div className="space-y-4">
                    {activity.map(([copy, time]) => (
                      <div key={copy} className="rounded-md bg-white p-4 shadow-[0_10px_30px_rgba(22,44,38,0.06)]">
                        <p className="text-xs leading-5 text-[#153e35]">{copy}</p>
                        <p className="mt-2 text-[10px] text-[#8aa09a]">{time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.article>
            </div>
          </div>
        </section>

        <section id="solutions" className="mx-auto max-w-[1060px] px-5 pb-20 sm:px-7 sm:pb-24">
          <motion.div {...rise} className="overflow-hidden rounded-lg bg-[#1f4640] px-4 py-14 text-center text-white sm:px-10 sm:py-16">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase text-white/70">Categories</span>
            <h2 className="mt-5 text-3xl font-semibold">Don&apos;t search everywhere. Paiilo it.</h2>
            <p className="mx-auto mt-4 max-w-[570px] text-sm leading-7 text-white/70">
              Daily essentials, global treats, party stock, festive boxes, and family bulk orders live in one clean quick-commerce grid.
            </p>
            <a href="#all" className="mt-6 inline-flex border-b border-white/70 text-xs font-semibold text-white">
              All categories
            </a>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-4 sm:gap-6 lg:grid-cols-6">
              {groceryTiles.map((tile) => (
                <motion.div
                  key={tile.label}
                  whileHover={reduceMotion ? undefined : { y: -6, scale: 1.03 }}
                  className="rounded-xl bg-white p-4 shadow-[0_18px_40px_rgba(0,0,0,0.15)]"
                >
                  <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-md ${tile.tone} text-[11px] font-black text-[#0b372f]`}>
                    {tile.icon}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-[#173f36]">{tile.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section id="customers" className="mx-auto max-w-[920px] px-5 pb-20 text-center sm:px-7 sm:pb-24">
          <motion.div {...rise}>
            <div className="mx-auto text-3xl font-black text-[#006c58]">"</div>
            <blockquote className="mx-auto mt-5 max-w-[780px] text-2xl font-semibold leading-tight sm:text-3xl">
              Paiilo is helping our home order fresh vegetables, milk, meat, cereal, imported snacks, and festive gifts without planning three days ahead.
            </blockquote>
            <div className="mt-9 flex flex-col items-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2d66f] text-xs font-bold">JD</span>
              <p className="mt-3 text-xs font-bold">Jayanta Debnath</p>
              <p className="text-[10px] text-[#647b75]">Early Paiilo customer</p>
            </div>
          </motion.div>
        </section>

        <section className="mx-5 mb-8 rounded-lg bg-[#f3f5f1] px-5 py-10 sm:mx-7 sm:px-6 sm:py-12">
          <div className="mx-auto grid max-w-[880px] gap-8 text-center sm:grid-cols-3">
            {[
              ['2026', 'Paiilo Founded'],
              ['50K+', 'Active carts'],
              ['1k+', 'Store partners'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-4xl font-semibold text-[#063f34] sm:text-5xl">{value}</p>
                <p className="mt-2 text-xs text-[#647b75]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cta" className="bg-[#244d47] px-5 py-14 text-center text-white sm:px-7 sm:py-16 md:text-left">
          <div className="mx-auto flex max-w-[1040px] flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
            <h2 className="max-w-[480px] text-3xl font-semibold leading-tight sm:text-4xl">
              Discover the full scale of Paiilo capabilities
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#demo" className="rounded-full bg-white px-6 py-3 text-xs font-bold text-[#143d34]">
                Get a Demo
              </a>
              <a href="#start" className="rounded-full bg-[#dfff5d] px-6 py-3 text-xs font-bold text-[#143d34]">
                Start for Free
              </a>
            </div>
          </div>
        </section>

        <footer className="bg-[#0c211d] px-5 py-14 text-white sm:px-7 sm:py-16">
          <div className="mx-auto grid max-w-[1040px] gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <img src="/logo.png" alt="" className="h-6 w-6 rounded-md object-cover" />
                Paiilo
              </div>
              <p className="mt-6 text-xs leading-6 text-white/60">hello@paiilo.com</p>
              <p className="text-xs leading-6 text-white/60">+91 98765 43210</p>
            </div>
            {[
              ['Solution', 'Why Paiilo', 'Features', 'Open API', 'Technology'],
              ['Customers', 'Homes', 'Stores', 'Apartments', 'Enterprise'],
              ['Resources', 'Pricing', 'Contact Sales', 'Changelog', 'Blog'],
            ].map(([heading, ...links]) => (
              <div key={heading}>
                <h3 className="text-xs font-bold">{heading}</h3>
                <div className="mt-5 grid gap-4">
                  {links.map((link) => (
                    <a key={link} href="#home" className="text-xs text-white/56 transition hover:text-white">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-16 flex max-w-[1040px] flex-col gap-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <span>© Copyright 2026 Paiilo. All rights reserved.</span>
            <span>Fresh faster, bulk smarter.</span>
          </div>
        </footer>
      </div>
    </main>
  )
}

function DeleteAccount() {
  const steps = [
    {
      title: 'Write your request',
      copy: 'Send an email from the address linked to your Paiilo account.',
    },
    {
      title: 'Add your reason',
      copy: 'Briefly mention why you want the account deleted so the support team can process it correctly.',
    },
    {
      title: 'Wait for confirmation',
      copy: 'Your account deletion request will be completed in 3-4 business days.',
    },
  ]

  return (
    <main className="min-h-screen bg-[#fbfcf8] text-[#082f27]">
      <header className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-6 sm:px-7">
        <Link to="/" className="flex items-center gap-2 text-sm font-bold">
          <img src="/logo.png" alt="Paiilo" className="h-14 w-28 object-contain" />
        </Link>
        <Link to="/" className="rounded-full bg-[#063f34] px-5 py-2.5 text-xs font-semibold text-white">
          Back home
        </Link>
      </header>

      <section className="relative mx-auto max-w-[980px] px-5 pb-24 pt-16 text-center sm:px-7">
        <div className="absolute inset-x-5 top-8 h-[360px] bg-[linear-gradient(#e5ebe3_1px,transparent_1px),linear-gradient(90deg,#e5ebe3_1px,transparent_1px)] bg-[size:54px_54px] sm:inset-x-12" />
        <div className="relative">
          <span className="inline-flex rounded-full border border-[#dce5dc] bg-white px-3 py-1 text-[10px] font-bold uppercase text-[#0b5848]">
            Account deletion
          </span>
          <h1 className="mx-auto mt-8 max-w-[720px] text-5xl font-semibold leading-[1.02] text-[#07382f] sm:text-6xl">
            Delete your Paiilo account
          </h1>
          <p className="mx-auto mt-6 max-w-[620px] text-sm leading-7 text-[#48655e]">
            To request deletion, write an email to{' '}
            <a className="font-bold text-[#063f34] underline underline-offset-4" href="mailto:shridhant.ds3@gmail.com?subject=Paiilo%20Account%20Deletion%20Request">
              shridhant.ds3@gmail.com
            </a>{' '}
            with your reason. Your account will be deleted in 3-4 business days.
          </p>

          <div className="mt-14 grid gap-5 text-left md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-lg border border-[#e3e9e2] bg-white p-6 shadow-[0_18px_45px_rgba(22,44,38,0.06)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#eaf8d6] text-xs font-black text-[#063f34]">
                  {index + 1}
                </span>
                <h2 className="mt-8 text-xl font-semibold">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#57716a]">{step.copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-lg bg-[#1f4640] p-7 text-left text-white">
            <p className="text-xs font-bold uppercase text-white/60">Email format</p>
            <p className="mt-4 text-sm leading-7 text-white/78">
              Subject: Paiilo Account Deletion Request
              <br />
              Include: your registered email, your name, and your reason for deleting the account.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
