# How to build an app with Safe and ERC-7579

This example app shows how to create a web app for using ERC-7579 in your Safe. Please read [How to build an app with Safe and ERC-7579](https://docs.safe.global/advanced/erc-7579/tutorial) to see how this app was created.

## What you’ll need

**Prerequisite knowledge:** You will need some basic experience with [React](https://react.dev/learn), [Next.js](https://nextjs.org/docs), and [ERC-7579](https://docs.safe.global/advanced/erc-7579/overview).

Before progressing with the tutorial, please make sure you have:

- Downloaded and installed [Node.js](https://nodejs.org/en/download/package-manager) and [pnpm](https://pnpm.io/installation).
- Created an API key from [Pimlico](https://www.pimlico.io/).


## Getting Started

To install this example application, run the following commands:

```bash
git clone https://github.com/5afe/safe-7579-tutorial.git
cd safe-7579-tutorial
pnpm i
```

Open `app/page.tsx` and add two private keys and your Pimlico API key.

Run the local development server with the following command:

```bash
pnpm dev
```

Go to `http://localhost:3000` in your browser to see the application.

## Help

Please post any questions on [Stack Exchange](https://ethereum.stackexchange.com/questions/tagged/safe-core) with the `safe-core` tag.

## License

MIT, see [LICENSE](LICENSE).
