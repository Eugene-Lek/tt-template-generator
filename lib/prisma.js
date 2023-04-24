import { PrismaClient } from '@prisma/client'

if (typeof window === "undefined") {
  if (process.env.NODE_ENV === "production") {
    var prisma = new PrismaClient();
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient();
    }

    var prisma = global.prisma;
  }
}

export default prisma;