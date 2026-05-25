const domain = import.meta.env.WORDPRESS_API_URL;
const apiUrl = `${domain}/wp-json/wp/v2`;

export const getLastestPost = async ({
  perPage = 10,
}: {
  perPage?: number;
}) => {
  try {
    const response = await fetch(`${apiUrl}/posts?per_page=${perPage}&_embed`);

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    } else {
      const result = await response.json();
      //   console.log(posts);
      if (!result.length) {
        throw new Error("No posts found");
      }

      const posts = result.map(
        (post: {
          _embedded?: any;
          title?: any;
          content?: any;
          excerpt?: any;
          date?: string;
          slug?: string;
        }) => {
          const {
            title: { rendered: title },
            content: { rendered: content },
            excerpt: { rendered: excerpt },
            date,
            slug,
          } = post;

          const featuredImage =
            post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
          return { title, content, excerpt, date, slug, featuredImage };
        }
      );

      return posts;
    }
  } catch (error) {
    console.error("Error fetching latest posts:", error);
    throw error;
  }
};

export const getPostInfo = async (slug: string) => {
  try{
    const response = await fetch(`${apiUrl}/posts?slug=${slug}`);
  
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    } else {
      const [result] = await response.json();
      const {
        title: { rendered: title },
        content: { rendered: content },
      } = result;
  
      return { title, content };
    }
  }catch (error) {
    console.error("Error fetching post info:", error);
    throw error;
  }
};
