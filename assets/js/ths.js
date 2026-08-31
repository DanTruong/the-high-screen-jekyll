(function() {
	"use strict";
	const e = React.createElement;
	const POSTS_TO_SHOW = 12;

	//Utility functions
	function formatDate(dateValue) {
		if (!dateValue) {
			return "";
		}

		const date = new Date(dateValue);

		if (Number.isNaN(date.getTime())) {
			return dateValue;
		}

		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric"
		}).format(date);
	}

	// Builds the URL that the homepage uses when someone clicks an article.
	function getPostPageUrl(post) {
		if (!post.content_url) {
			return "#";
		}

		return (
			"post.html?json=" + encodeURIComponent(post.content_url)
		);
	}

	//Homepage components
	function PostPreview(props) {
		const post = props.post;
		const isLast = props.isLast;
		const title = post.title || "Untitled";
		const excerpt = post.excerpt || post.subtitle || "";
		const author = post.author || "The High Screen";
		const date = formatDate(post.date);

		return e(React.Fragment, null, 
				e("article", {className: "post-preview"},
				e(
					"a", {href: getPostPageUrl(post)},
					e("h2", {className: "post-title"}, title),
					excerpt ?
					e("h3", {className: "post-subtitle"}, excerpt) : null
				),
				e(
					"p", {className: "post-meta"},
					"Posted by ", e("span", null, author), date ? " on " + date : ""
				)
			),
			!isLast ?
			e("hr", {className: "my-4"}) : null
		);
	}

	function getPageTitle(category) {
		switch (category) {
			case "the-buckets-blog":
				return "The Buckets Blog";
			case "show-dont-tell":
				return "Show Don't Tell";
			case "all":
				return "Archive";
			default:
				return "";
		}
	}

	function PostList(props) {
		const postsUrl = props.postsUrl;
		const params = new URLSearchParams(window.location.search);
		const selectedCategory = params.get("category");
		const [posts, setPosts] = React.useState([]);
		const [loading, setLoading] = React.useState(true);
		const [error, setError] = React.useState(null);

		React.useEffect(
			function() {
				let cancelled = false;

				fetch(postsUrl)
					.then(function(response) {
						if (!response.ok) {
							throw new Error(
								"Unable to load posts.json (HTTP " +
								response.status +
								")."
							);
						}

						return response.json();
					})

					.then(function(data) {
						if (cancelled) {
							return;
						}
						const postArray =
							Array.isArray(data) ?
							data :
							Array.isArray(data.posts) ?
							data.posts : [];

						let filteredPosts = postArray.slice();

						if (selectedCategory && selectedCategory !== "all") {
							filteredPosts = filteredPosts.filter(
								function(post) {
									if (Array.isArray(post.categories)) {
										return post.categories.includes(selectedCategory);
									}
									return (post.categories === selectedCategory);
								}
							);
						}
						filteredPosts.sort(
							function(a, b) {
								return (new Date(b.date || 0) - new Date(a.date || 0));
							}
						);

						const displayedPosts = selectedCategory ? filteredPosts : filteredPosts.slice(
							0, POSTS_TO_SHOW);

						setPosts(displayedPosts);
						setLoading(false);
					})

					.catch(function(fetchError) {
						if (!cancelled) {
							console.error(fetchError);

							setError(
								fetchError.message
							);

							setLoading(false);
						}
					});


				return function() {
					cancelled = true;
				};
			},

			[postsUrl]
		);


		if (loading) {
			return e(
				"p", {
					className: "text-body-secondary"
				},
				"Loading posts..."
			);
		}


		if (error) {
			return e(
				"div", {
					className: "alert alert-danger",
					role: "alert"
				},

				"The post list could not be loaded. " +
				error
			);
		}


		if (posts.length === 0) {
			return e("p", null, "No posts are currently available.");
		}
		const pageTitle = getPageTitle(selectedCategory);

		return e(
			React.Fragment,
			null,
			pageTitle ? e("h1",
              			  {className: "archive-title mb-4"},
              			  pageTitle): null,
			posts.map(
				function(post, index) {
					return e(
						PostPreview, {
							key: post.content_url || post.slug || post.title || index,
							post: post,
							isLast: index === posts.length - 1
						}
					);
				}
			)
		);
	}

	//Individual article component
	function Post(props) {
		const postUrl = props.postUrl;
		const [post, setPost] = React.useState(null);
		const [loading, setLoading] = React.useState(true);
		const [error, setError] = React.useState(null);

		React.useEffect(
			function() {
				let cancelled = false;
				fetch(postUrl)
					.then(function(response) {
						if (!response.ok) {
							throw new Error(
								"Unable to load article (HTTP " + response.status + ")."
							);
						}
						return response.json();
					})

					.then(function(data) {
						if (!cancelled) {
							setPost(data);
							setLoading(false);
						}
					})

					.catch(function(fetchError) {
						if (!cancelled) {
							console.error(fetchError);
							setError(fetchError.message);
							setLoading(false);
						}
					});


				return function() {
					cancelled = true;
				};
			},

			[postUrl]
		);

		if (loading) {
			return e(
				"p", {className: "text-body-secondary"},
				"Loading article..."
			);
		}

		if (error) {
			return e(
				"div", {
					className: "alert alert-danger",
					role: "alert"
				},
				"The article could not be loaded. " + error
			);
		}

		if (!post) {
			return e("p", null, "Article not found.");
		}

		const title = post.title || "Untitled";
		const author = post.author || "The High Screen";
		const date = formatDate(post.date);

		return e(
			"article", {
				className: "post-preview"
			},

			e(
				"header",null,
				e("h2", {className: "post-title"},title),
				e(
					"p", {className: "post-meta"},
					"Posted by ",
					e("span", null, author),
					date ? " on " + date : ""
				)
			),

			e("hr", {className: "my-4"}),
			e(
				"div", {
					className: "post-content",
					dangerouslySetInnerHTML: {
						__html: post.content || post.body || ""
					}
				}
			)
		);
	}


/*
* ------------------------------------------------------------
* React initialization
* ------------------------------------------------------------
*/
	/*
	 * HOMEPAGE
	 */
	const postListElement = document.getElementById("post-list");
	if (postListElement) {
		const postsUrl = postListElement.dataset.postsUrl;
		ReactDOM.createRoot(postListElement).render(
			e(PostList, {postsUrl: postsUrl})
		);
	}

	/*
	 * INDIVIDUAL POST PAGE
	 */
    const postElement = document.getElementById("post");
    if (postElement) {
        const params = new URLSearchParams(window.location.search);
        const postUrl = params.get("json");
        if (!postUrl) {
            ReactDOM.createRoot(postElement).render(
				e("div",{className: "alert alert-danger"},
					"No article was specified."
				)
        	);
        } else {
            ReactDOM.createRoot(postElement).render(
                    e(Post,{postUrl: postUrl})
            );
        }
    }

})();