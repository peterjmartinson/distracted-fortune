--- 
layout: post
title: "How to Identify the Bottlenecks and Fix the Problem: From WordPress to GitHub"
date: 2026-06-23
permalink: /wordpress-to-github/
excerpt: "Check out the new site!  You don't care that I moved my whole blog from WordPress to GitHub, but you can appreciate and apply the lessons to your own projects."
tags:
  - productivity
  - process improvement
categories:
  - Article
  - Economics
featured_image: /assets/post-images/2026-06-23-samothrace-winged-victory.jpg
---

_May 25th email:  "Your premium web hosting will auto-renew on May 31st for $131.88."_

_Pretty steep, but I can live with that._

_June 1st email:  "Your premium web hosting will auto-renew on June 14th for $215.76."_

_What the hell?_

When I started this blog, [WordPress](https://wordpress.com/) was the way to go.  I already had some experience with the free version when I started my [Stone Telescope](https://stonetelescope.wordpress.com), so I wanted to transfer my skills to the full, "self hosted" version.  And I wanted my own domain, [distractedfortune.com](https://distractedfortune.com).

I found in [Hostinger](https://www.hostinger.com/) a one-stop solution with a great introductory price.  $25 per year for two years, including domain, full WordPress hosting, and a business email address.  It was a no brainer, and Distracted Fortune was born.

Fast forward to the end of the honeymoon.

In the past few weeks, I moved my blog off Hostinger and WordPress, and onto [GitHub](https://www.github.com) [Pages](https://docs.github.com/en/pages).  My domain and email address are still hosted on Hostinger but at a fair price.

This article will describe how I came to the decision to make the jump, and what general tactics can be drawn from the experience.  Transferable skills, if you wills.

## 1. Bend the Current Process to Your Will

I compose my articles in the [Vim](https://www.vim.org/) editor using [Markdown](http://www.aaronsw.com/weblog/001189) syntax.  I then save my work on GitHub.  It's a very coder workflow.

The problem is, getting those Markdown articles then into WordPress incurs a lot of friction.  Log into the WordPress dashboard, create a new post, copy my Markdown into the clipboard, click into the WordPress "block editor", find the "Markdown" block, paste my text, cut and paste the title into the title section, pick a featured image, go have lunch, pick a category and some tags, write in the excerpt, and finally schedule the thing to publish at a certain time.  And, of course, since it's a web interface, I have to spend time finding where to click to do a few of these things.

It's not impossible, I did it over and over for a long time.  But it's just not optimal.

[The way you use Git is](https://git-scm.com/book/en/v2), you save your work, commit your changes to the branch, push up to GitHub.com, open a Pull Request, and finally merge the branch to the master branch.  I wanted to make posting the article an automatic action that happened when I raised the PR.

In other words, I wanted to create a kind of pipeline.  I write the article the way I want, and it automatically gets sent to WordPress.

Ultimately, I made my coding agent write a [GitHub workflow](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows) that did just that.  I still had to go into the WordPress editor, make sure nothing was lost in translation, and schedule the publish.  But it reduced a lot of friction.

Later, I added a workflow that also created a newsletter.  The newsletter is targeted at my subscriber(s).  The actual emailing is done with [Jetpack newsletter](https://jetpack.com/newsletter/).

The pipeline worked.  However, it was a new abstraction layer just to move text from point A to point B.

## 2. Identify One Source of Friction, and Simplify It

That newsletter was kind of a pain.

I don't want you to be able to see it on the blog - it's a special gift to those who actually take a moment to subscribe.  So, I have a setting so anything with category "Newsletter" doesn't appear on the main feed.

Next, I want emails to get sent for both newsletters and for regular articles.  But, I only want the excerpt to go out for the article - you gotta go to the blog to read that!  In Jetpack, this means you need to flip a switch back and forth for each email, whether to send the whole article or just the excerpt.

Pain.

So I hunted for an alternative.  Ultimately, I found [Buttondown](https://buttondown.com).

Buttondown is just an emailer.  You basically write up an email, stick in a bunch of recipients, and schedule the send.  You can even import a subscriber list of emails.

This is when it hit me - I don't actually need to do ANY emailing from WordPress.  I can send both the newsletters and the article excerpts with Buttondown.  Since the newsletters never even touch the blog, I don't have to mess around with the categorical hiding thing or the annoying Jetpack switching.  I even got a subscription form on my blog that sends emails directly to Buttondown.

And I could manage the whole flow from the GitHub workflows.  All WordPress had to do from now on was display my articles.

That de-linking was my first taste of true freedom.

## 3. Precisely Define What Your Process Does, Then Solve That

When I got that balloon bill from Hostinger, I scrambled to find a different webhost.  Sure, maybe they made a billing error, but even $100+ for a blog that doesn't earn any income just doesn't make sense.

Eventually I settled on [Namecheap.com](https://namecheap.com), which will host your blog for about $3/month.  All I had to do now was extract my WordPress data from Hostinger, and load it onto Namecheap.

[Gemini](https://gemini.google.com) convinced me it would be easy, and, of course, free.

It was neither.

First, extracting the zipped up data from Hostinger was actually pretty straight forward with a plugin that will remain unnamed.  When it came time to upload that zip file to Namecheap, that same plugin demanded $25.  After fighting with it for a while, I found another plugin to unzip the data onto my personal computer, and yet another to finally upload the data to Namecheap.

No problem!  Except it took me three late nights to figure it out.

On the final late night, I could not figure out how to get the site to display at my domain.  I changed all the CNAMEs and AAAAs and whatever, but still couldn't get it to work.

My blog was down!

The next day I hunted for solutions.  Finally it dawned on me.  The only thing I needed was some way to display my text articles at my domain (distractedfortune.com).  I didn't really need all the bells and whistles of WordPress.

Maybe I don't need WordPress at all.  I just need a static site generator that's easy to maintain.  Like [GitHub Pages](pages.github.com).

GitHub Pages allows you to design a clean website using code templates.  All changes, like posting a new article, are managed through pull requests.  All my articles and images were already up on my GitHub repository, so this was actually perfect.

I just forgot about the WordPress data, and created a new GitHub Pages site that points to my domain.  There was some monkeying around with code to get things organized and displayed properly.  Some things don't come out of the box:

* Commenting - this is done through configuring [Giscus](https://giscus.app/).

* Analytics - I used to get all my stats through Jetpack.  But, [Google Analytics](https://marketingplatform.google.com/about/analytics/) does the same thing, with more fidelity.

* My Mug Store - I can use [Shopify](https://shopify.dev/docs/storefronts/themes/tools/github) to get this going again, though not a priority.

## Lessons to be learned

Now I think my site looks and functions better than ever!  And it completely fits my full workflow now.

Here are the lessons to be learned:

0. NOW is better than PERFECT

The original WordPress setup was clunky, but it was necessary to get my first articles out the door and into the wild.  It was like the lumbering body of the caterpillar.

1. Automate part of the process

After working with that old system, identify one thing you wish you could do to make it better.  Then, force that one thing onto it.

For me, that was "deploying" articles from GitHub instead of using that clunky WordPress block editor.

2. Find a source of friction, and kill it.

My newsletter thing was a pain to maintain.  So, I found an alternative.  Finding the alternative helped me see clearly where my needs ended and the bloat began.

3. Precisely Define Your Needs

When I finally understood that my blog was really just a collection of simple articles, I realized I didn't actually need all the overhead of WordPress anyhow.  That whole system was just an abstraction on top of the blog I was trying to maintain.

So, strip down what you are actually trying to do, and attempt to see clearly what you need.  Then, ideally, solutions will become apparent.

Now take a look at one of your own workflows.  Where are you paying a massive tax to which you've become accustomed, for bells and whistles that you don't even use?

Maybe now is the time to find your core deliverable, strip away the bloated system sitting on top of it, and get back to basics.

If you have any examples of your own, please put them in the comments below.  Thanks for reading!
