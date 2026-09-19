export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://wbhelp.github.io",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // API key check for write operations
    if (
      request.method === "POST" ||
      request.method === "PUT" ||
      request.method === "DELETE"
    ) {
      const auth = request.headers.get("Authorization");

      if (auth !== `Bearer ${env.ADMIN_API_KEY}`) {
        return json(
          {
            success: false,
            message: "Unauthorized"
          },
          401,
          corsHeaders
        );
      }
    }

    // API test
    if (url.pathname === "/") {
      return json(
        {
          success: true,
          message: "WB Help Admin API is running"
        },
        200,
        corsHeaders
      );
    }

    // GET ALL POSTS
    if (
      url.pathname === "/api/posts" &&
      request.method === "GET"
    ) {
      const posts =
        await env.WBHELP_KV.get("posts", "json") || [];

      return json(
        {
          success: true,
          posts
        },
        200,
        corsHeaders
      );
    }

    // CREATE POST
    if (
      url.pathname === "/api/posts" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();

        if (
          !body.title ||
          !body.category ||
          !body.description
        ) {
          return json(
            {
              success: false,
              message:
                "Title, category and description are required"
            },
            400,
            corsHeaders
          );
        }

        const posts =
          await env.WBHELP_KV.get("posts", "json") || [];

        const post = {
          id: Date.now().toString(),
          title: String(body.title).trim(),
          category: String(body.category).trim(),
          date:
            body.date ||
            new Date().toISOString().slice(0, 10),
          description:
            String(body.description).trim(),
          officialLink:
            body.officialLink
              ? String(body.officialLink).trim()
              : ""
        };

        posts.unshift(post);

        await env.WBHELP_KV.put(
          "posts",
          JSON.stringify(posts)
        );

        return json(
          {
            success: true,
            message: "Post saved successfully",
            post
          },
          201,
          corsHeaders
        );

      } catch (error) {
        return json(
          {
            success: false,
            message: "Invalid request"
          },
          400,
          corsHeaders
        );
      }
    }

    // EDIT POST
    if (
      url.pathname.startsWith("/api/posts/") &&
      request.method === "PUT"
    ) {
      try {
        const id =
          url.pathname.split("/").pop();

        const body =
          await request.json();

        const posts =
          await env.WBHELP_KV.get("posts", "json") || [];

        const index =
          posts.findIndex(
            post =>
              String(post.id) === String(id)
          );

        if (index === -1) {
          return json(
            {
              success: false,
              message: "Post not found"
            },
            404,
            corsHeaders
          );
        }

        posts[index] = {
          ...posts[index],
          title:
            body.title !== undefined
              ? String(body.title).trim()
              : posts[index].title,

          category:
            body.category !== undefined
              ? String(body.category).trim()
              : posts[index].category,

          date:
            body.date ||
            posts[index].date,

          description:
            body.description !== undefined
              ? String(body.description).trim()
              : posts[index].description,

          officialLink:
            body.officialLink !== undefined
              ? String(body.officialLink).trim()
              : posts[index].officialLink
        };

        await env.WBHELP_KV.put(
          "posts",
          JSON.stringify(posts)
        );

        return json(
          {
            success: true,
            message: "Post updated successfully",
            post: posts[index]
          },
          200,
          corsHeaders
        );

      } catch (error) {
        return json(
          {
            success: false,
            message: "Invalid request"
          },
          400,
          corsHeaders
        );
      }
    }

    // DELETE POST
    if (
      url.pathname.startsWith("/api/posts/") &&
      request.method === "DELETE"
    ) {
      const id =
        url.pathname.split("/").pop();

      const posts =
        await env.WBHELP_KV.get("posts", "json") || [];

      const newPosts =
        posts.filter(
          post =>
            String(post.id) !== String(id)
        );

      if (newPosts.length === posts.length) {
        return json(
          {
            success: false,
            message: "Post not found"
          },
          404,
          corsHeaders
        );
      }

      await env.WBHELP_KV.put(
        "posts",
        JSON.stringify(newPosts)
      );

      return json(
        {
          success: true,
          message: "Post deleted successfully"
        },
        200,
        corsHeaders
      );
    }

    return json(
      {
        success: false,
        message: "Not found"
      },
      404,
      corsHeaders
    );
  }
};


function json(
  data,
  status = 200,
  corsHeaders = {}
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",
        ...corsHeaders
      }
    }
  );
}
