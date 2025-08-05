source 'https://rubygems.org'

# GitHub Pages Jekyll
gem 'github-pages', group: :jekyll_plugins

# Jekyll plugins
group :jekyll_plugins do
  gem 'jekyll-sitemap'
  gem 'jekyll-feed'
  gem 'jekyll-seo-tag'
end

# Performance and compatibility
gem 'webrick', '~> 1.7' # Required for Ruby 3.0+

# Deployment and development
group :development do
  gem 'rake'
end

# Platform specific
platforms :ruby do
  gem 'wdm', '>= 0.1.0' if Gem.win_platform?
end
