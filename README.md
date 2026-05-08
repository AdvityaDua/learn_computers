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

NestJS backend with:

- MongoDB (Mongoose)
- JWT auth with role-based access (`admin`, `instructor`, `student`)
- CRUD for quizzes, assignments, and lessons
- Multer uploads for assignment and lesson assets
- Markdown-only description files for assignments and lessons (`.md`)

## Environment

Copy `.env.example` to `.env` and update values:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/learn_computers
JWT_SECRET=replace-with-strong-secret
PORT=3000
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
```

`FIREBASE_PRIVATE_KEY` must keep `\\n` escaped in `.env` exactly as shown.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Auth API

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`

Google login body example:

```json
{
  "idToken": "firebase-id-token-from-google-sign-in"
}
```

`/auth/google` verifies the Firebase ID token server-side, links/creates the user, and issues your backend JWT (`accessToken`).

Register body example:

```json
{
  "email": "admin@example.com",
  "password": "admin123",
  "fullName": "Admin User",
  "role": "admin"
}
```

Use `Authorization: Bearer <token>` for protected routes.

## Role Rules

- Admin can create, update, and delete quizzes/assignments/lessons.
- Any authenticated user can read quizzes/assignments/lessons.

## CRUD Endpoints

### Quizzes

- `POST /quizzes` (admin)
- `GET /quizzes`
- `GET /quizzes/:id`
- `PATCH /quizzes/:id` (admin)
- `DELETE /quizzes/:id` (admin)

### Assignments

- `POST /assignments` (admin, `multipart/form-data`)
- `GET /assignments`
- `GET /assignments/:id`
- `PATCH /assignments/:id` (admin, `multipart/form-data`)
- `DELETE /assignments/:id` (admin)

Form-data fields for assignments:

- `title` (text, required)
- `dueDate` (text ISO date, optional)
- `descriptionFile` (file, required on create, **must be `.md`**)
- `attachmentFile` (file, optional)

### Lessons

- `POST /lessons` (admin, `multipart/form-data`)
- `GET /lessons`
- `GET /lessons/:id`
- `PATCH /lessons/:id` (admin, `multipart/form-data`)
- `DELETE /lessons/:id` (admin)

Form-data fields for lessons:

- `title` (text, required)
- `type` (`documentation` or `video`, required)
- `externalVideoUrl` (text URL, optional)
- `descriptionFile` (file, required on create, **must be `.md`**)
- `documentFile` (file, optional)
- `videoFile` (file, optional)

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
