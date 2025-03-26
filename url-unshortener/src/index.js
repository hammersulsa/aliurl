/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export default {
    async fetch(request, env, ctx) { // ctx 매개변수 추가
        const url = new URL(request.url);
        const shortUrl = url.searchParams.get('url');

        if (!shortUrl || !shortUrl.includes('aliexpress.com')) {
            return new Response('Invalid URL', { status: 400 });
        }

        const cacheKey = new Request(url.toString());
        const cache = caches.default;
        let response = await cache.match(cacheKey);

        if (!response) {
            try {
                const res = await fetch(shortUrl, { 
                    method: 'HEAD',
                    redirect: 'manual'
                });

                const longUrl = res.headers.get('Location') || shortUrl;
                response = new Response(JSON.stringify({ originalUrl: longUrl }), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': `public, max-age=${3600 * 4}`
                    }
                });

                ctx.waitUntil(cache.put(cacheKey, response.clone())); // 정상 동작
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), { 
                    status: 500,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }
        }

        return response;
    }
};