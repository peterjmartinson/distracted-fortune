---
title: "How to Build a Real Network"
date: 2026-04-13T13:00:00-05:00
excerpt: "Stop building products nobody needs.  Start hunting for problems instead.  You'll end up with both a product and a market.  I hope."
tags:
  - entrepreneurship
  - action
  - networking
categories:
  - Article
  - Entrepreneurship
featured_image: front_image.png
---

While wintering in Vermont this past New Year's Day, I built a product that all the LLMs told me would sell like crazy.

Each year, all publicly traded companies file a report [with the SEC](LINK edgar) affectionately called the 10-K.  It's a document packed with lawyerly language intended to comply with federal regulations while keeping all company hopes and fears secret.

One section, Item 1A, lays out all the risks the company foresees in the coming year.  For example, all companies that deal in physical products saw risk in the Trump Tariffs last year.  Some companies don't see any risk, and they'll say that.

Because these companies are all joint stock companies, they're afraid of the stock owners pulling cash due to perceived weaknesses.  Therefore, the Item 1A reads a bit like a script from the Netflix series [Succession](LINK) - lots of words, maximum ambiguity.

One big analyst job at hedge funds and other investment houses is to compare these sections year over year for a given company, and identify subtle differences that betray underlying problems or strengths.  These risk factors then inform the next investment steps in that company.

But it's tedious work.

Enter: [SigmaK](LINK)

I built a system that uses a vector database and an LLM to hunt down differences automatically.  It took about a month of evenings working with GitHub Copilot to build a working system.  A few weeks ago, I sent example reports to a few people and put up a [LinkedIn post](LINK) about it.

Crickets.

The lesson here is clear - don't build something that you're not certain people want.

## New Plan - Same as the Old Plan

While asking Gemini, ChatGPT, Grok, et al. for new ideas this past week, I got frustrated by how many times they suggested a variation of "compare 10-k filings year on year to identify risks".

People don't want this!  At least, I do not know anybody who wants it!

Fed up, I decided to instead come up with a strategy for growing my professional network into a potential client list.  The core of the networking strategy is to hunt for problems.

Long time reader(s) of Distracted Fortune (you know who you are, Rutiger) will remember that one of my first posts was on [Digging for Problems](LINK).  Well, the new plan is a more refined and targeted version of that, minus the hard rock mining component.

## The Cycle

Being highly motivated for about 10 minutes a day, and highly distractable all other times, I needed a system that would be low friction, cumulative, and atomic.

I worked with all the LLMs critiquing each other to come up with my current plan.  Note - Gemini, Grok, and Github Copilot are pretty nice to each other.  ChatGPT ALWAYS comes up with a way to say where the others fail.  Then, it typically just tells me a variation of what the others say.  Judgy.

On Monday, I'll spend about 30 minutes scouring LinkedIn, Reddit, and X for key words like "manual process", "old excel", "manual entry", "tedious", things like that.  When I find a person talking about a new problem, I add two Issues to my GitHub repo:  a Person issue and a Problem issue.  To link a person to a problem, I'll write the Problem issue number (e.g. #22) on the Person card.

Two days (and ideally two problems) later, I'll send a "zero-ask" email to the new people.  The email basically says "Hi, I'm researching operational pains in [your business domain].  What's one manual process you currently have that feels too brittle to touch?"  The text of the email is added as a comment on their Person card.

Finally, two days later - Friday, if you're counting - I'll send a "technical gift" email.  Whether the warm contacts sent a reply or not, I'll send them one sketched out solution to one of their problems.  "I've been thinking about your process, and came up with this solution.  No need to reply, just thought it would help!"  It doesn't even have to be a built solution, just a summary of how to handle it.

GitHub has a thing called "Projects", which looks and acts a lot like a Kanban board.  You might have seen these things in Jira, Trello, Monday, Asana, or some other productivity app.  Basically, it's a set of columns, with notes you can move between those columns.  Think, PostIt notes on a white board that you can move around.

My issues are those notes, and I have columns like "Discovery", "Problems Validated", "Warm Contact", "Garbage", etc.  I'll move them around as I send out emails, to keep track of which ones are in what phase.

Wash, rinse, repeat, each week, for 6 months or so.

## The Goal

Ideally, by the 6 month mark, I will have reached out to around 50 new people about a few dozen types of problems, and have gotten at least a few responses.  Those responses will be added as either new problem issues or comments on the Person issues.  And the issues will be arranged in my Project board to clearly identify what's hot and what's not.

Some responses will be a variation of "piss off".  But if even one of them is a positive response to an existing problem, I'll reach out again and see about building the solution.

More likely, I'll have identified a few problems that span multiple people.  And voila, I have not only a new viable product, but I'll also have an initial client base of people that will very likely pay cash dollars for the product.

However, as sage Mike Tyson points out, "everybody's got a plan until you get punched in the mouth."  It's time to put the strategy to the test of action.

Do you have a plan to build a network or get product ideas?  If so, please leave a comment.
