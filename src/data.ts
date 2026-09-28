export const services = [
  {
    title: 'Business Strategy',
    tagline: "Know what's next.",
    body: 'Our strategic business planning services are designed to guide your company towards sustainable, repeatable growth.',
  },
  {
    title: 'Digital Strategy',
    tagline: 'Use digital to compete.',
    body: 'We specialize in using digital to streamline processes, maximize productivity, and ultimately profitability.',
  },
  {
    title: 'Financial & Operational Services',
    tagline: 'Plan to win.',
    body: "We provide comprehensive finance and operations solutions to optimize resources and enhance your company's performance.",
  },
];

export const stats = [
  { n: '20+', label: 'years of industry expertise' },
  { n: '50+', label: 'successful projects' },
  { n: '20+', label: 'satisfied clients' },
  { n: '10+', label: 'industry partnerships' },
];

// Each testimonial shows the company logo underneath. logoHeight is tuned per logo, like the client row.
export const testimonials = [
  {
    quote:
      'I was looking for someone strategic with proven success in operations, digital strategy, and finance, as well as someone who would embrace and love the brand I created. I was looking for a unicorn, and in Tristan, I found just that.',
    name: 'Kari Saitowitz',
    role: 'Founder, Fhitting Room',
    company: 'Fhitting Room',
    logo: 'fhitting-room',
    logoHeight: 18,
  },
  {
    quote:
      "EQLBRM's strategic insights were invaluable in the early days of our go-to-market strategy. Tristan brought clarity and deep sector knowledge at a critical, formative time.",
    name: 'Eric Litman',
    role: 'CEO, aescape',
    company: 'aescape',
    logo: 'aescape',
    logoHeight: 26,
  },
];

// Drop a logo file at public/logos/<slug>.svg (or .png / .webp) and it replaces the text name automatically.
// height is the display height in pixels. It is tuned per logo so wide wordmarks and stacked logos carry equal weight.
export const clients = [
  { name: 'Razorfish', slug: 'razorfish', height: 30 },
  { name: 'Equinox', slug: 'equinox', height: 20 },
  { name: 'Fhitting Room', slug: 'fhitting-room', height: 18 },
  { name: 'PwC', slug: 'pwc', height: 54 },
  { name: 'aescape', slug: 'aescape', height: 30 },
  { name: 'Estée Lauder', slug: 'estee-lauder', height: 42 },
];
