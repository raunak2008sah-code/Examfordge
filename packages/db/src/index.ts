import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

const createPrismaClient = () => {
  const client = new PrismaClient();

  return client.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (
            [
              'User',
              'Exam',
              'ExamVersion',
              'Question',
              'Attempt',
              'UploadedFile',
              'ParserJob',
              'ReviewQueue',
            ].includes(model)
          ) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (
            [
              'User',
              'Exam',
              'ExamVersion',
              'Question',
              'Attempt',
              'UploadedFile',
              'ParserJob',
              'ReviewQueue',
            ].includes(model)
          ) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          if (
            [
              'User',
              'Exam',
              'ExamVersion',
              'Question',
              'Attempt',
              'UploadedFile',
              'ParserJob',
              'ReviewQueue',
            ].includes(model)
          ) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (
            [
              'User',
              'Exam',
              'ExamVersion',
              'Question',
              'Attempt',
              'UploadedFile',
              'ParserJob',
              'ReviewQueue',
            ].includes(model)
          ) {
            return (client as any)[model].update({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (
            [
              'User',
              'Exam',
              'ExamVersion',
              'Question',
              'Attempt',
              'UploadedFile',
              'ParserJob',
              'ReviewQueue',
            ].includes(model)
          ) {
            return (client as any)[model].updateMany({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
      },
    },
  });
};

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ExtendedPrismaClient | undefined;
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
