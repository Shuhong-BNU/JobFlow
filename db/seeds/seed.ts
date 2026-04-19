import "dotenv/config";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  applicationEvents,
  applicationNotes,
  applications,
  companies,
  offers,
  userCredentials,
  users,
} from "@/db/schema";

async function main() {
  const db = getDb();
  const demoEmail = "demo@jobflow.local";
  const demoPassword = "Demo12345!";

  let [existingUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.email, demoEmail))
    .limit(1);

  if (!existingUser) {
    const passwordHash = await hash(demoPassword, 10);

    [existingUser] = await db
      .insert(users)
      .values({
        name: "Demo User",
        email: demoEmail,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    await db.insert(userCredentials).values({
      userId: existingUser.id,
      passwordHash,
    });
  }

  const existingApplications = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.userId, existingUser.id))
    .limit(1);

  if (existingApplications.length > 0) {
    console.log(`Seed skipped: ${demoEmail} already has application data.`);
    console.log(`Demo account: ${demoEmail} / ${demoPassword}`);
    return;
  }

  const [byteDance, meituan, tencent, shopee, ant] = await db
    .insert(companies)
    .values([
      {
        userId: existingUser.id,
        name: "ByteDance",
        website: "https://jobs.bytedance.com",
        industry: "Internet",
        location: "Beijing",
      },
      {
        userId: existingUser.id,
        name: "Meituan",
        website: "https://zhaopin.meituan.com",
        industry: "Internet",
        location: "Beijing",
      },
      {
        userId: existingUser.id,
        name: "Tencent",
        website: "https://join.qq.com",
        industry: "Internet",
        location: "Shenzhen",
      },
      {
        userId: existingUser.id,
        name: "Shopee",
        website: "https://careers.shopee.sg",
        industry: "E-commerce",
        location: "Singapore",
      },
      {
        userId: existingUser.id,
        name: "Ant Group",
        website: "https://career.antgroup.com",
        industry: "Fintech",
        location: "Hangzhou",
      },
    ])
    .returning({
      id: companies.id,
      name: companies.name,
    });

  const [app1, app2, app3, app4, app5] = await db
    .insert(applications)
    .values([
      {
        userId: existingUser.id,
        companyId: meituan.id,
        title: "AI 产品实习生",
        location: "北京",
        source: "official_site",
        sourceUrl: "https://zhaopin.meituan.com",
        employmentType: "internship",
        currentStatus: "wishlist",
        priority: "critical",
        deadlineAt: new Date("2026-04-24T00:00:00+08:00"),
        notes: "需要针对产品 sense 和 A/B 测试经历更新简历。",
      },
      {
        userId: existingUser.id,
        companyId: byteDance.id,
        title: "推荐算法实习生",
        location: "北京",
        source: "referral",
        employmentType: "internship",
        currentStatus: "applied",
        priority: "high",
        appliedAt: new Date("2026-04-16T00:00:00+08:00"),
        deadlineAt: new Date("2026-04-28T00:00:00+08:00"),
        referralName: "学长内推",
        notes: "已投递，等待筛选结果。",
      },
      {
        userId: existingUser.id,
        companyId: tencent.id,
        title: "数据科学实习生",
        location: "深圳",
        source: "job_board",
        employmentType: "internship",
        currentStatus: "oa",
        priority: "high",
        appliedAt: new Date("2026-04-10T00:00:00+08:00"),
        notes: "周末完成 OA，重点准备 SQL 与概率题。",
      },
      {
        userId: existingUser.id,
        companyId: shopee.id,
        title: "产品运营培训生",
        location: "新加坡",
        source: "official_site",
        employmentType: "campus_program",
        currentStatus: "interview",
        priority: "medium",
        appliedAt: new Date("2026-04-07T00:00:00+08:00"),
        notes: "已约一面，需要准备英文自我介绍。",
      },
      {
        userId: existingUser.id,
        companyId: ant.id,
        title: "商业分析师",
        location: "杭州",
        source: "campus",
        employmentType: "full_time",
        currentStatus: "offer",
        priority: "high",
        appliedAt: new Date("2026-03-20T00:00:00+08:00"),
        notes: "已进入 offer 答复期，需要对比地点与成长性。",
      },
    ])
    .returning({
      id: applications.id,
      title: applications.title,
      companyId: applications.companyId,
    });

  await db.insert(applicationEvents).values([
    {
      userId: existingUser.id,
      applicationId: app1.id,
      eventType: "deadline",
      title: "Meituan · AI 产品实习生 截止日期",
      description: "MVP 自动同步的 deadline 事件。",
      startsAt: new Date("2026-04-24T00:00:00+08:00"),
      reminderAt: new Date("2026-04-23T09:00:00+08:00"),
      status: "scheduled",
    },
    {
      userId: existingUser.id,
      applicationId: app2.id,
      eventType: "follow_up",
      title: "跟进字节跳动投递结果",
      description: "如果一周内无反馈，主动发起一次 follow-up。",
      startsAt: new Date("2026-04-23T11:00:00+08:00"),
      status: "scheduled",
    },
    {
      userId: existingUser.id,
      applicationId: app3.id,
      eventType: "oa",
      title: "完成腾讯 OA",
      description: "周六晚 8 点前完成并复盘。",
      startsAt: new Date("2026-04-19T18:30:00+08:00"),
      status: "scheduled",
    },
    {
      userId: existingUser.id,
      applicationId: app4.id,
      eventType: "interview",
      title: "Shopee 一面",
      description: "远程视频面试，重点准备用户增长案例。",
      startsAt: new Date("2026-04-20T14:00:00+08:00"),
      endsAt: new Date("2026-04-20T15:00:00+08:00"),
      status: "scheduled",
    },
    {
      userId: existingUser.id,
      applicationId: app5.id,
      eventType: "offer_response",
      title: "Ant Offer 回复截止",
      description: "需要在答复前完成 offer 对比。",
      startsAt: new Date("2026-04-22T18:00:00+08:00"),
      reminderAt: new Date("2026-04-21T10:00:00+08:00"),
      status: "scheduled",
    },
  ]);

  await db.insert(applicationNotes).values([
    {
      userId: existingUser.id,
      applicationId: app4.id,
      noteType: "interview_feedback",
      content: "HR 确认英文沟通能力是重点，需要补一页英文自我介绍要点。",
    },
    {
      userId: existingUser.id,
      applicationId: app5.id,
      noteType: "general",
      content: "Offer 看中团队业务深度，但地点与长期方向还要再考虑。",
    },
  ]);

  await db.insert(offers).values({
    userId: existingUser.id,
    applicationId: app5.id,
    location: "杭州",
    team: "商家增长",
    responseDeadlineAt: new Date("2026-04-22T18:00:00+08:00"),
    decisionStatus: "pending",
    baseSalary: 280000,
    bonus: 20000,
    pros: "业务成熟，团队带教强。",
    cons: "地点需要再权衡。",
  });

  console.log("Seed completed successfully.");
  console.log(`Demo account: ${demoEmail} / ${demoPassword}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
