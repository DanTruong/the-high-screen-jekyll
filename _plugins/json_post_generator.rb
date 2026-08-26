module Jekyll
  class JsonPostPage < Page
    def initialize(site, post)
      @site = site
      @base = site.source
      @dir  = "api/posts"

      original_filename = File.basename(post.path)
      json_filename = original_filename.sub(/\.(md|markdown)$/i, ".json")

      @name = json_filename

      # Make the generated JSON URL available to other templates.
      post.data["json_url"] = "/api/posts/#{json_filename}"

      self.process(@name)

      self.data = {
        "layout" => "post_json",
        "post"   => post
      }
    end
  end

  class JsonPostGenerator < Generator
    safe true

    def generate(site)
      site.posts.docs.each do |post|
        site.pages << JsonPostPage.new(site, post)
      end
    end
  end
end