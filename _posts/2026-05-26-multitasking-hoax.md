--- 
title: "Context Switching into Oblivion:  How to Manage Multitasking in the Agentic Era"
date: 2026-05-26
permalink: /context-switching-into-oblivion-how-to-manage-multitasking-in-the-agentic-era/
excerpt: Managing several projects at once, especially with AI Agents, can feel like a superpower.  Until you get overloaded at noon from all the context switching.  Here are some strategies to deal with this and regain control.
tags: 
categories: 
featured_image: front_image.jpg
---


When I first started this blog about 50 years ago, I thought about writing an article about multitasking.  To be precise, about how multitasking is a myth.

There is no multitasking, there is only rapid context switching.  And that quickly exhausts someone with a short attention span.

The punchline was, work on one thing for a while and don't switch contexts until you're done.

Well, this same problem has surfaced in the age of [agentic engineering](https://www.ibm.com/think/topics/agentic-engineering).

At first, telling a LLM agent like Claude or Codex about the program you wish you could have, then having them build it, feels like a superpower.  All of a sudden, projects that felt like a pie in the sky are now possible to build *TONIGHT*.

"I'll build more projects!"  Now you're spinning up several agents at a time, each working on something different.  My God, you think, I can build anything!

And then you start hitting the wall.  "What was this one doing?"

Personally, I tend to start feeling like just sitting and staring out the window, to let it all settle down.  But the urge to keep telling these agents what to do is almost irresistible - they don't work until you tell them what to do.  The bottleneck is my instructions!

There are a lot of words for this, like "infinite backlog", "prompt fatigue", or "agentic scope creep".  But it's nothing more than rapid context switching - classic multitasking.

Let's break down exactly why this artificial multitasking is bankrupting your focus, and look at some engineering constraints you can use to stop it.

## The Tax

Psychologists have studied the process of context switching in humans since the late 1900s.  Most of these studies involve people performing one task, switching to another, then switching back to the original.

For example, people were studied while reading numbers off a page in their native language, then in a second language, then back again in their native language.  [The researchers found that](https://www.andrew.cmu.edu/user/natashat/bilingualism/Meuter&Allport1999.pdf), not only did they take a longer time to recite in their second language, but they took even longer still when they flipped back to their mother tongue.

This lengthening of the amount of time to do something was termed the *cognitive tax*.  It's the result of the mind having to take several steps when moving attention from one task to another.

1. Goal Shifting - new task requires a new objective
2. Rule Activation - new task requires different skill set

The price of context switching can be less than a second, but if you're switching over and over, it adds up.  Plus, it takes mental effort to perform those two steps.

## Double Taxed

For those of us with ADHD, the tax can be an especially heavy burden.  I [wrote a while back](https://distractedfortune.com/why-you-wait-until-the-last-minute-and-how-to-get-back-to-work/) about how the ADHD brain works.  It takes extra effort to activate interest in someone with inhibited executive function.  This is why it's generally hard for us to focus in places like school or meetings.  But when something is especially interesting, we get engaged.  With only a little more energy, we get so engaged that the entire world can melt away - this is the state of "hyperfocus".

Programming a computer can be very effective in inducing hyperfocus.  Small, incremental changes layer on capabilities, and it feels a little like [the perfect transparent medium for creativity to manifest](https://medium.com/keqius-management-notes/the-mythical-man-month-da587977dc19).

Now, say we get interrupted in the middle of a hyperfocus session.  That attention immediately drops below the threshold, and we must now struggle to get interested and engaged in the new activity.  That's not to say we don't like to chit chat, we do!  But when we try to get back to the former activity, it can be extremely hard to get back over that interest threshold, not to mention going back into a hyperfocused state.

The feeling of productivity that comes from repeatedly prodding multiple AI agents to do more work is an illusion.  The agents are doing the work.  You are spending a limited tank of energy that isn't getting replenished, and burning loads of extra ATP (the brain's energy source) on just the switching part.  Eventually, you'll get zonked, frustrated, and possibly hit melancholy.

## How to Manage Agent Number One

So how do you deal with this?  Give up and become a painter?  Gallons of Red Bull?

There are a few strategies that all can work together, which I'll list below.  But the most important thing to realize is that the old way of programming is gone.  Over are the days of the coding hero.  Nobody can code more efficiently than an AI agent.

But that means that the programmer's job has changed, and in a way that benefits those of us that can hit hyperfocus more easily.

Here are a few strategies I've found to be most important, in this new agentic era.

1. Write Full Requirements Documents

As soon as the first steps of a major programming project are imagined, the ADHD brain wants to start smacking down some `for` loops and lambda functions.  But that's a trap.

Modern LLMs have huge context windows, and they're getting bigger all the time.  Perhaps there will be a limit in the future, but right now they're big enough for anything you would want to write to them.

For example, Claude Opus 4.7 can fit a million words into its context window.  That's _War and Peace_ by Leo Tolstoy.  The latest Grok model (4.20) can fit two million - that's _Harry Potter_.  The entire 7 book series.  The effective window is about 60% the maximum number of tokens, but that's still more than you're likely to write into the prompt window.

What this means is, you can throw a complete requirements doc into the LLM, and it won't flinch.

Instead of taking the time to write code, your job is to instead spend that time writing the requirements doc.  

2. Write the Requirements with LLMs

And, since LLMs are so great at taking a rough idea and smoothing it out into prose, you can go back and forth with the LLM refining the requirements doc.

Spend 10 minutes [yapping into a recording device](https://distractedfortune.com/this-one-ability-is-a-superpower-and-you-already-have-it/) to flesh out your idea.  Just say everything that comes to mind about your idea, including the kind of toilet paper you're about to use (we know where you use your phone).  Then dump that into Gemini and ask it to convert it into a first draft.

Then, read through it and flag things you think sound off, or missing, or just not what you want.  Then, stick that version back into the LLM and tell it to rewrite.  Then, stick the doc back in, and tell the LLM to find the problems.  Here's a prompt:

```
Act as a strict QA engineer and technical product manager. Review the attached requirements document and identify every area that is fuzzy, ambiguous, or prone to edge-case failures.

Specifically, flag any requirement that lacks clear constraints or cannot be immediately translated into a definitive pass/fail unit test.

Output a bulleted list. For each issue, provide:

The exact quote from the document.

Why it is dangerously vague or problematic.

A direct question the author must answer to resolve the ambiguity.
```

Do a few rounds of revision like this until the document looks pretty good.  If it gets too complicated, tell the LLM to summarize in a way that doesn't lose the meaning, but is better understood for someone whose attention is flagging.

3. Ensure Atomicity

So you're afraid that Codex will go off the reservation and start reprogramming your operating system while you read a book?

There's no foolproof way to prevent that, but one way to minimize the risk is to break the requirements into atomic pieces and iterate.  After each iteration, the program should be left in a "walking skeleton" state - it runs from end to end, and the tests all pass.

Here's an appropriate prompt:

```
Act as a lead software architect. Break the attached requirements document down into a strict, sequentially ordered list of small development Issues.

You must adhere strictly to the principle of Incremental Stability:

1. Issue 1 must build a 'walking skeleton'—the absolute bare-minimum end-to-end structure.

2. Each subsequent Issue must add only a single layer of complexity.

3. The application must remain in a 100% reliable, runnable state at the completion of every individual Issue.

For each Issue, provide a short title, a one-sentence goal, and the specific pass/fail unit test required to serve as technical documentation for that feature's behavior.
```

If you have the LLM running through atomic steps, then when you come back to it and it's inevitably stopped somewhere, you can quickly find out where it stopped (just ask it), and kick it off again without having to answer "what needs to be done next?".

4. Issue Driven Development

Now that you have your requirements mapped out, and broken into a sequence of issues, you pump them all into the all powerful coding agent!  Right!?

Wrong.  You have to treat the LLM like a _wunderkind_ junior developer, who might get overwhelmed with a massive project.  Feed the agent one issue at a time.  Force it to complete that one issue, and hand you a fully functional walking skeleton application.

One way to enforce this is to prevent the LLM from committing the changes to your version control system, like Git.  The main coding agents have a way to enforce certain behaviors.  While every AI coding tool handles this differently, you can usually set hard boundaries.

For example, if you use GitHub Copilot in Visual Studio Code (my personal setup), you can put some guardrails into a file called `copilot-instructions.md` located in a `.github` directory at your project root.  GitHub Copilot automatically reads that file before following any prompt, so there you can say something like

```
After completing any Issue driven change, present the user with a clean commit
message. IMPORTANT - *You do not commit. Only the user commits.* Your job is to
change code and offer a commit message to report your changes.  Do not begin
working on the next Issue until the user explicitly provides it.
```

If you went and ate one of those poisonous Federal Donuts someone left in the office pantry while Copilot was working, now when you come back to your desk, you have a nice summary of what was done.  You commit, then feed the next issue into the agent.

5. Externalize Your Working Memory (Test Driven Development)

For an ADHD brain, working memory gets wiped the second you walk away from the screen. If it's tough to remember where you were and where you're going, force the LLM to act as your external RAM.

Unit tests are the living documentation for an application's behavior.

Before you leave your desk, if the LLM is paused, make it write one failing unit test for the next issue.  That way, when you come back, you can just run the test suite to see what's failing, and jump start the LLM on the next issue by making that test pass.

At the end of the day, the workplace is still filled with distractions.  Even with these tips, a good programmer can get burned out from switching tasks all morning.  If you find yourself staring out the window, mind flitting from the past to the future, unable to concentrate on the next task your LLM agent was supposed to do, go take a break.  You deserve it.

At the end of the day, the workplace is still filled with distractions. Even with these guardrails, managing agents takes real executive function, and you can still burn out. If you find yourself staring out the window, unable to concentrate on the next step, simply get up and walk away. Because you are now running a system instead of just prompting a chatbot, you aren't leaving behind a broken application and a tangled mess of half-finished prompts. You have a stable, runnable walking skeleton, and a failing test waiting to tell you exactly what to do tomorrow.

_If you liked this article, please subscribe and share with one friend_
