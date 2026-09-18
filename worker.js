export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://wbhelp.github.io",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Test
    if (url.pathname === "/") {
      return json({
        success: true,
        message: "WB Help Admin API is running"
      }, 200, corsHeaders);
    }

    // Get all posts
    if (url.pathname === "/api/posts" && request.method === "GET") {
      const posts = await env.WBHELP_KV.get("posts", "json") || [];

      return json({
        success: true,
        posts
      }, 200, corsHeaders);
    }

    // Save new post
    if (url.pathname === "/api/posts" && request.method === "POST") {
      const body = await request.json();

      if (!body.title || !body.category || !body.description) {
        return json({
          success: false,
          message: "Title, category and description are required"
        }, 400, corsHeaders);
      }

      const posts =
        await env.WBHELP_KV.get("posts", "json") || [];

      const post = {
        id: Date.now().toString(),
        title: String(body.title).trim(),
        category: String(body.category).trim(),
        date: body.date || new Date().toISOString().slice(0, 10),
        description: String(body.description).trim(),
        officialLink: body.officialLink || ""
      };

      posts.unshift(post);

      await env.WBHELP_KV.put(
        "posts",
        JSON.stringify(posts)
      );

      return json({
        success: true,
        message: "Post saved successfully",
        post
      }, 201, corsHeaders);
    }

    // Delete post
    if (url.pathname.startsWith("/api/posts/") &&
        request.method === "DELETE") {

      const id = url.pathname.split("/").pop();

      const posts =
        await env.WBHELP_KV.get("posts", "json") || [];

      const newPosts =
        posts.filter(post => String(post.id) !== String(id));

      await env.WBHELP_KV.put(
        "posts",
        JSON.stringify(newPosts)
      );

      return json({
        success: true,
        message: "Post deleted successfully"
      }, 200, corsHeaders);
    }

    return json({
      success: false,
      message: "Not found"
    }, 404, corsHeaders);
  }
};


function json(data, status = 200, corsHeaders = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        ...corsHeaders
      }
    }
  );
}
