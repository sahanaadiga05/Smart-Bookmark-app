
const cheerio = require('cheerio');
const html = '<html><head><title>Test</title></head><body></body></html>';
const $ = cheerio.load(html);
const title = $('head title').first().text() || $('meta[property=\"og:title\"]').attr('content') || $('title').first().text() || '';
console.log(title);

