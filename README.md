# @fullstackcraftllc/codevideo-ide-react

![NPM Version](https://img.shields.io/npm/v/@fullstackcraftllc/codevideo-ide-react)

React component for the CodeVideo IDE. Our first "nearly-complete" functionality component for replaying IDE sessions, complete with a file explorer, multiple editor tab support, and a terminal.

IT'S CRITICAL THIS SHIPS TO PRODUCTION ONLY AFTER CONFIRMING THERE ARE NO SSR ISSUES - MONACO IS INFAMOUS FOR SSR ISSUES!

Typically, this is caused by calling `monaco.editor` by accident, when the react ref `globalMonacoRef.current.editor.` can be used instead.

## Examples

There is a Gatsby site (in this repo under the `./example` folder) featuring the CodeVideoIDE component in various configurations. 

In `step` mode using the arrow keys to navigate through steps:

[https://codevideo.github.io/codevideo-ide-react/step](https://codevideo.github.io/codevideo-ide-react/step)

In `replay` mode, starting a full replay with sound as soon as the page is interacted with:

[https://codevideo.github.io/codevideo-ide-react/replay](https://codevideo.github.io/codevideo-ide-react/replay)

In `replay` mode compatible with puppeteer recording callbacks, starting a full replay with sound as soon as the page is interacted with:

[https://codevideo.github.io/codevideo-ide-react/puppeteer](https://codevideo.github.io/codevideo-ide-react/puppeteer)

In `replay` mode with a **simulated LLM stream** appending actions to a growing array while playback runs (the `isStreaming` prop):

[https://codevideo.github.io/codevideo-ide-react/streaming](https://codevideo.github.io/codevideo-ide-react/streaming)

## Quickstart (working on this repo)

```bash
git clone https://github.com/codevideo/codevideo-ide-react.git
cd codevideo-ide-react
nvm use          # pins Node 22 (.nvmrc)
npm install
npm test         # full jest suite
npm run example:local   # build the lib + run the example app against it
```

> **Note:** the library itself builds and tests on Node 20-23, but the
> `example/` Gatsby app needs Node 20 or 22 - Gatsby's lmdb dependency
> crashes on Node 23+ (`"length" is outside of buffer bounds`).
> `npm run example:local` guards for this and tells you what to do.


## Streaming actions (live-generated content)

The component is fully controlled: the parent owns `currentActionIndex` and
advances it from `actionFinishedCallback`. With the `isStreaming` prop you can
feed it a **growing** actions array (e.g. generated live by an LLM) and
playback continues seamlessly across appends:

- appends never restart the current animation (detection is content-based, so
  Redux-style immutable array rebuilds work)
- when playback runs out of actions it idles ("buffering") instead of calling
  `playBackCompleteCallback`, and resumes automatically on the next append
- set `isStreaming` back to `false` once the stream ends to restore normal
  completion semantics

See [`example/src/pages/streaming.tsx`](example/src/pages/streaming.tsx) for a
complete working simulation - the exact wiring a real streaming consumer uses.

## Regression testing (golden render)

Beyond the jest suite, visual/timing behavior is guarded by a golden-render
workflow: a deterministic fixture rendered to video via
[codevideo-cli](https://github.com/codevideo/codevideo-cli) and compared
against a known-good reference (duration + keyframe contact sheets). See
[`scripts/golden/README.md`](scripts/golden/README.md) - no API keys required.

## Installation

Install the package itself via npm:

```bash
npm install @fullstackcraftllc/codevideo-ide-react
```

Ensure that you include radix CSS in your project. For frameworks like Next.js, you can include this in the root of your project:

```ts
import "@radix-ui/themes/styles.css";
```

For Gatsby, add this to your `gatsby-browser.js` and `gatsby-ssr.js` files:

```js
require('@radix-ui/themes/styles.css');
```