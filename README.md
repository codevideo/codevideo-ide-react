# @fullstackcraftllc/codevideo-ide-react

![NPM Version](https://img.shields.io/npm/v/@fullstackcraftllc/codevideo-ide-react)

React component for the CodeVideo IDE. Our first "nearly-complete" functionality component for replaying IDE sessions, complete with a file explorer, multiple editor tab support, and a terminal.

IT'S CRITICAL THIS SHIPS TO PRODUCTION ONLY AFTER CONFIRMING THERE ARE NO SSR ISSUES - MONACO IS INFAMOUS FOR SSR ISSUES!

Typically, this is caused by calling `monaco.editor` by accident, when the react ref `globalMonacoRef.current.editor.` can be used instead.

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

```ts

```js
require('@radix-ui/themes/styles.css');
```