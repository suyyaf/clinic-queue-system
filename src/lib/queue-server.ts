import { prisma } from "./prisma";
import { getTodayDate } from "./queue";

export async function getNextQueueNumber(): Promise<number> {
  const date = getTodayDate();
  const counter = await prisma.dailyCounter.upsert({
    where: { date },
    update: { counter: { increment: 1 } },
    create: { date, counter: 1 },
  });
  return counter.counter;
}
