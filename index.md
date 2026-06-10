---
layout: default
title: Home
---

<h1>Distracted Fortune</h1>

{% assign posts = site.posts | sort: "date" | reverse %}
{% assign featured = posts.first %}

{% if featured %}
<section>
  <h2>Latest</h2>
  <h3><a href="{{ featured.url | relative_url }}">{{ featured.title }}</a></h3>
  {% if featured.excerpt %}
  <p>{{ featured.excerpt | strip_html | truncatewords: 40 }}</p>
  {% endif %}
  <p><a href="{{ featured.url | relative_url }}">Read more &rarr;</a></p>
</section>

<hr>
{% endif %}

<section>
  <h2>All Articles</h2>
  <ul>
    {% for post in posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      {% if post.excerpt %}&mdash; {{ post.excerpt | strip_html | truncatewords: 20 }}{% endif %}
    </li>
    {% endfor %}
  </ul>
</section>
