module Jekyll
  class JsonPostPage < Page
    def initialize(site, post)
      @site = site
      @base = site.source

      @dir = "api/posts"
      @name = "#{post.data['slug'] || post.basename_without_ext}.json"

      self.process(@name)

      self.data = {
        "layout" => "post_json",
        "post" => post
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