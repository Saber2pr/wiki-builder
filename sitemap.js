const moment = require('moment')

const createSitemap = (cname = '', basename = '', urls) => `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
<url>
    <loc>https://${cname}/</loc>
    <priority>1.00</priority>
</url>
  ${urls.map(url => {
    `<url>
    <loc>${'https://' + cname + basename + url}</loc>
    <lastmod>${moment().format('YYYY-MM-DD')}</lastmod>
    <changefreq>daily</changefreq>
</url>`
})}
</urlset>`

module.exports = {
  createSitemap
}