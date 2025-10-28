# hathor-demo
This repository holds the hotsite for the Bet blueprint demo application built using the Hathor framework.

## Running

### Local environment

#### System dependencies
```
Node: 22x
yarn: v4 (yarn-berry)
```

#### Install nix (preferred)

For a better developer experience we suggest nix usage for managing the environment. Visit this [link](https://nixos.org/download/#download-nix) to download it.

To enable the commands `nix develop` and `nix build` using flakes, add the following to your `/etc/nix/nix.conf` file:

```yaml
# see https://nixos.org/manual/nix/stable/command-ref/conf-file
sandbox = true
experimental-features = nix-command flakes
```

#### Install dependencies and run
To initialize nix dev environment:
```sh
$ nix develop
```
then, install the dependencies and run:
```sh
yarn
yarn workspace bet-dapp run dev
```

### Snap Tester
To run the Snaps QA, you need to activate the `SNAP_TEST` environment variable:
```sh
$ SNAP_TEST=true yarn workspace bet-dapp run dev
```

And then navigate to `http://localhost:3000/snaps-test`.
