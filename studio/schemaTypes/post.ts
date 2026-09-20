import { defineArrayMember, defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Blog post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      description: 'The end of the web address, for example "fractional-cfo-costs". Click Generate, then shorten it.',
      type: 'slug',
      options: { source: 'title', maxLength: 70 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publish date',
      description: 'Posts appear on the site once this date has passed and the site has rebuilt.',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Short summary',
      description: 'Shows on the blog page and in search results. Aim for one or two sentences.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(200).warning('Keep it under 200 characters so search results do not cut it off.'),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          description: 'Describe the image in a few words for people using screen readers.',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading', value: 'h2' },
            { title: 'Subheading', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullets', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
        }),
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'seoTitle',
      title: 'Search title (optional)',
      description: 'Only fill this in if the post title is too long or unclear for a Google result.',
      type: 'string',
      validation: (rule) => rule.max(60).warning('Google usually cuts titles off after about 60 characters.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Search description (optional)',
      description: 'Leave blank to use the short summary.',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(160).warning('Google usually cuts descriptions off after about 160 characters.'),
    }),
  ],
  orderings: [
    { title: 'Newest first', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', date: 'publishedAt', media: 'coverImage' },
    prepare: ({ title, date, media }) => ({
      title,
      subtitle: date ? new Date(date).toLocaleDateString('en-US') : 'No date',
      media,
    }),
  },
});
