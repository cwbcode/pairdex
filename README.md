# Pairdex

Pairdex is an experimental VS Code extension exploring a different way to work with AI coding agents.

The goal is not to make Codex more autonomous. The goal is to make it feel more like a real pair programmer.

Right now, many agent-driven coding workflows hide too much of the process. Commands run in the background, terminal history is abstracted away, and the user ends up reviewing results after the fact instead of staying engaged in the work as it happens. That is efficient in one sense, but it can also make the developer feel disconnected from the reasoning, debugging, and command-line flow that actually builds programming skill.

Pairdex exists to push in the opposite direction.

## Project vision

The long-term idea is simple:

- keep the intelligence and conversational workflow of Codex
- move execution into a real, visible integrated terminal
- preserve the same basic UX of agent-assisted coding
- give the developer direct visibility into command history, output, and side effects
- make AI-assisted coding feel more like pair programming than delegation

In other words, Pairdex is aimed at people who want to use AI to accelerate development without turning themselves into a passive reviewer of hidden background work.

## Why this exists

This project started from a frustration with existing agent UX.

When an AI agent asks for permission to run a command, it often still executes that command in its own internal environment. Even when the user approves the action, the actual process remains partially hidden. That means:

- terminal history is not naturally preserved in the developer's own workspace
- stdout and stderr are filtered through another layer
- the user is kept away from the real command-line flow
- debugging becomes less tactile and less educational
- the AI starts to feel more like an opaque task runner than a collaborator

Pairdex is an attempt to see what a more transparent model would look like.

## Current state

This project is very early.

At the moment, Pairdex is not yet the finished "transparent Codex pair programmer" experience. It is currently a proof-of-concept VS Code extension scaffold with a working line of communication to the Codex app-server.

What works right now:

- the extension can run inside the VS Code Extension Development Host
- the project has a functioning TypeScript + esbuild watch/debug loop
- the extension can launch the bundled Codex CLI locally
- the extension can start `codex app-server`
- the extension can speak the app-server JSONL protocol over stdio
- the extension can initialize a session, create a thread, start a turn, and receive streamed response events
- streamed deltas and final responses have been observed successfully

What is not done yet:

- there is no polished chat UI
- there is no integrated-terminal execution bridge yet
- there is no clean rerouting of shell commands into a user-owned terminal
- there is no seamless replacement for Codex's current approval/execution behavior
- workspace grounding still needs improvement in some contexts
- response rendering is still debug-oriented rather than user-oriented

So the current version is best understood as:

**proof that a custom Codex-backed client experience is technically viable**

and not yet:

**the finished extension people would install for daily use**

## What has been proven already

The most important thing this project has established so far is that the Codex app-server is real, accessible, and usable from a custom VS Code extension.

That matters because it moves the idea from vague speculation to concrete engineering work.

This project is no longer asking:

"Would it be possible to build a custom Codex-oriented client experience in VS Code?"

It is now asking:

"What is the best UX for doing that in a way that improves transparency and keeps the developer in the loop?"

That is a much better question.

## Direction from here

The path forward is likely to happen in stages.

### Stage 1: stabilize the minimal client

The first step is to make the current app-server proof-of-concept cleaner and more reliable.

That means:

- better session and process lifecycle handling
- cleaner rendering of streamed deltas into readable responses
- more reliable workspace/cwd handling
- stronger error handling and output visibility
- basic commands for sending prompts and observing responses

The purpose of this stage is to turn the current "it works" prototype into a small but usable internal tool.

### Stage 2: build a visible execution model

Once the minimal client is stable, the next major milestone is the core Pairdex idea:

- when the agent wants to run a command, execution should happen in a real integrated terminal
- that terminal should belong to the user, not an invisible background layer
- the user should be able to inspect command history and side effects naturally
- terminal output should be available as context for follow-up agent reasoning

This is the actual heart of the project.

If this stage succeeds, Pairdex starts to become meaningfully different from existing "AI just does things in the background" tooling.

### Stage 3: design for pair programming, not delegation

The longer-term product question is not just technical. It is philosophical.

Pairdex should encourage a workflow where the developer remains engaged.

That likely means features like:

- clear command proposals before execution
- visible terminal-first workflows
- reviewable output and side effects
- explicit handoff points between agent reasoning and user action
- a UX that rewards understanding, not just approval clicking

The extension should not simply become another automation layer with a different skin.

It should make the user feel more involved, more informed, and more capable.

## What this project is not trying to be

Pairdex is not trying to be:

- a generic chatbot inside VS Code
- an unofficial clone of the official Codex extension
- an "AI does everything for you" agent wrapper
- a system that hides more work behind more abstraction

There are already plenty of tools pulling in that direction.

The point here is different.

Pairdex is trying to explore whether a coding agent can remain powerful while becoming more transparent and more compatible with human skill development.

## Intended audience

This project is for developers who:

- like AI-assisted coding but dislike hidden execution
- want to stay close to the terminal and debugging process
- want AI to feel like a collaborator, not a black-box worker
- care about learning and retaining engineering skill while using modern tools

That audience may be smaller than the general "vibe coding" crowd, but it is real.

## Current caveats

Everything here should be treated as experimental.

The extension is in active exploration. The architecture may change substantially. The eventual product shape may end up being:

- a companion layer around Codex
- a custom client backed by the Codex app-server
- or some hybrid approach depending on what proves technically and ergonomically viable

At this point, the main job of the project is to learn.

## Why the name "Pairdex"

The name reflects the central idea:

- **pair** for pair programming
- **dex** as a nod to Codex and agent-assisted coding

The emphasis is intentional. This project is about making AI coding workflows feel more like pair programming.

## Development status

Early prototype. Not ready for public use.

## Near-term TODO

- clean up the minimal app-server client
- improve workspace detection and context grounding
- render streamed responses more cleanly
- design the first usable command/input surface
- prototype terminal-owned execution flow
- evaluate how much of the desired UX can be achieved as an extension versus requiring a fuller custom client

## Long-term question

The core question behind Pairdex is:

**Can AI-assisted coding be made more transparent and more educational without giving up too much of its power?**

This repository is an attempt to find out.