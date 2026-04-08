const API_ORIGIN = 'https://ai-life-todo-api.1291712594.workers.dev'

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const targetUrl = `${API_ORIGIN}${url.pathname}${url.search}`
  const upstreamRequest = new Request(targetUrl, request)
  const response = await fetch(upstreamRequest)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
}
