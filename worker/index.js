function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin')
  const allowedOrigins = (env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  let allowOrigin = '*'
  if (!allowedOrigins.includes('*')) {
    allowOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*')
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-User-Id',
    'Access-Control-Max-Age': '86400'
  }
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // 拿到 Vercel API 的基础地址，我们使用没有 Vercel Authentication 拦截的主别名域名
    const VERCEL_API_BASE = 'https://ai-life-todo-h5.vercel.app'
    
    // 构造发往 Vercel 的完整 URL
    const url = new URL(request.url)
    const targetUrl = `${VERCEL_API_BASE}${url.pathname}${url.search}`

    try {
      // 克隆原请求的 headers，并去掉不兼容的 header
      const headers = new Headers(request.headers)
      headers.delete('Host')
      headers.delete('Origin')
      headers.delete('Referer')

      // 向 Vercel 发起请求
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : null,
        redirect: 'follow'
      })

      // 拿到 Vercel 的响应后，加上 CORS 头再返回给浏览器
      const newResponse = new Response(response.body, response)
      
      // 覆盖/合并 CORS 头部
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value)
      })

      return newResponse

    } catch (error) {
      console.error('Proxy Error:', error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'API Proxy Error: ' + error.message 
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }
  }
}