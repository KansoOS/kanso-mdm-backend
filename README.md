<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

Prérequis : Node 22, Docker.

```bash
$ cp .env.example .env
$ npm install
```

Deux secrets sont obligatoires dans `.env` : l'app refuse de démarrer tant qu'ils ne sont pas remplacés (les valeurs `change_me` de l'exemple sont volontairement invalides).

```bash
$ openssl rand -base64 48   # JWT_SECRET (32 caractères minimum)
$ openssl rand -base64 32   # TOTP_ENCRYPTION_KEY (exactement 32 octets en base64)
```

`TOTP_ENCRYPTION_KEY` chiffre les secrets TOTP et sert à hacher les codes de secours : la perdre ou la changer bloque la connexion de tous les comptes ayant activé le TOTP (secrets et codes de secours deviennent illisibles). Il n'y a pas de rotation de clé pour l'instant.

## Lancer le projet

### Avec Docker (recommandé)

Deux profils, deux fichiers compose distincts :

- **`docker-compose.yml`** (défaut, sans `-f`) → **dev** : hot-reload (`nest start --watch`), code monté en volume, DB Postgres incluse.
- **`docker-compose.prod.yml`** → **prod** : build compilé (`nest build` → `node dist/main`), image figée, doit être appelé explicitement avec `-f`.

```bash
# dev (par défaut)
$ docker compose up -d --build   # build + démarre en arrière-plan
$ docker compose logs -f         # suit les logs
$ docker compose down            # stoppe

# prod (explicite)
$ docker compose -f docker-compose.prod.yml up -d --build
$ docker compose -f docker-compose.prod.yml logs -f
$ docker compose -f docker-compose.prod.yml down
```

Sans `-f` (ou via les scripts `docker:*` sans `:prod`), Docker Compose prend `docker-compose.yml` = **dev**. Pour cibler la prod, il faut préciser `-f docker-compose.prod.yml` (ou utiliser les scripts `docker:prod:*` équivalents).

Les deux profils exposent l'app sur le même port par défaut (`APP_PORT`, 3000) et Postgres sur le même port (`POSTGRES_PORT`, 5432) : un seul des deux à la fois, sauf si tu changes ces variables dans `.env`.

### En local (sans Docker)

```bash
$ docker compose up -d db   # démarre juste Postgres via Docker
$ npm run start:dev         # NestJS en watch mode

# autres modes
$ npm run start        # development, sans watch
$ npm run start:prod   # nécessite un build préalable (npm run build)
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
