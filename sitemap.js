const moment = require('moment')

const createSitemap = (cname = '', basename = '', urls) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
    <loc>https://${cname}/</loc>
    <lastmod>${moment().format('YYYY-MM-DD')}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
</url>
  ${urls.map(url => `<url>
  <loc>${'https://' + cname + basename + url}</loc>
  <lastmod>${moment().format('YYYY-MM-DD')}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.6</priority>
</url>`).join('\n')}
</urlset>`

module.exports = {
  createSitemap
}