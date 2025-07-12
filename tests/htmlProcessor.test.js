const { pageToHTML } = require('../helpers/htmlProcessor');

describe('htmlProcessor', () => {
    it('should return a cheerio object when given valid HTML', async () => {
        const html = '<html><body><h1>Hello</h1></body></html>';
        const $ = await pageToHTML(html);
        expect(typeof $.html).toBe('function');
        expect($('h1').text()).toBe('Hello');
    });

    it('should handle empty string input', async () => {
        const html = '';
        const $ = await pageToHTML(html);
        expect($.root().html()).toBe('<html><head></head><body></body></html>');
    });

    it('should parse multiple elements', async () => {
        const html = '<ul><li>One</li><li>Two</li></ul>';
        const $ = await pageToHTML(html);
        expect($('li')).toHaveLength(2);
        expect($('li').eq(0).text()).toBe('One');
        expect($('li').eq(1).text()).toBe('Two');
    });

    it('should parse attributes correctly', async () => {
        const html = '<a href="https://example.com">Link</a>';
        const $ = await pageToHTML(html);
        expect($('a').attr('href')).toBe('https://example.com');
    });

    it('should not throw on malformed HTML', async () => {
        const html = '<div><span>Test';
        const $ = await pageToHTML(html);
        expect($('span').text()).toBe('Test');
    });
});

