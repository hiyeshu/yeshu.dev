---
title: "A Skill Is an Agent's QR Code"
description: "A skill is not an advanced prompt package. It is a small, scannable entry point that expands into capabilities, workflows, CLI tools, and services."
pubDate: "2026-06-17"
lang: "en"
translationKey: "skill-is-agent-qr-code"
routeSlug: "skill-is-agent-qr-code"
sourceSlug: "skill-is-agent-qr-code"
listed: true
generatedTranslation: false
tags:
  - "AI"
  - "Agent"
  - "Skill"
draft: false
---

I used to think of a skill as a more advanced prompt package.

That no longer feels quite right.

It is more like a QR code in the world of agents.

The black-and-white image of a QR code is not interesting by itself. No one stares at a QR code to admire its composition. Its value is that a small, standardized, machine-readable code can open something much larger.

Scan it, and it may open a web page.

Scan it, and it may start a payment.

Scan it, and it may take you into an ordering system, a membership page, a form, a map, or customer support.

A QR code is not the content.

A QR code is the entrance.

A skill works the same way.

At its smallest, a skill is just a folder with a `SKILL.md` file inside. The YAML at the top of that file may contain only two lines:

```yaml
name:
description:
```

That is all.

When an agent starts, it does not load the whole skill into the system prompt. It first sees only the metadata: the name, the description, and the rough trigger boundary. A few dozen tokens hang there.

Like a row of QR codes on a wall.

The user says something. The agent decides the task matches a skill. Only then does it scan. After the scan, the full instructions, workflow, scripts, templates, CLI, and references unfold.

So the key question is not how much prompt is inside the skill.

The key question is whether the skill can be scanned correctly.

If a QR code is placed in the wrong spot, nobody opens the page behind it. If a skill's `name` and `description` are imprecise, it does not matter how much process is packed inside. The agent will not call it.

This is what makes skills interesting.

They are not just prompts.

They are entry design.

A restaurant puts a QR code on the table. The customer scans it to order. That QR code is not just a tool. It changes the service flow. The front desk asks one fewer question. The kitchen knows a little earlier. A set meal can be placed more visibly. A membership system can attach itself naturally.

Once a QR code becomes stable, it is no longer only an entrance.

It becomes part of the business.

Skills will move in the same direction.

At first, people treat them as convenience tools: write a report, inspect code, generate images, organize a project, run a script.

Later, they become a distribution surface.

Writing a skill is not merely writing a prompt. You are defining a scene:

Who needs you, and when.

Which task makes the agent remember you.

What capability you provide.

What the user sees after invocation.

That has commercial value.

Because an entrance is already a form of content.

A skill can include your own CLI. It can carry a brand explanation. It can expose a service entry. It can include a sponsor line or a paid support note.

This is easier to accept than stuffing ads into the model.

Ads injected into the model feel wrong. The user did not ask for them. The model has no reason to say them. A conversation is solving a problem, and suddenly a flyer appears. Trust breaks.

A skill is different.

The user chose to install it. It has a name, a description, a folder, and a boundary. The user knows whose code they are scanning.

Putting your CLI inside a skill is like putting a knife you made into a toolbox.

Putting a sponsor link inside a skill is like adding a sponsor link to an open-source README.

That is not secretly polluting the model.

That is expressing yourself inside a clear entry point.

The boundary is exactly here.

An ad cannot pretend to be a capability.

Promotion cannot overpower the task.

A skill cannot drag the user somewhere unrelated to the current problem.

A QR code can sit on a menu.

But if the user scans a menu and lands on a loan page, that is not entry design. That is deception.

A good skill should be like a good QR code:

Small.

Clear.

Scannable.

Useful after the scan.

It does not need to explain everything at the entrance.

It only needs to let the agent know, at a glance:

When this thing should be opened.
