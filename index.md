---
layout: default
title: Home
---

{% comment %}
  1. Filter out any broken files or templates that are missing titles.
{% endcomment %}
{% assign valid_posts = site.posts | where_exp: "item", "item.title != nil" | where_exp: "item", "item.title != ''" %}

{% comment %}
  2. Look for a post explicitly marked 'featured: true' in its front matter.
     If none is flagged, gracefully default to the latest valid post.
{% endcomment %}
{% assign featured_post = valid_posts | where: "featured", true | first %}
{% if featured_post == nil %}
  {% assign featured_post = valid_posts.first %}
{% endif %}

{% if featured_post %}
<section class="featured-section" style="margin: 2rem 0;">
  <p style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; color: #666; margin-bottom: 0.2rem; font-weight: bold;">Featured Article</p>
  <h2 style="margin-top: 0; font-size: 1.75rem;">
    <a href="{{ featured_post.url | relative_url }}">{{ featured_post.title }}</a>
  </h2>
  <p style="font-size: 0.85rem; color: #888; margin-top: -0.5rem;">{{ featured_post.date | date: "%B %d, %Y" }}</p>
  {% if featured_post.excerpt %}
  <p>{{ featured_post.excerpt | strip_html | truncatewords: 40 }}</p>
  {% endif %}
  <p><a href="{{ featured_post.url | relative_url }}">Read more &rarr;</a></p>
</section>

<hr style="border: 0; border-top: 1px solid #eee; margin: 2rem 0;">
{% endif %}

<section class="articles-section">
  <h2>All Articles</h2>
  <ul style="list-style-type: none; padding-left: 0; line-height: 1.8;">
    {% for post in valid_posts %}
    <li style="margin-bottom: 1rem; display: flex; align-items: baseline;">
      <span style="font-family: monospace; color: #666; margin-right: 15px; flex-shrink: 0;">{{ post.date | date: "%Y-%m-%d" }}</span>
      <div>
        <strong><a href="{{ post.url | relative_url }}">{{ post.title }}</a></strong>
        {% if post.excerpt %}
        <span style="color: #444; font-size: 0.95rem;"> &mdash; {{ post.excerpt | strip_html | truncatewords: 20 }}</span>
        {% endif %}
      </div>
    </li>
    {% endfor %}
  </ul>
</section>
